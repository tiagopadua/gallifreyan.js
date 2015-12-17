module.exports = function(grunt) {

    // Insert inline files on "// !include file.ext" or "/* !include file.ext */"
    // TODO: detect and block recursive includes
    function embedIncludes(content, matches) {
        // Helper function; it's called twice in this function
        function hasEmbededIncludes(content) {
            return content.match(/\/(\/|\*)( )?\!(include|embed) ([a-z0-9\-\_\.\/]+( +)?(\*\/)?)/ig);
        }

        matches = matches || hasEmbededIncludes(content);
        var i = 0,
            l = matches ? matches.length : 0,
            file = null,
            currentMatch = null,
            fs = require('fs');

        for (i=0; i<l; i++) {
            currentMatch = matches[i];

            // Extract filename
            file = currentMatch.replace(/\/(\/|\*)( )?\!(include|embed) /, '');
            var isHtml = (file.indexOf('.htm') === (file.length - 4)) || (file.indexOf('.html') === (file.length - 5));
            // Read file
            file = fs.readFileSync(file);
            file = file + ""; // Convert to string if got anything else
            if (isHtml) {
                file = file.replace(/\\/g, '\\\\').replace(/"/g, '\\\"').replace(/'/g, "\\\'").replace(/\n/g, ' ');
            }

            // Insert the content inline
            content = content.replace(currentMatch, file);
        }

        matches = hasEmbededIncludes(content);
        return (matches && matches.length) ? embedIncludes(content, matches) : content;
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['Gruntfile.js', 'src/**/*.js']
        },
        concat: {
            dist: {
                options: {
                    separator: "\n",
                    process: function (content, srcpath) {
                        return embedIncludes(content);
                    }
                },
                src: 'src/js/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            my_target: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
                }
            }
        },
        shell: {
            publish: {
                // OK, nobody has my private key
                // TODO: receive the last value (destination) as grunt command-line argument (if possible)
                command: 'scp -r -i ~/dev/aws/ec2-private.pem dist ec2-user@ec2-52-21-171-112.compute-1.amazonaws.com:~/gallifreyan.js/'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
    grunt.registerTask('publish', ['default', 'shell:publish']);
};
