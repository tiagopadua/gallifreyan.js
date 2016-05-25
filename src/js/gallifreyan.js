(function (context) {

    // Organize everything in the object 'gallifreyan'
    var PUBLIC = context.gallifreyan || {};
    context.gallifreyan = PUBLIC;
    
    // The PRIVATE object is not accessible by the user
    var PRIVATE = {};
    
    // Just assign these values. It could useful for everyone.
    Math.TWOPI = 2 * Math.PI;
    Math.HALFPI = Math.PI / 2;
    Math.THREEQUARTERSPI = Math.PI + Math.HALFPI;
    
    PUBLIC.options = {
        guidelinesEnabled: false,
        guidelinesColor: "#000000"
    };
    
    /*****************************************************************************
     *     The files below are included by 'grunt' (processed on Gruntfile.js)   *
     *****************************************************************************/
    
    // !include src/js/graphic/graphic.js
    // !include src/js/graphic/point.js
    // !include src/js/graphic/line.js
    // !include src/js/graphic/circle.js
    // !include src/js/graphic/arc.js
    // !include src/js/translation/sentence.js
    // !include src/js/translation/word.js
    // !include src/js/translation/char.js
    // !include src/js/util.js

})(this); // usually, 'this = window;' but sometimes the user may want to include inside his own code
