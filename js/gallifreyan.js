// Organize everything in the object 'gallifreyan', and inside an anonymous function
(function($, undefined) {

    Math.TWOPI = 2 * Math.PI;
    Math.HALFPI = Math.PI / 2;
    Math.THREEQUARTERSPI = Math.PI + Math.HALFPI

    $.draw_guidelines = true;
    $.guideline_color = "#333333";


/*************************** BASE DRAWING OBJECT *****************************/
    $.Graphic = function(targetCanvas) {
        this.name = "Graphic";
        this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
        this.line_color = "#ffffff";
        this.line_width = 1;
    }
    $.Graphic.prototype._draw = function(ctx) {
        // Intended to be inherited/overwritten
        ctx.strokeStyle = this.line_color;
        ctx.lineWidth = this.line_width;
        ctx.lineCap = "round";
    }
    $.Graphic.prototype.draw = function(canvas) {
        if (typeof canvas !== 'undefined') {
            this.canvas = canvas;
        }
        if ((typeof this.canvas === 'undefined') || (this.canvas === null)) {
            return;
        }
        context = this.canvas.getContext("2d");
        //context.shadowBlur = 10;
        //context.shadowColor = "#ffff88";
        context.beginPath();
        this._draw(context);
        context.stroke();
    }


/******************************* POINT ***************************************/
    $.Point = function(x, y) {
        this.name = "Point";
        this.x = typeof x !== 'undefined' ? x : 0;
        this.y = typeof y !== 'undefined' ? y : 0;
    }
    $.Point.prototype = new gallifreyan.Graphic();
    $.Point.prototype._pre_draw = $.Point.prototype._draw;
    $.Point.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        // Actually draw a circle with almost-zero radius
        var radius = this.line_width / 2.01;
        ctx.arc(this.x, this.y, radius, 0, Math.TWOPI);
    }


/******************************** LINE ***************************************/
    $.Line = function(ax, ay, bx, by) {
        this.name = "Line";
        this.begin = new $.Point(ax, ay);
        this.end = new $.Point(bx, by);
    }
    $.Line.prototype = new gallifreyan.Graphic();
    $.Line.prototype._pre_draw = $.Line.prototype._draw;
    $.Line.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.moveTo(this.begin.x, this.begin.y);
        ctx.lineTo(this.end.x, this.end.y);
    }
    $.Line.prototype.boxContains = function(point) {
        if (typeof point === 'undefined') {
            return false;
        }
        var min_x = 0;
        var max_x = 0;
        var min_y = 0;
        var max_y = 0;
        if (this.begin.x < this.end.x) {
            min_x = this.begin.x;
            max_x = this.end.x;
        } else {
            min_x = this.end.x;
            max_x = this.begin.x;
        }
        if (this.begin.y < this.end.y) {
            min_y = this.begin.y;
            max_y = this.end.y;
        } else {
            min_y = this.end.y;
            max_y = this.begin.y;
        }

        return ((point.x >= min_x && point.x <= max_x) && (point.y >= min_y && point.y <= max_y));
    }


/******************************* CIRCLE **************************************/
    $.Circle = function(x, y, r) {
        this.name = "Circle";
        this.center = new $.Point(x, y);
        this.radius = typeof r !== 'undefined' ? r : 1;
    }
    $.Circle.prototype = new gallifreyan.Graphic();
    $.Circle.prototype._pre_draw = $.Circle.prototype._draw;
    $.Circle.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.TWOPI);
    }
    $.Circle.prototype.intersectPoints = function(target) {
        var default_result = [];

        // Discover the target type
        if (typeof target === 'undefined' || target == null) {
            return default_result;
        }
        if (typeof target.name === 'undefined' || target.name == null) {
            return default_result;
        }

        if (target.name == 'Circle') {
            return isect_circle_circle(this, target);
        }
        return default_result;
    }


/******************************** ARC ****************************************/
    $.Arc = function(x, y, r, begin, end) {
        this.name = "Arc";
        this.circle = new $.Circle(x, y, r)
        this.begin_angle = typeof begin !== 'undefined' ? begin : 0;
        this.end_angle = typeof end !== 'undefined' ? end : Math.TWOPI;
    }
    $.Arc.prototype = new gallifreyan.Graphic();
    $.Arc.prototype._pre_draw = $.Arc.prototype._draw;
    $.Arc.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.begin_angle, this.end_angle);
    }
    $.Arc.prototype.intersectPoints = function(target) {
        var i = null;
        var point = null;
        var default_result = [];

        // Discover the target type
        if (typeof target === 'undefined') {
            return default_result;
        }
        if (typeof target.name === 'undefined') {
            return default_result;
        }

        if (target.name == 'Line') {
            isect_points = isect_line_circle(target, this.circle);
            result = [];
            for (i in isect_points) {
                point = isect_points[i];
                if (this.containsPoint(point) && target.boxContains(point)) {
                    result.push(point);
                }
            }
            return result;
        } else if (target.name == 'Circle') {
            isect_points = isect_circle_circle(this.circle, target);
            result = [];
            for (i in isect_points) {
                point = isect_points[i];
                if (this.containsPoint(point)) {
                    result.push(point);
                }
            }
            return result;
        } else if (target.name == 'Arc') {
            isect_points = isect_circle_circle(this.circle, target.circle);
            result = [];
            for (i in isect_points) {
                point = isect_points[i];
                if (this.containsPoint(point) && target.containsPoint(point)) {
                    result.push(point);
                }
            }
            return result;
        }

        return default_result;
    }
    $.Arc.prototype.containsPoint = function(point) {
        if (typeof point === 'undefined') {
            return false;
        }
        angle = Math.atan2(point.y - this.circle.center.y, point.x - this.circle.center.x);
        if ((angle >= this.begin_angle) && (angle <= this.end_angle)) {
            return true;
        }
        return false;
    }


/******************************* SENTENCE ************************************/
    $.Sentence = function(text, left, top, size) {
        this.text = typeof text !== 'undefined' ? text : '';
        this.size = typeof size !== 'undefined' ? size : 300;
        this.left = typeof left !== 'undefined' ? left : 0;
        this.top = typeof top !== 'undefined' ? top : 0;
        this.center_x = this.left + this.size/2;
        this.center_y = this.top + this.size/2;
        this.outside_circle = new $.Circle(this.center_x, this.center_y, this.size/2);
        this.inside_circle = new $.Circle(this.center_x, this.center_y, this.size/2-6);
        this.words = [];
        this.setText(text);
    }
    $.Sentence.prototype.draw = function(canvas) {
        var i = null;
        var arc = null;
        var word = null;
        this.outside_circle.draw(canvas);
        this.inside_circle.draw(canvas);
        for (i in this.words) {
            this.words[i].draw(canvas);
        }
    }
    $.Sentence.prototype.setText = function(text) {
        var i = null;
        var w = null;
        var w_object = null;
        this.words = [];
        this.text = text.trim();

        word_list = this.text.split(' ');
        for (i in word_list) {
            w = word_list[i];
            w_object = new $.Word(w, this.left + this.size/2, this.top + this.size/2);
            this.words.push(w_object);
        }
    }


/*********************************** WORD ************************************/
    $.Word = function(text, center_x, center_y, max_diameter) {
        this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 250;
        this.radius = this.max_diameter / 2;
        this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
        this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
        this.circle = new $.Circle(this.x, this.y, this.radius);
        this.circle.line_color = $.guideline_color;
        this.circle.line_width = 1;
        this.arcs_circle = new $.Circle(this.x, this.y, this.radius);
        this.arcs_circle.line_color = $.guideline_color;
        this.arcs_circle.line_width = 1;
        this.arcs = [new $.Arc(this.x, this.y, this.radius, 0, Math.TWOPI)];
        this.text = "";
        this.chars = [];
        this.setText(text);
    }
    $.Word.prototype.draw = function(canvas) {
        var i = null;
        var arc = null;
        for (i in this.arcs) {
            arc = this.arcs[i];
            arc.draw(canvas);
        }
        for (i in this.chars) {
            this.chars[i].draw(canvas);
        }
        if ($.draw_guidelines) {
            this.circle.draw(canvas);
        }
    }
    $.Word.prototype.setText = function(text) {
        this.text = text = text.trim().split(' ')[0];
        this.chars = [];
        var last_len = 0;
        var c = null;
        do {
            c = new $.Char(text);
            console.log("  ", c.main, "x", c.main_count, "  |  ", c.secondary, "x", c.secondary_count);
            this.chars.push(c);
            last_len = text.length;
            text = text.substr(c.main.length*c.main_count + c.secondary.length*c.secondary_count);
        } while ((text.length > 0) && (last_len != text.length));

        this.setDimensions();
    }
    $.Word.prototype.setDimensions = function() {
        if (!this.chars || this.chars.length <= 0) {
            return;
        }

        // Split homogeneously the word circle, to fit exactly all char circles
        var char_max_diameter = 20;
        if (this.chars.length == 1) {
            this.arcs_circle.center.y = this.y - this.radius*.3;
            this.arcs_circle.radius = this.radius * .7;
            char_max_diameter = this.max_diameter * .6;
        } else {
            this.arcs_circle.center.y = this.y;

            var alpha = (Math.TWOPI / this.chars.length) / 2;
            var sin_alpha = Math.sin(alpha);

            char_max_diameter = 2 * this.radius * sin_alpha / (sin_alpha + 1);
            this.arcs_circle.radius = this.radius - (char_max_diameter / 2);
        }

        // Position the char
        var i = null;
        var j = null;
        var current_angle = Math.PI / 2; // Start on the bottom
        var angle_increment = -Math.TWOPI / this.chars.length; // Then go counter-clockwise
        var arcs_angles = [];
        var is_first_intersect = true;
        var first_envolves_HALFPI = true;
        var first_angle = null;
        for (i in this.chars) {
            var c = this.chars[i];
            // Dont use the methods 'setX' and 'setY' to avoid re-calculating everything
            var up_angle = current_angle + Math.PI;
            c.up_vector = new $.Point(Math.cos(up_angle), Math.sin(up_angle));
            c.word_circle = this.arcs_circle;
            c.x = this.arcs_circle.center.x + this.arcs_circle.radius * Math.cos(current_angle);
            c.y = this.arcs_circle.center.y + this.arcs_circle.radius * Math.sin(current_angle);
            c.setMaxDiameter(char_max_diameter); // Now re-calculate

            // Now check for intersections with the word line
            var isect_points = c.ownerIntersect(this.arcs_circle);
            if (isect_points.length == 2) {
                isect_points.sort(function(a,b){return b-a});
                if (is_first_intersect) {
                    is_first_intersect = false;
                    var p = isect_points[0];
                    var a = Math.atan2(p.y - this.arcs_circle.center.y, p.x - this.arcs_circle.center.x);
                    first_angle = normalize_angle(a, -Math.THREEQUARTERSPI) - Math.TWOPI;
                    p = isect_points[1];
                    a = Math.atan2(p.y - this.arcs_circle.center.y, p.x - this.arcs_circle.center.x);
                    arcs_angles.push(normalize_angle(a, -Math.THREEQUARTERSPI));
                } else {
                    for (j in isect_points) {
                        var p = isect_points[j];
                        var a = Math.atan2(p.y - this.arcs_circle.center.y, p.x - this.arcs_circle.center.x);
                        arcs_angles.push(normalize_angle(a, -Math.THREEQUARTERSPI));
                    }
                }
            }

            current_angle += angle_increment;
        }
        if (first_angle) {
            arcs_angles.push(first_angle);
        }

        // Order the arcs angles
        arcs_angles.sort(function(a,b) {
            return b-a;
        });
        // Add the angles to the list
        if (arcs_angles.length > 0) {
            // TODO: needs to process chars which envolves the PI
            this.arcs = [];
            for (i=1; i<arcs_angles.length-1; i+=2) {
                this.addArc(arcs_angles[i], arcs_angles[i+1]);
            }
            if (arcs_angles.length >= 2) {
                this.addArc(arcs_angles[arcs_angles.length-1], arcs_angles[0]);
            }
        } else {
            this.arcs = [ new $.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, 0, Math.TWOPI) ];
        }
    }
    $.Word.prototype.addArc = function(begin_angle, end_angle) {
        this.arcs.push(new $.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, begin_angle, end_angle));
    }


/*********************************** CHAR ************************************/
// This can be a single character, repeated "n" times and/or followed by
// a vowel (which could also be repeated "n" times)
    $.Char = function(text, center_x, center_y, max_diameter, up_vector, owner_circle) {
        this.draw_objects = [];
        this.max_circle = null;
        this.owner_intersect_object = null;
        this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
        this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
        this.up_vector = typeof up_vector !== 'undefined' ? up_vector : new $.Point(0, -1);
        this.word_circle = typeof owner_circle !== 'undefined' ? owner_circle : new $.Circle(0, 0, 1);
        this.main = "";
        this.main_count = 0;
        this.secondary = "";
        this.secondary_count = 0;
        this.text = "";
        this.getFirstChar(text);
        this.setMaxDiameter(max_diameter);
    }
    $.Char.prototype.setX = function(new_x) {
        this.x = typeof new_x !== 'undefined' ? new_x : this.radius;
        this.loadObjects();
    }
    $.Char.prototype.setY = function(new_y) {
        this.y = typeof new_y !== 'undefined' ? new_y : this.radius;
        this.loadObjects();
    }
    $.Char.prototype.setMaxDiameter = function(max_diameter) {
        this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 50;
        this.radius = this.max_diameter / 2;
        this.consonant_radius = this.radius * .45; // 90% of the max radius = the diameter of the consonant circle
        this.vowel_radius = this.consonant_radius * .2; // 20%
        if (!this.max_circle) {
            this.max_circle = new $.Circle();
        }
        this.max_circle.center.x = this.x;
        this.max_circle.center.y = this.y;
        this.max_circle.radius = this.max_diameter/2;
        this.max_circle.line_color = $.guideline_color;
        this.max_circle.line_width = 1;
        this.loadObjects();
    }
    $.Char.prototype.draw = function(canvas) {
        var i = null;
        for (i in this.draw_objects) {
            this.draw_objects[i].draw(canvas);
        }
        if ($.draw_guidelines && this.max_circle) {
            this.max_circle.draw(canvas);
        }
    }
    $.Char.prototype.loadObjects = function() {
        this.draw_objects = [];
        // Primary
        if (!this.main || this.main.length <= 0 || this.main_count <= 0) {
            return;
        }
        if (/^([bdfgh]|ch)$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'ch') { modifier = '2dots'; }
            else if (this.main == 'd') { modifier = '3dots'; }
            else if (this.main == 'f') { modifier = '3stripes'; }
            else if (this.main == 'g') { modifier = '1stripe'; }
            else if (this.main == 'h') { modifier = '2stripes'; }
            this.loadB(modifier);
        } else if (/^[jklmnp]$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'k') { modifier = '2dots'; }
            else if (this.main == 'l') { modifier = '3dots'; }
            else if (this.main == 'm') { modifier = '3stripes'; }
            else if (this.main == 'n') { modifier = '1stripe'; }
            else if (this.main == 'p') { modifier = '2stripes'; }
            this.loadJ(modifier);
        } else if (/^([trsvw]|sh)$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'sh') { modifier = '2dots'; }
            else if (this.main == 'r') { modifier = '3dots'; }
            else if (this.main == 's') { modifier = '3stripes'; }
            else if (this.main == 'v') { modifier = '1stripe'; }
            else if (this.main == 'w') { modifier = '2stripes'; }
            this.loadT(modifier);
        } else if (/^([yzx]|th|ng|qu)$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'y') { modifier = '2dots'; }
            else if (this.main == 'z') { modifier = '3dots'; }
            else if (this.main == 'ng') { modifier = '3stripes'; }
            else if (this.main == 'qu') { modifier = '1stripe'; }
            else if (this.main == 'x') { modifier = '2stripes'; }
            this.loadTH(modifier);
        } else if (/^[aeiou]$/i.test(this.main)) {
            this.loadVowel();
        } else {
            this.loadOther();
        }

        // Secondary
        if (!this.secondary || this.secondary.length <= 0 || this.secondary_count <= 0) {
            return;
        }
    }
    $.Char.prototype.loadArc = function(modifier, circle) {
        // Check intersection points to discover the angles for the arc
        var arc_begin = 0;
        var arc_end = Math.TWOPI;
        // I don't know why the points always comes on the correct order to draw the circle
        // Maybe on other browsers it doesn't work. TODO: check it out
        var isects = circle.intersectPoints(this.word_circle);
        if (isects.length == 2) {
            this.owner_intersect_object = circle;
            var first_angle = Math.atan2(isects[0].y - circle.center.y, isects[0].x - circle.center.x);
            var second_angle = Math.atan2(isects[1].y - circle.center.y, isects[1].x - circle.center.x);
            var up_angle = Math.atan2(this.up_vector.y, this.up_vector.x);
            arc_begin = first_angle;
            arc_end = second_angle;
        }

        var a = new $.Arc();
        a.circle = circle;
        a.begin_angle = arc_begin;
        a.end_angle = arc_end;
        this.draw_objects.push(a);
    }
    $.Char.prototype.loadB = function(modifier) {
        var offset_distance = this.consonant_radius * .9;
        var c = new $.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
        this.loadArc(modifier, c);
    }
    $.Char.prototype.loadJ = function(modifier) {
        var offset_distance = this.radius * .55;
        var c = new $.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
        this.draw_objects.push(c);
    }
    $.Char.prototype.loadT = function(modifier) {
        var offset_distance = -this.consonant_radius * .6;
        var c = new $.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
        this.loadArc(modifier, c);
    }
    $.Char.prototype.loadTH = function(modifier) {
        var c = new $.Circle(this.x, this.y, this.consonant_radius);
        this.draw_objects.push(c);
        //this.owner_intersect_object = c;
    }
    $.Char.prototype.loadVowel = function() {
        var p = new $.Point(this.x, this.y);
        p.line_color = "#00ffff";
        p.line_width = 8;
        this.draw_objects.push(p);
    }
    $.Char.prototype.loadOther = function() {
        var p = new $.Point(this.x, this.y);
        p.line_color = "#ff0000";
        p.line_width = 8;
        this.draw_objects.push(p);
    }
    $.Char.prototype.ownerIntersect = function(owner_object) {
        return isect_circle_circle(this.owner_intersect_object, owner_object);
    }
    $.Char.prototype.getFirstChar = function(text) {
        this.main = "";
        this.main_count = 0;
        this.secondary = "";
        this.secondary_count = 0;
        if (text == null || text.length <= 0) {
            return;
        }

        var vowels = /^[aeiou]/i;
        var single_consonants = /^[bcdfghjklmnprstvwxyz]/i;
        var double_consonants = /^(th|ch|sh|ng|qu)/i;
        var c = text[0];
        if (vowels.test(c)) {
            this.main = c;
            this.main_count = this.countCharRepeat(text);
        } else {
            var d = text.substr(0,2);
            if (double_consonants.test(d)) {
                this.main = d;
                this.main_count = 1;
            } else if (single_consonants.test(c)) {
                this.main = c;
                this.main_count = this.countCharRepeat(text);
            }

            var vowel_index = this.main.length * this.main_count;
            if (text.length > vowel_index) {
                c = text[vowel_index]; // get secondary char if there is one
                if (vowels.test(c)) {
                    this.secondary = c;
                    this.secondary_count = this.countCharRepeat(text, vowel_index);
                }
            }
        }
    }
    $.Char.prototype.countCharRepeat = function(text, start_index) {
        start_index = typeof start_index !== 'undefined' ? start_index : 0;
        var i = 0;
        var count = 0;
        var c = null;
        if (start_index >= text.length) {
            return 0;
        }
        for (i=start_index; i<text.length; i++) {
            if (i == start_index) {
                c = text[i];
                count = 1;
            } else if (c == text[i]) {
                count += 1;
            } else {
                break;
            }
        }
        return count;
    }


/********************************** UTIL *************************************/
    function bhaskara(A, B, C) {
        // If A=0, then it is NOT a second degree polynomial
        if (A != 0) {
            var delta = B*B - 4*A*C;
            if (delta < 0) {
                return [];
            }
            sqrt_delta = Math.sqrt(delta);
            r1 = (-B + sqrt_delta) / (2*A);
            r2 = (-B - sqrt_delta) / (2*A);
            return [ r1, r2 ];
        } else if (B != 0) {
            return [ -C / B ]
        }
        return [];
    }
    function normalize_angle(angle, start_angle) {
        // Converts any "angle" to the range beginning at the "start_angle" and ending in "start_angle" + 360 degrees
        while (angle < start_angle) {
            angle += Math.TWOPI;
        }
        end_angle = start_angle + Math.TWOPI;
        while (angle > end_angle) {
            angle -= Math.TWOPI;
        }
        return angle;
    }


/***************************** INTERSECTIONS *********************************/
    function isect_line_circle(line, circle) {
        default_result = [];

        // Line: y = ax + b
        // Circle: (x − p)^2 + (y − q)^2 = r^2
        // p = circle.center.x
        // q = circle.center.y
        // r = circle.radius

        var point1 = new $.Point();
        var point2 = new $.Point();
        var A = 0;
        var B = 0;
        var C = 0;
        var q2 = circle.center.y * circle.center.y;
        var p2 = circle.center.x * circle.center.x;
        var r2 = circle.radius * circle.radius;

        // Check if it is (or almost is) a VERTICAL LINE
        if (Math.abs(line.begin.x - line.end.x) < 0.000001) { 
            // In vertical lines, the "a" parameter is infinite (or too big)
            // In this case, the usual algorithm does not work
            var x = line.begin.x;
            A = 1;
            B = -2 * circle.center.y;
            C = x*x - 2*x*circle.center.x + p2 + q2 - r2;

            var y_points = bhaskara(A, B, C);
            if (y_points.length != 2) {
                return default_result;
            }

            point1.x = x;
            point1.y = y_points[0];

            point2.x = x;
            point2.y = y_points[1];
        } else {
            var a = (line.end.y - line.begin.y) / (line.end.x - line.begin.x);
            var b = line.begin.y - (a * line.begin.x);
            A = a*a + 1;
            B = 2*(a*b - a*circle.center.y - circle.center.x);
            C = (p2 + q2 - r2 - (2*b*circle.center.y) + b*b);

            var x_points = bhaskara(A, B, C);
            if (x_points.length != 2) {
                return default_result;
            }

            point1.x = x_points[0];
            point1.y = a*point1.x + b;

            point2.x = x_points[1];
            point2.y = a*point2.x + b;
        }

        return [ point1, point2 ];
    }

    function isect_circle_circle(circle1, circle2) {
        default_result = [];

        if (!circle1 || !circle2) {
            return default_result;
        }

        // Intersection between circles
        var mid_x = circle1.center.x - circle2.center.x;
        var mid_y = circle1.center.y - circle2.center.y;
        var d = Math.sqrt(mid_x*mid_x + mid_y*mid_y);
        if ((d < 0.000001) || // consider 5 digits, just for approximation
            (d > (circle1.radius + circle2.radius)) ||
            (d < Math.abs(circle1.radius - circle2.radius))) {
            return default_result;
        }

        var r02 = circle1.radius * circle1.radius;
        var r12 = circle2.radius * circle2.radius;
        var a = (r02 - r12 + d*d) / (d + d);
        var h = Math.sqrt(r02 - a*a);

        var p2 = new $.Point();
        var p3_a = new $.Point();
        var p3_b = new $.Point();

        var a_d = a / d;
        var x_diff = circle2.center.x - circle1.center.x;
        var y_diff = circle2.center.y - circle1.center.y;
        p2.x = circle1.center.x + (a_d * x_diff);
        p2.y = circle1.center.y + (a_d * y_diff);

        var h_d = h / d;
        p3_a.x = p2.x + (h_d * y_diff);
        p3_b.x = p2.x - (h_d * y_diff);
        p3_a.y = p2.y - (h_d * x_diff);
        p3_b.y = p2.y + (h_d * x_diff);

        return [ p3_a, p3_b ];
    }

    
/******************************** TEST ***************************************/
    $.drawTest = function(canvas) {
        //var s = new $.Sentence('jbthjbthjbth', 100, 100);
        var s = new $.Sentence('jbtht', 100, 100);
        //var s = new $.Sentence('abajatatha chekesheye dilirizi fomosongo gunuvuquu hapawaxa', 4, 296);
        s.draw(canvas);
    }


}(window.gallifreyan = window.gallifreyan || {}));
