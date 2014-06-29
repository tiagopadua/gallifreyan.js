// Organize everything in the object 'gallifreyan', and inside an anonymous function
(function(SELF, undefined) {

    Math.TWOPI = 2 * Math.PI;
    Math.HALFPI = Math.PI / 2;
    Math.THREEQUARTERSPI = Math.PI + Math.HALFPI

    SELF.draw_guidelines = false;
    SELF.guideline_color = "#999933";


/*************************** BASE DRAWING OBJECT *****************************/
    SELF.Graphic = function(targetCanvas) {
        this.name = "Graphic";
        this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
        this.line_color = "#ffffff";
        //this.line_color = "#87b8e7";
        this.line_width = 2;
        this.visible = true;
    }
    SELF.Graphic.prototype._draw = function(ctx) {
        // Intended to be inherited/overwritten
        ctx.strokeStyle = this.line_color;
        ctx.lineWidth = this.line_width;
        ctx.lineCap = "round";
    }
    SELF.Graphic.prototype.draw = function(canvas) {
        if (!this.visible) {
            return;
        }
        if (typeof canvas !== 'undefined') {
            this.canvas = canvas;
        }
        if ((typeof this.canvas === 'undefined') || (this.canvas === null)) {
            return;
        }
        context = this.canvas.getContext("2d");
        //context.shadowBlur = 5;
        //context.shadowColor = "rgba(255,255,0,.4)";
        //context.shadowColor = "rgba(60,180,220,.4)";
        //context.shadowColor = "rgba(0,0,0,.5)";
        //context.shadowOffsetX = 4;
        //context.shadowOffsetY = 4;
        context.beginPath();
        this._draw(context);
        context.stroke();
    }


/******************************* POINT ***************************************/
    SELF.Point = function(x, y, size) {
        this.name = "Point";
        this.x = typeof x !== 'undefined' ? x : 0;
        this.y = typeof y !== 'undefined' ? y : 0;
        if (typeof size === 'number') {
            this.line_width = size;
        }
    }
    SELF.Point.prototype = new gallifreyan.Graphic();
    SELF.Point.prototype._pre_draw = SELF.Point.prototype._draw;
    SELF.Point.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        // Actually draw a circle with almost-zero radius
        var radius = this.line_width / 2.01;
        ctx.arc(this.x, this.y, radius, 0, Math.TWOPI);
    }
    SELF.Point.prototype.moveXY = function(delta_x, delta_y) {
        this.x += delta_x;
        this.y += delta_y;
        return this;
    }
    SELF.Point.prototype.move = function(angle, length) {
        this.moveXY(Math.cos(angle) * length,
                    Math.sin(angle) * length);
        return this;
    }
    SELF.Point.prototype.isMouseOver = function(mouse_x, mouse_y) {
        var half_width = this.line_width / 2;
        if (((mouse_x - half_width) < mouse_x) && ((mouse_x + half_width) > mouse_x)) {
            if (((mouse_y - half_width) < mouse_y) && ((mouse_y + half_width) > mouse_y)) {
                return true;
            }
        }
        return false;
    }


/******************************** LINE ***************************************/
    SELF.Line = function(ax, ay, bx, by) {
        this.name = "Line";
        this.begin = new SELF.Point(ax, ay);
        this.end = new SELF.Point(bx, by);
    }
    SELF.Line.prototype = new gallifreyan.Graphic();
    SELF.Line.prototype._pre_draw = SELF.Line.prototype._draw;
    SELF.Line.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.moveTo(this.begin.x, this.begin.y);
        ctx.lineTo(this.end.x, this.end.y);
    }
    SELF.Line.prototype.boxContains = function(point) {
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
    SELF.Line.prototype.intersectPoints = function(target) {
        var default_result = [];

        // Discover the target type
        if (typeof target === 'undefined' || target == null) {
            return default_result;
        }
        if (typeof target.name === 'undefined' || target.name == null) {
            return default_result;
        }

        if (target.name == 'Circle') {
            var result = [];
            var isects = isect_line_circle(this, target);
            for (var i in isects) {
                var p = isects[i];
                if (this.boxContains(p)) {
                    result.push(p);
                }
            }
            return result;
        }
        return default_result;
    }
    SELF.Line.prototype.perpendicularMove = function(delta) {
        if (this.begin.x == this.end.x) {
            this.begin.y += delta;
        } else if (this.begin.y == this.end.y) {
            this.begin.x += delta;
        } else {
            var angle = Math.atan2(this.end.y - this.begin.y,
                                   this.end.x - this.begin.x);
            this.begin.move(angle + Math.HALFPI, delta);
            this.end.move(angle + Math.HALFPI, delta);
        }
        return this;
    }
    SELF.Line.prototype.isMouseOver = function(mouse_x, mouse_y) {
        var threshold = Math.max(5, this.line_width / 2);
        var min_x = Math.min(this.begin.x, this.end.x) - threshold;
        var min_y = Math.min(this.begin.y, this.end.y) - threshold;
        var max_x = Math.max(this.begin.x, this.end.x) + threshold;
        var max_y = Math.max(this.begin.y, this.end.y) + threshold;
        if ( (mouse_x < min_x) || (mouse_y < min_y) || (mouse_x > max_x) || (mouse_y > max_y) ) {
            return false;
        }

        var dx = this.end.x - this.begin.x;
        var dy = this.end.y - this.begin.y;
        if (Math.abs(dx) > .001) {
            // Main line parameters
            var a = dy / dx;
            var b = this.begin.y - a * this.begin.x;
            
            // Mouse perpendicular line parameters
            var ma = Math.tan(Math.atan(a) + Math.HALFPI);
            var mb = mouse_y - (ma * mouse_x);

            var intersect_x = (mb - b) / (a - ma); // (a - ma) is never 0
            var intersect_y = a * intersect_x + b;

            return (points_distance(mouse_x, mouse_y, intersect_x, intersect_y) <= threshold);
        } else {
            // Main line parameters
            var a = dx / dy;
            var b = this.begin.x - a * this.begin.y;
            
            // Mouse perpendicular line parameters
            var ma = 0;
            var mb = 0;
            var intersect_x = 0;
            var intersect_y = 0;
            if (a > .001) {
                ma = Math.tan(Math.atan(a) + Math.HALFPI);
                mb = mouse_x - (ma * mouse_y);
                intersect_y = (mb - b) / (a - ma); // (a - ma) is never 0
                intersect_x = a * intersect_y + b;
            } else {
                ma = a;
                mb = mouse_y - (ma * mouse_x);
                intersect_y = (a*mb + b) / (1 + a*ma);
                intersect_x = (intersect_y - b) / a;
            }

            return (points_distance(mouse_x, mouse_y, intersect_x, intersect_y) <= threshold);
        }
        return false;
    }


/******************************* CIRCLE **************************************/
    SELF.Circle = function(x, y, r) {
        this.name = "Circle";
        this.center = new SELF.Point(x, y);
        this.radius = typeof r !== 'undefined' ? r : 1;
    }
    SELF.Circle.prototype = new gallifreyan.Graphic();
    SELF.Circle.prototype._pre_draw = SELF.Circle.prototype._draw;
    SELF.Circle.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.TWOPI);
    }
    SELF.Circle.prototype.intersectPoints = function(target) {
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
        } else if (target.name == 'Line') {
            return isect_line_circle(target, this);
        }
        return default_result;
    }
    SELF.Circle.prototype.isMouseOver = function(mouse_x, mouse_y) {
        var delta_x = mouse_x - this.center.x;
        var delta_y = mouse_y - this.center.y;
        var distance = Math.sqrt(delta_x*delta_x + delta_y*delta_y);

        var half_width = Math.max(5, this.line_width / 2);
        return ( (distance <= (this.radius + half_width)) &&
                 (distance >= (this.radius - half_width)) );
    }


/******************************** ARC ****************************************/
    SELF.Arc = function(x, y, r, begin, end) {
        this.name = "Arc";
        this.circle = new SELF.Circle(x, y, r)
        this.begin_angle = typeof begin !== 'undefined' ? begin : 0;
        this.end_angle = typeof end !== 'undefined' ? end : Math.TWOPI;
    }
    SELF.Arc.prototype = new gallifreyan.Graphic();
    SELF.Arc.prototype._pre_draw = SELF.Arc.prototype._draw;
    SELF.Arc.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.begin_angle, this.end_angle);
    }
    SELF.Arc.prototype.intersectPoints = function(target) {
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
    SELF.Arc.prototype.containsPoint = function(point) {
        if (typeof point === 'undefined') {
            return false;
        }
        angle = Math.atan2(point.y - this.circle.center.y, point.x - this.circle.center.x);
        if ((angle >= this.begin_angle) && (angle <= this.end_angle)) {
            return true;
        }
        return false;
    }
    SELF.Arc.prototype.isMouseOver = function(mouse_x, mouse_y) {
        if (!this.circle.isMouseOver(mouse_x, mouse_y)) {
            return false;
        }
        var mouse_angle = Math.atan2(mouse_y - this.circle.center.y, mouse_x - this.circle.center.x);

        var begin_angle = this.begin_angle;
        var end_angle = this.end_angle;
        while (begin_angle > end_angle) {
            begin_angle -= Math.TWOPI;
        }
        if ((end_angle > Math.PI) && (mouse_angle < (end_angle-Math.TWOPI))) {
            mouse_angle += Math.TWOPI;
        }
        if ((begin_angle < -Math.PI) && (mouse_angle > (begin_angle+Math.TWOPI))) {
            mouse_angle -= Math.TWOPI;
        }
        var match_angle = (mouse_angle >= begin_angle) && (mouse_angle <= end_angle);

        return match_angle;
    }


/******************************* SENTENCE ************************************/
    SELF.Sentence = function(text, left, top, size) {
        this.text = typeof text !== 'undefined' ? text : '';
        this.size = typeof size !== 'undefined' ? size : 300;
        this.left = typeof left !== 'undefined' ? left : 0;
        this.top = typeof top !== 'undefined' ? top : 0;
        this.center_x = this.left + this.size/2;
        this.center_y = this.top + this.size/2;
        this.outside_circle = new SELF.Circle(this.center_x, this.center_y, this.size/2);
        this.inside_circle = new SELF.Circle(this.center_x, this.center_y, this.size/2-6);
        this.words = [];
        this.setText(text);
    }
    SELF.Sentence.prototype.draw = function(canvas) {
        // clear first
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        var background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        background.addColorStop(0, '#00345c');
        background.addColorStop(1, '#001940');
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        var i = null;
        var arc = null;
        var word = null;
        this.outside_circle.draw(canvas);
        this.inside_circle.draw(canvas);
        for (i in this.words) {
            this.words[i].draw(canvas);
        }
    }
    SELF.Sentence.prototype.setText = function(text) {
        var i = null;
        var w = null;
        var w_object = null;
        this.words = [];
        this.text = text.trim();

        var usable_radius = this.inside_circle.radius * .95; // MAGIC NUMBER!
        var word_list = this.text.split(' ');
        if (word_list && word_list.length == 1) {
            w_object = new SELF.Word(word_list[0], this.center_x, this.center_y, usable_radius * 2);
            this.words.push(w_object);
        } else {
            var angle_increment = -Math.TWOPI / word_list.length;
            var current_angle = Math.PI / 2;

            var sin_angle2 = Math.abs(Math.sin(angle_increment/2));
            var word_radius = usable_radius * sin_angle2 / (1 + sin_angle2);
            var word_center_radius = usable_radius - word_radius;
            for (i in word_list) {
                w = word_list[i];

                var angle_sin = Math.sin(current_angle);
                var angle_cos = Math.cos(current_angle);
                var word_x = this.center_x + word_center_radius * angle_cos;
                var word_y = this.center_y + word_center_radius * angle_sin;

                w_object = new SELF.Word(w, word_x, word_y, word_radius * 2);

                this.words.push(w_object);
                current_angle += angle_increment;
            }
        }
    }
    SELF.Sentence.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
        var object_list = [];
        if (this.outside_circle.isMouseOver(mouse_x, mouse_y)) {
            object_list.push(this.outside_circle);
        }
        if (this.inside_circle.isMouseOver(mouse_x, mouse_y)) {
            object_list.push(this.inside_circle);
        }
        for (var i in this.words) {
            var words_objs = this.words[i].mouseOverObjects(mouse_x, mouse_y);
            for (var j in words_objs) {
                var w = words_objs[j];
                object_list.push(w);
            }
        }
        return object_list;
    }
    SELF.Sentence.prototype.setLineColor = function(new_color) {
        this.inside_circle.line_color = new_color;
        this.outside_circle.line_color = new_color;
        for (var i in this.words) {
            this.words[i].setLineColor(new_color);
        }
    }


/*********************************** WORD ************************************/
    SELF.Word = function(text, center_x, center_y, max_diameter) {
        this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 250;
        this.radius = this.max_diameter / 2;
        this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
        this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
        this.circle = new SELF.Circle(this.x, this.y, this.radius);
        this.circle.line_color = SELF.guideline_color;
        this.circle.line_width = 1;
        this.arcs_circle = new SELF.Circle(this.x, this.y, this.radius);
        this.arcs_circle.line_color = SELF.guideline_color;
        this.arcs_circle.line_width = 1;
        this.arcs = [new SELF.Arc(this.x, this.y, this.radius, 0, Math.TWOPI)];
        this.text = "";
        this.chars = [];
        this.setText(text);
    }
    SELF.Word.prototype.draw = function(canvas) {
        var i = null;
        var arc = null;
        for (i in this.arcs) {
            arc = this.arcs[i];
            arc.draw(canvas);
        }
        for (i in this.chars) {
            this.chars[i].draw(canvas);
        }
        if (SELF.draw_guidelines) {
            this.circle.draw(canvas);
            this.arcs_circle.draw(canvas);
        }
    }
    SELF.Word.prototype.setText = function(text) {
        this.text = text = text.trim().split(' ')[0];
        this.chars = [];
        var last_len = 0;
        var c = null;
         while ((text.length > 0) && (last_len != text.length)) {
            c = new SELF.Char(text);
            this.chars.push(c);
            last_len = text.length;
            text = text.substr(c.main.length*c.main_count + c.secondary.length*c.secondary_count);
        }
        this.setDimensions();
    }
    SELF.Word.prototype.setDimensions = function() {
        if (!this.chars || this.chars.length <= 0) {
            return;
        }

        // Split homogeneously the word circle, to fit exactly all char circles
        var char_max_diameter = 20;
        if (this.chars.length > 0) {
            if (this.chars.length == 1) {
                this.arcs_circle.center.y = this.y - this.radius*.15;
                this.arcs_circle.radius = this.radius * .7;
                char_max_diameter = this.max_diameter;
            } else {
                this.arcs_circle.center.y = this.y;

                var alpha = (Math.TWOPI / this.chars.length) / 2;
                var sin_alpha = Math.sin(alpha);

                // value to calculate new word radius
                char_max_diameter = 2 * this.arcs_circle.radius * Math.sin(alpha);
                var new_arcs_circle = this.positionChars(char_max_diameter, true);
                this.arcs_circle.radius = new_arcs_circle.radius;
                this.arcs_circle.center.x = new_arcs_circle.center.x;
                this.arcs_circle.center.y = new_arcs_circle.center.y;

                // final value
                char_max_diameter = 2 * this.arcs_circle.radius * Math.sin(alpha);

                if (this.chars.length == 2) {
                    char_max_diameter *= .93;
                }
            }
            this.positionChars(char_max_diameter);
            this.shareCharModLines();
        }
    }
    SELF.Word.prototype.positionChars = function(char_max_diameter, resize_word_circle) {
        resize_word_circle = typeof resize_word_circle !== "boolean" ? false : resize_word_circle;

        // Position the char
        var i = null;
        var j = null;
        var current_angle = Math.PI / 2; // Start on the bottom
        var angle_increment = -Math.TWOPI / this.chars.length; // Then go counter-clockwise
        var arcs_angles = [];
        var is_first_intersect = true;
        var first_envolves_HALFPI = true;
        var first_angle = null;
        var new_center = new SELF.Point(this.arcs_circle.center.x, this.arcs_circle.center.y);
        for (i in this.chars) {
            var c = this.chars[i];
            c.up_angle = current_angle + Math.PI;
            c.up_vector = new SELF.Point(Math.cos(c.up_angle), Math.sin(c.up_angle));
            c.word_circle = this.arcs_circle;
            // Dont use the methods 'setX' and 'setY' to avoid re-calculating everything
            c.x = this.arcs_circle.center.x + this.arcs_circle.radius * Math.cos(current_angle);
            c.y = this.arcs_circle.center.y + this.arcs_circle.radius * Math.sin(current_angle);
            c.setMaxDiameter(char_max_diameter); // Now re-calculate

            // Now check for intersections with the word line
            var isect_points = c.word_intersect_points;
            if (isect_points.length == 2) {
                var p1 = isect_points[0];
                var p2 = isect_points[1];
                var a1 = Math.atan2(p1.y - this.arcs_circle.center.y, p1.x - this.arcs_circle.center.x);
                var a2 = Math.atan2(p2.y - this.arcs_circle.center.y, p2.x - this.arcs_circle.center.x);
                var envolves_word_start = false;
                if ((a1 > Math.HALFPI && a2 < Math.HALFPI) ||
                    (a2 > Math.HALFPI && a1 < Math.HALFPI)) {
                    envolves_word_start = true;
                }

                a1 = normalize_angle(a1, -Math.THREEQUARTERSPI);
                a2 = normalize_angle(a2, -Math.THREEQUARTERSPI);

                if ((a2 > a1) || (is_first_intersect && (a1 > -Math.PI) && (a2 < -Math.PI))) {
                    var a_temp = a1;
                    a1 = a2;
                    a2 = a_temp;
                }

                if (is_first_intersect) {
                    is_first_intersect = false;
                    if (!envolves_word_start) {
                        first_angle = a1 - Math.TWOPI;
                        arcs_angles.push(a2);
                    } else {
                        first_angle = a2;
                        arcs_angles.push(a1);
                    }
                } else {
                    arcs_angles.push(a1);
                    arcs_angles.push(a2);
                }
            }
            if (resize_word_circle) {
                new_center.x += c.max_used_word_radius * Math.cos(c.up_angle) / this.chars.length;
                new_center.y += c.max_used_word_radius * Math.sin(c.up_angle) / this.chars.length;
            }
            current_angle += angle_increment;
        }
        if (first_angle) {
            arcs_angles.push(first_angle);
        }
        // Add the angles to the list
        if (arcs_angles.length > 0) {
            this.arcs = [];
            for (i=0; i<arcs_angles.length-1; i+=2) {
                this.addArc(arcs_angles[i+1], arcs_angles[i]);
            }
        } else {
            this.arcs = [ new SELF.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, 0, Math.TWOPI) ];
        }
        var new_size_circle = this.arcs_circle;
        if (resize_word_circle) {
            var new_radius = this.radius; // Just a starting value for the algorithm
            for (i in this.chars) {
                c = this.chars[i];
                var target_x = new_center.x - c.up_vector.x * this.max_diameter;
                var target_y = new_center.y - c.up_vector.y * this.max_diameter;
                var helper_line = new SELF.Line(new_center.x, new_center.y, target_x, target_y);
                var isect_points = helper_line.intersectPoints(this.circle);
                if (isect_points.length > 0) {
                    var p = isect_points[0];
                    var dx = p.x - new_center.x;
                    var dy = p.y - new_center.y;
                    var char_new_max_radius = Math.sqrt(dx*dx + dy*dy) * .94;
                    char_new_max_radius -= c.max_used_word_radius - this.arcs_circle.radius;
                    new_radius = Math.min(new_radius, char_new_max_radius);
                }
            }
            new_size_circle = new SELF.Circle(new_center.x, new_center.y, new_radius);
        }
        return new_size_circle;
    }
    SELF.Word.prototype.shareCharModLines = function() {
        var i = 0;
        var total_lines = 0;
        var last_shareable_char = null;
        for (i in this.chars) {
            var c = this.chars[i];
            if (c.mod_lines && c.mod_lines.length <= 0) {
                continue;
            }
            if (last_shareable_char) {
                c.shareModifierLine(last_shareable_char.mod_lines);
                last_shareable_char = null;
                continue;
            }
            last_shareable_char = c;
        }
    }
    SELF.Word.prototype.addArc = function(begin_angle, end_angle) {
        this.arcs.push(new SELF.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, begin_angle, end_angle));
    }
    SELF.Word.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
        var object_list = [];
        for (var i in this.arcs) {
            var arc = this.arcs[i];
            if (arc.isMouseOver(mouse_x, mouse_y)) {
                object_list.push(arc);
            }
        }
        for (var i in this.chars) {
            var char_objs_list = this.chars[i].mouseOverObjects(mouse_x, mouse_y);
            if (char_objs_list.length > 0) {
                for (var k in char_objs_list) {
                    object_list.push(char_objs_list[k]);
                }
            }
        }
        return object_list;
    }
    SELF.Word.prototype.setLineColor = function(new_color) {
        for (var i in this.arcs) {
            this.arcs[i].line_color = new_color;
        }
        for (var i in this.chars) {
            this.chars[i].setLineColor(new_color);
        }
    }


/*********************************** CHAR ************************************/
// This can be a single character, repeated "n" times and/or followed by
// a vowel (which could also be repeated "n" times)
    SELF.Char = function(text, center_x, center_y, max_diameter, up_vector, owner_circle) {
        this.draw_objects = [];
        this.max_circle = null;
        this.owner_intersect_object = null;
        this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
        this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
        this.up_angle = -Math.HALFPI;
        this.up_vector = typeof up_vector !== 'undefined' ? up_vector : new SELF.Point(0, -1);
        this.word_circle = typeof owner_circle !== 'undefined' ? owner_circle : new SELF.Circle(0, 0, 1);
        this.word_intersect_points = [];
        this.main = "";
        this.main_count = 0;
        this.secondary = "";
        this.secondary_count = 0;
        this.text = "";
        this.getFirstChar(text);
        this.max_used_word_radius = this.word_circle.radius + this.radius;
        this.setMaxDiameter(max_diameter);
        this.dots = [];
        this.mod_lines = [];
        this.mod_line_secondary = null;
    }
    SELF.Char.prototype.setX = function(new_x) {
        this.x = typeof new_x !== 'undefined' ? new_x : this.radius;
        this.loadObjects();
    }
    SELF.Char.prototype.setY = function(new_y) {
        this.y = typeof new_y !== 'undefined' ? new_y : this.radius;
        this.loadObjects();
    }
    SELF.Char.prototype.setMaxDiameter = function(max_diameter) {
        this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 50;
        this.radius = this.max_diameter / 2;
        this.consonant_radius = this.radius * .45; // 90% of the max radius = the diameter of the consonant circle
        this.vowel_radius = this.consonant_radius * .3; // 20%
        if (!this.max_circle) {
            this.max_circle = new SELF.Circle();
        }
        this.max_circle.center.x = this.x;
        this.max_circle.center.y = this.y;
        this.max_circle.radius = this.max_diameter/2;
        this.max_circle.line_color = SELF.guideline_color;
        this.max_circle.line_width = 1;
        this.loadObjects();
    }
    SELF.Char.prototype.draw = function(canvas) {
        var i = null;
        for (i in this.draw_objects) {
            this.draw_objects[i].draw(canvas);
        }
        if (SELF.draw_guidelines && this.max_circle) {
            this.max_circle.draw(canvas);
        }
    }
    SELF.Char.prototype.loadObjects = function() {
        this.draw_objects = [];
        // Primary
        if (!this.main || this.main.length <= 0 || this.main_count <= 0) {
            return;
        }
        if (/^([bdfgh]|ch)$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'ch') { modifier = '2dots'; }
            else if (this.main == 'd') { modifier = '3dots'; }
            else if (this.main == 'f') { modifier = '3lines'; }
            else if (this.main == 'g') { modifier = '1line'; }
            else if (this.main == 'h') { modifier = '2lines'; }
            this.loadB(modifier);
        } else if (/^[jklmnp]$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'k') { modifier = '2dots'; }
            else if (this.main == 'l') { modifier = '3dots'; }
            else if (this.main == 'm') { modifier = '3lines'; }
            else if (this.main == 'n') { modifier = '1line'; }
            else if (this.main == 'p') { modifier = '2lines'; }
            this.loadJ(modifier);
        } else if (/^([trsvw]|sh)$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'sh') { modifier = '2dots'; }
            else if (this.main == 'r') { modifier = '3dots'; }
            else if (this.main == 's') { modifier = '3lines'; }
            else if (this.main == 'v') { modifier = '1line'; }
            else if (this.main == 'w') { modifier = '2lines'; }
            this.loadT(modifier);
        } else if (/^([yzx]|th|ng|qu)$/i.test(this.main)) {
            var modifier = null;
            if (this.main == 'y') { modifier = '2dots'; }
            else if (this.main == 'z') { modifier = '3dots'; }
            else if (this.main == 'ng') { modifier = '3lines'; }
            else if (this.main == 'qu') { modifier = '1line'; }
            else if (this.main == 'x') { modifier = '2lines'; }
            this.loadTH(modifier);
        } else if (/^a$/i.test(this.main)) {
            this.loadA(this.word_circle);
        } else if (/^e$/i.test(this.main)) {
            this.loadE(this.word_circle);
        } else if (/^i$/i.test(this.main)) {
            this.loadI(this.word_circle);
        } else if (/^o$/i.test(this.main)) {
            this.loadO(this.word_circle);
        } else if (/^u$/i.test(this.main)) {
            this.loadU(this.word_circle);
        } else {
            this.loadOther();
        }

        // Secondary
        if (!this.secondary || this.secondary.length <= 0 || this.secondary_count <= 0) {
            return;
        }
    }
    SELF.Char.prototype.loadModifier = function(modifier, circle) {
        var distance = 1;
        var small_dot_size = this.consonant_radius * .07;
        var big_dot_size = this.consonant_radius * .10;
        var angle_ratio = circle.radius / Math.PI;
        this.dots = [];
        this.mod_lines = [];
        switch (modifier) {
            case '3dots':
                var p3_angle = (this.up_angle * angle_ratio - big_dot_size) / angle_ratio;
                var p3 = new SELF.Point(
                    circle.center.x + Math.cos(p3_angle) * (circle.radius - big_dot_size * 1.8),
                    circle.center.y + Math.sin(p3_angle) * (circle.radius - big_dot_size * 1.8),
                    small_dot_size);
                this.dots.push(p3);
                this.draw_objects.push(p3);
                var p1 = new SELF.Point(
                    circle.center.x + this.up_vector.x * (circle.radius - big_dot_size * 1.8),
                    circle.center.y + this.up_vector.y * (circle.radius - big_dot_size * 1.8),
                    big_dot_size);
                this.dots.push(p1);
                this.draw_objects.push(p1);
                var p2_angle = (this.up_angle * angle_ratio + big_dot_size) / angle_ratio;
                var p2 = new SELF.Point(
                    circle.center.x + Math.cos(p2_angle) * (circle.radius - big_dot_size * 1.8),
                    circle.center.y + Math.sin(p2_angle) * (circle.radius - big_dot_size * 1.8),
                    small_dot_size);
                this.dots.push(p2);
                this.draw_objects.push(p2);
                break;
            case '2dots':
                var p1_angle = (this.up_angle * angle_ratio - small_dot_size / 1.8) / angle_ratio;
                var p1 = new SELF.Point(
                    circle.center.x + Math.cos(p1_angle) * (circle.radius - big_dot_size * 1.5),
                    circle.center.y + Math.sin(p1_angle) * (circle.radius - big_dot_size * 1.5),
                    small_dot_size);
                this.draw_objects.push(p1);
                var p2_angle = (this.up_angle * angle_ratio + small_dot_size / 1.8) / angle_ratio;
                var p2 = new SELF.Point(
                    circle.center.x + Math.cos(p2_angle) * (circle.radius - big_dot_size * 1.5),
                    circle.center.y + Math.sin(p2_angle) * (circle.radius - big_dot_size * 1.5),
                    small_dot_size);
                this.draw_objects.push(p2);
                break;
            case '2lines':
                var l1_angle = (this.up_angle * angle_ratio - big_dot_size / 2) / angle_ratio;
                this.loadModifierLine(circle, l1_angle);
                var l2_angle = (this.up_angle * angle_ratio + big_dot_size / 2) / angle_ratio;
                this.loadModifierLine(circle, l2_angle);
                break;
            case '3lines':
                var l3_angle = (this.up_angle * angle_ratio - big_dot_size) / angle_ratio;
                var l2_angle = (this.up_angle * angle_ratio + big_dot_size) / angle_ratio;
                this.loadModifierLine(circle, l3_angle);
                this.loadModifierLine(circle, this.up_angle);
                this.loadModifierLine(circle, l2_angle);
                break;
            case '1line':
                this.loadModifierLine(circle, this.up_angle);
                break;
        }
    }
    SELF.Char.prototype.loadModifierLine = function(circle, angle, is_secondary) {
        if (typeof(is_secondary) === 'undefined') {
            is_secondary = false;
        }
        var l = new SELF.Line(
            circle.center.x + Math.cos(angle) * circle.radius,
            circle.center.y + Math.sin(angle) * circle.radius,
            circle.center.x + Math.cos(angle) * this.word_circle.radius * 3,
            circle.center.y + Math.sin(angle) * this.word_circle.radius * 3);
        var p_list = l.intersectPoints(this.word_circle);
        if (p_list.length > 0) {
            l.end = p_list[0];
        }
        l.holder_circle = circle;
        if (is_secondary) {
            this.mod_line_secondary = l;
        } else {
            this.mod_lines.push(l);
        }
        this.draw_objects.push(l);
    }
    SELF.Char.prototype.shareModifierLine = function(shared_list) {
        if (this.mod_lines && this.mod_lines.length <= 0) {
            return;
        }
        var already_shared = 0;
        var i = 0;
        var j = this.mod_lines.length - 1;
        for (i in shared_list) {
            var shared = shared_list[i];
            if (!shared || (j < 0)) {
                continue;
            }

            this_line = this.mod_lines[j];

            var axis = new SELF.Line(this_line.holder_circle.center.x,
                                  this_line.holder_circle.center.y,
                                  shared.holder_circle.center.x,
                                  shared.holder_circle.center.y);
            var axis_range = Math.min(this_line.holder_circle.radius,
                                      shared.holder_circle.radius) * .7;
            var current_delta = (j / (this.mod_lines.length - 1)) * axis_range - (axis_range / 2.0);
            axis.perpendicularMove(current_delta);
            var this_isects = axis.intersectPoints(this_line.holder_circle);
            if (this_isects.length <= 0) { return; }
            var shared_isects = axis.intersectPoints(shared.holder_circle);
            if (shared_isects.length <= 0) { return; }

            this_line.begin.x = this_isects[0].x;
            this_line.begin.y = this_isects[0].y;
            this_line.end.x = shared_isects[0].x;
            this_line.end.y = shared_isects[0].y;

            shared.visible = false;
            --j;
        }
    }
    SELF.Char.prototype.loadArc = function(modifier, circle, skip_intersect_points) {
        // Check intersection points to discover the angles for the arc
        var arc_begin = 0;
        var arc_end = Math.TWOPI;
        var set_intersect_points = skip_intersect_points ? false : true;

        // I don't know why the points always comes on the correct order to draw the circle
        // Maybe on other browsers it doesn't work. TODO: check it out
        var isects = circle.intersectPoints(this.word_circle);
        if (isects.length == 2) {
            var first_angle = Math.atan2(isects[0].y - circle.center.y, isects[0].x - circle.center.x);
            var second_angle = Math.atan2(isects[1].y - circle.center.y, isects[1].x - circle.center.x);
            arc_begin = first_angle;
            arc_end = second_angle;
            if (set_intersect_points) {
                this.word_intersect_points = [ isects[0], isects[1] ];
            }
        } else {
            if (set_intersect_points) {
                this.word_intersect_points = [];
            }
        }

        var a = new SELF.Arc();
        a.circle = circle;
        a.begin_angle = arc_begin;
        a.end_angle = arc_end;
        this.draw_objects.push(a);

        this.loadModifier(modifier, circle);
    }
    SELF.Char.prototype.loadB = function(modifier) {
        var offset_distance = this.consonant_radius * .9;
        var c = new SELF.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
        this.owner_intersect_object = c;
        this.loadArc(modifier, c);
        this.max_used_word_radius = this.word_circle.radius;
        if (this.main_count > 1) {
            var current_radius = c.radius;
            for (var i=1; i < this.main_count; ++i) {
                current_radius += c.line_width * 2;
                var c2 = new SELF.Circle(c.center.x, c.center.y, current_radius);
                this.loadArc(null, c2, true);
            }
        }
        this.loadSecondaryVowel(c, true);
    }
    SELF.Char.prototype.loadJ = function(modifier) {
        var offset_distance = this.radius * .55;
        var c = new SELF.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
        this.owner_intersect_object = c;
        this.draw_objects.push(c);
        this.loadModifier(modifier, c);
        this.max_used_word_radius = this.word_circle.radius;
        if (this.main_count > 1) {
            var current_radius = c.radius;
            for (var i=1; i < this.main_count; ++i) {
                current_radius += c.line_width * 2;
                var c2 = new SELF.Circle(c.center.x, c.center.y, current_radius);
                this.draw_objects.push(c2);
            }
        }
        this.loadSecondaryVowel(c);
    }
    SELF.Char.prototype.loadT = function(modifier) {
        var offset_distance = -this.consonant_radius * 2.3; // Magic number
        var c = new SELF.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius * 3.2);
        this.loadArc(modifier, c);
        this.max_used_word_radius = this.word_circle.radius;
        if (this.main_count > 1) {
            var current_radius = c.radius;
            for (var i=1; i < this.main_count; ++i) {
                current_radius += c.line_width * 2;
                var c2 = new SELF.Circle(c.center.x, c.center.y, current_radius);
                this.loadArc(null, c2, true);
            }
        }
        this.loadSecondaryVowel(c);
    }
    SELF.Char.prototype.loadTH = function(modifier) {
        var c = new SELF.Circle(this.x, this.y, this.consonant_radius);
        this.draw_objects.push(c);
        this.loadModifier(modifier, c);
        this.max_used_word_radius = this.word_circle.radius + this.consonant_radius;
        this.loadSecondaryVowel(c);
    }
    SELF.Char.prototype.repeatVowel = function(circle, is_secondary) {
        function doRepeatVowel(c, count, draw_objs) {
            if (count > 1) {
                var current_radius = c.radius;
                for (var i=1; i < count; ++i) {
                    current_radius -= c.line_width * 2;
                    if (current_radius > 0) {
                        var c2 = new SELF.Circle(c.center.x, c.center.y, current_radius);
                        draw_objs.push(c2);
                    }
                }
            }
        }
        if (is_secondary) {
            doRepeatVowel(circle, this.secondary_count, this.draw_objects);
        } else {
            doRepeatVowel(circle, this.main_count, this.draw_objects);
        }
    }
    SELF.Char.prototype.loadA = function(circle, is_secondary) {
        is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
        var distance_factor = 1.6;
        var c = new SELF.Circle(
            this.x - this.up_vector.x * this.vowel_radius * distance_factor,
            this.y - this.up_vector.y * this.vowel_radius * distance_factor,
            this.vowel_radius);
        if (!(is_secondary && /^([yzx]|th|ng|qu)$/i.test(this.main))) {
            this.max_used_word_radius = this.word_circle.radius + this.vowel_radius * distance_factor;
        }
        this.draw_objects.push(c);
        this.repeatVowel(c, is_secondary);
        return c;
    }
    SELF.Char.prototype.loadE = function(circle, is_secondary) {
        is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
        var c_x = this.x;
        var c_y = this.y;
        if (is_secondary) {
            if (/^([trsvw]|sh)$/i.test(this.main)) {
                c_x = this.x + this.up_vector.x * this.vowel_radius;
                c_y = this.y + this.up_vector.y * this.vowel_radius;
            } else {
                c_x = circle.center.x;
                c_y = circle.center.y;
            }
        }
        var c = new SELF.Circle(c_x, c_y, this.vowel_radius);
        if (!is_secondary) {
            this.max_used_word_radius = this.word_circle.radius + this.vowel_radius;
        }
        this.draw_objects.push(c);
        this.repeatVowel(c, is_secondary);
        return c;
    }
    SELF.Char.prototype.loadI = function(circle, is_secondary) {
        is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
        var c = this.loadE(circle, is_secondary);
        this.dots = [];
        this.mod_lines = [];
        this.loadModifierLine(c, this.up_angle, true);
    }
    SELF.Char.prototype.loadO = function(circle, is_secondary) {
        is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
        var distance_factor = 1.5;
        var c_x = 0;
        var c_y = 0;
        if (is_secondary) {
            c_x = circle.center.x + this.up_vector.x * circle.radius;
            c_y = circle.center.y + this.up_vector.y * circle.radius;
        } else {
            c_x = this.x + this.up_vector.x * this.vowel_radius * distance_factor;
            c_y = this.y + this.up_vector.y * this.vowel_radius * distance_factor;
        }
        var c = new SELF.Circle(c_x, c_y, this.vowel_radius);
        if (!(is_secondary && /^([yzx]|th|ng|qu)$/i.test(this.main))) {
            this.max_used_word_radius = this.word_circle.radius;
        }
        this.draw_objects.push(c);
        this.repeatVowel(c, is_secondary);
        return c;
    }
    SELF.Char.prototype.loadU = function(circle, is_secondary) {
        var c = this.loadE(circle, is_secondary);
        this.dots = [];
        this.mod_lines = [];
        this.loadModifierLine(c, this.up_angle - Math.PI, true);
    }
    SELF.Char.prototype.loadSecondaryVowel = function(circle) {
        if (/^a$/i.test(this.secondary)) {
            this.loadA(this.word_circle, true);
        } else if (/^e$/i.test(this.secondary)) {
            this.loadE(circle, true);
        } else if (/^i$/i.test(this.secondary)) {
            this.loadI(circle, true);
        } else if (/^o$/i.test(this.secondary)) {
            this.loadO(circle, true);
        } else if (/^u$/i.test(this.secondary)) {
            this.loadU(circle, true);
        }
    }
    SELF.Char.prototype.loadOther = function() {
        var p = new SELF.Point(this.x, this.y);
        p.line_color = "#ff0000";
        p.line_width = 8;
        this.draw_objects.push(p);
    }
    SELF.Char.prototype.getFirstChar = function(text) {
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
    SELF.Char.prototype.countCharRepeat = function(text, start_index) {
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
    SELF.Char.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
        var object_list = [];
        for (var i in this.draw_objects) {
            var obj = this.draw_objects[i];
            if (obj.isMouseOver(mouse_x, mouse_y)) {
                object_list.push(obj);
            }
        }
        for (var i in this.mod_lines) {
            var obj = this.mod_lines[i];
            if (obj.isMouseOver(mouse_x, mouse_y)) {
                object_list.push(obj);
            }
        }
        if (this.mod_line_secondary) {
            if (this.mod_line_secondary.isMouseOver(mouse_x, mouse_y)) {
                object_list.push(this.mod_line_secondary);
            }
        }
        return object_list;
    }
    SELF.Char.prototype.setLineColor = function(new_color) {
        for (var i in this.draw_objects) {
            this.draw_objects[i].line_color = new_color;
        }
        for (var i in this.mod_lines) {
            this.mod_lines[i].line_color = new_color;
        }
        if (this.mod_line_secondary) {
            this.mod_line_secondary.line_color = new_color;
        }
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
    function points_distance(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy);
    }


/***************************** INTERSECTIONS *********************************/
    function isect_line_circle(line, circle) {
        default_result = [];

        // Line: y = ax + b
        // Circle: (x − p)^2 + (y − q)^2 = r^2
        // p = circle.center.x
        // q = circle.center.y
        // r = circle.radius

        var point1 = new SELF.Point();
        var point2 = new SELF.Point();
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

        var p2 = new SELF.Point();
        var p3_a = new SELF.Point();
        var p3_b = new SELF.Point();

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
    SELF.drawTest = function(canvas) {
        var s = new SELF.Sentence('bthtj', 20, 20, 460);
        //var s = new SELF.Sentence('jthjthjthbjbjbj', 100, 100);
        //var s = new SELF.Sentence('abajatatha chekesheye dilirizi fomosongo gunuvuquu hapawaxa', 4, 296);
        s.draw(canvas);
    }


}(window.gallifreyan = window.gallifreyan || {}));
