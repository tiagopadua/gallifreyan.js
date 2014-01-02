// Organize everything in the object 'gallifreyan', and inside an anonymous function
(function($, undefined) {

    Math.TWOPI = 2 * Math.PI;

    $.draw_guidelines = true;
    $.guideline_color = "#333333";


/*************************** BASE DRAWING OBJECT *****************************/
    $.Graphic = function(targetCanvas) {
        this.name = "Graphic";
        this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
        this.line_color = "#ffffff";
        this.line_width = 2;
    }
    $.Graphic.prototype._draw = function(ctx) {
        // Intended to be inherited/overwritten
        ctx.strokeStyle = this.line_color;
        ctx.lineWidth = this.line_width;
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
        var radius = this.line_width / 2.1;
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
            //console.log("[[[", w, "]]]");
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

        var char_max_diameter = 20;
        if (this.chars.length == 1) {
            this.arcs_circle.center.y = this.y - this.radius*.3;
            this.arcs_circle.radius = this.radius * .7;
            this.arcs = [ new $.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, 0, Math.TWOPI) ];
            char_max_diameter = this.max_diameter * .6;
        } else {
            this.arcs_circle.center.y = this.y;

            var alpha = (Math.TWOPI / this.chars.length) / 2;
            var sin_alpha = Math.sin(alpha);

            char_max_diameter = 2 * this.radius * sin_alpha / (sin_alpha + 1);
            this.arcs_circle.radius = this.radius - (char_max_diameter / 2);
            this.arcs = [ new $.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, 0, Math.TWOPI) ];
        }

        var i = null;
        var current_angle = Math.PI / 2; // Start on the bottom
        var angle_increment = -Math.TWOPI / this.chars.length; // Then go counter-clockwise
        for (i in this.chars) {
            var c = this.chars[i];
            c.x = this.arcs_circle.center.x + this.arcs_circle.radius * Math.cos(current_angle);
            c.y = this.arcs_circle.center.y + this.arcs_circle.radius * Math.sin(current_angle);
            c.setMaxDiameter(char_max_diameter);
            current_angle += angle_increment;
        }
    }



/*********************************** CHAR ************************************/
// This can be a single character, repeated "n" times and/or followed by
// a vowel (which could also be repeated "n" times)
    $.Char = function(text, center_x, center_y, max_diameter) {
        this.setMaxDiameter(max_diameter);
        this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
        this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
        this.max_circle = null;
        this.draw_objects = [];
        this.main = "";
        this.main_count = 0;
        this.secondary = "";
        this.secondary_count = 0;
        this.text = "";
        this.getFirstChar(text);
    }
    $.Char.prototype.setMaxDiameter = function(max_diameter) {
        this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 50;
        this.radius = this.max_diameter / 2;
        this.consonant_radius = this.radius * .45; // 90% of the max radius = the diameter of the consonant radius
        this.vowel_radius = this.consonant_radius * .2; // 20%
        this.max_circle = new $.Circle(this.x, this.y, this.max_diameter/2);
        this.max_circle.line_color = $.guideline_color;
        this.max_circle.line_width = 1;
    }
    $.Char.prototype.draw = function(canvas) {
        this.loadObjects();
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
            var p = new $.Point(this.x, this.y);
            p.line_color = "#ffff00";
            p.line_width = 8;
            this.draw_objects.push(p);
        } else if (/^[jklmnp]$/i.test(this.main)) {
            var c = new $.Circle(this.x, this.y-this.radius*.55, this.radius * .45);
            this.draw_objects.push(c);
        } else if (/^([trsvw]|sh)$/i.test(this.main)) {
            var p = new $.Point(this.x, this.y);
            p.line_color = "#00ff00";
            p.line_width = 8;
            this.draw_objects.push(p);
        } else if (/^([yzx]|th|ng|qu)$/i.test(this.main)) {
            var c = new $.Circle(this.x, this.y, this.radius * .7);
            this.draw_objects.push(c);
        } else {
            var p = new $.Point(this.x, this.y);
            p.line_color = "#ff0000";
            p.line_width = 8;
            this.draw_objects.push(p);
        }

        // Secondary
        if (!this.secondary || this.secondary.length <= 0 || this.secondary_count <= 0) {
            return;
        }
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


/******************************** TEST ***************************************/
    $.drawTest = function(canvas) {
        point = new $.Point(10, 10);
        point.line_color = "#ff0000";
        point.draw(canvas);

        line = new $.Line(100, 0, 100, 250);
        line.canvas = canvas;
        line.line_color = "#ffcc00";
        line.draw();

        circle = new $.Circle(30, 100, 20);
        circle.canvas = canvas;
        circle.line_color = "#ccff00";
        circle.draw();

        arc = new $.Arc(170, 160, 75, -Math.PI/2, Math.PI);
        arc.canvas = canvas;
        arc.line_color = "#00ffcc";
        arc.draw();

        arc2 = new $.Arc(180, 200, 70, -2*Math.PI/3, 2*Math.PI/3);
        arc2.canvas = canvas;
        arc2.line_color = "#00ff00";
        arc2.draw();

        points = arc.intersectPoints(arc2);
        for (p in points) {
            p1 = new $.Point(points[p].x, points[p].y);
            p1.canvas = canvas;
            p1.line_color = "#ff2200";
            p1.draw();
        }

        points = arc.intersectPoints(line);
        for (p in points) {
            p1 = new $.Point(points[p].x, points[p].y);
            p1.canvas = canvas;
            p1.line_color = "#ff2200";
            p1.draw();
        }

        var s = new $.Sentence('jtbth', 4, 296);
        //var s = new $.Sentence('abajatatha chekesheye dilirizi fomosongo gunuvuquu hapawaxa', 4, 296);
        s.draw(canvas);
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

}(window.gallifreyan = window.gallifreyan || {}));
