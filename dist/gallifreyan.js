(function(context) {

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
    *     The files below are included by 'grunt' (defined on Gruntfile.js)     *
    *****************************************************************************/
    
    /* global PUBLIC */

/*************************** BASE DRAWING OBJECT *****************************/

PUBLIC.Graphic = function(targetCanvas) {
    this.name = "Graphic";
    this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
    //this.line_color = "#ffffff";
    this.line_color = "#f0cc05";
    //this.line_color = "#87b8e7";
    this.line_width = 2;
    this.visible = true;
};

PUBLIC.Graphic.prototype._draw = function(ctx) {
    // Intended to be inherited/overwritten
    ctx.strokeStyle = this.line_color;
    ctx.lineWidth = this.line_width;
    ctx.lineCap = "round";
};

PUBLIC.Graphic.prototype.draw = function(canvas) {
    if (!this.visible) {
        return;
    }
    if (typeof canvas !== 'undefined') {
        this.canvas = canvas;
    }
    if ((typeof this.canvas === 'undefined') || (this.canvas === null)) {
        return;
    }
    var context = this.canvas.getContext("2d");
    //context.shadowBlur = 5;
    //context.shadowColor = "rgba(255,255,0,.4)";
    //context.shadowColor = "rgba(60,180,220,.4)";
    //context.shadowColor = "rgba(0,0,0,.5)";
    //context.shadowOffsetX = 4;
    //context.shadowOffsetY = 4;
    context.beginPath();
    this._draw(context);
    context.stroke();
};

    
/******************************* POINT ***************************************/
PUBLIC.Point = function(x, y, size) {
    this.name = "Point";
    this.x = typeof x !== 'undefined' ? x : 0;
    this.y = typeof y !== 'undefined' ? y : 0;
    if (typeof size === 'number') {
        this.line_width = size;
    }
};

PUBLIC.Point.prototype = new PUBLIC.Graphic();
PUBLIC.Point.prototype._pre_draw = PUBLIC.Point.prototype._draw;
PUBLIC.Point.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    // Actually draw a circle with almost-zero radius
    var radius = this.line_width / 2.01;
    ctx.arc(this.x, this.y, radius, 0, Math.TWOPI);
};

PUBLIC.Point.prototype.moveXY = function(delta_x, delta_y) {
    this.x += delta_x;
    this.y += delta_y;
    return this;
};

PUBLIC.Point.prototype.move = function(angle, length) {
    this.moveXY(Math.cos(angle) * length,
                Math.sin(angle) * length);
    return this;
};

PUBLIC.Point.prototype.isMouseOver = function(mouse_x, mouse_y) {
    var threshold = Math.max(5, this.line_width);
    if ((mouse_x < (this.x - threshold)) ||
        (mouse_x > (this.x + threshold)) ||
        (mouse_y < (this.y - threshold)) ||
        (mouse_y > (this.y + threshold))) {
        return false;
    }
    var delta_x = mouse_x - this.x;
    var delta_y = mouse_y - this.y;
    var distance = Math.sqrt(delta_x*delta_x + delta_y*delta_y);

    return ( (distance <= threshold) && (distance >= -threshold) );
};

    /* global PUBLIC */

/******************************** LINE ***************************************/

PUBLIC.Line = function(ax, ay, bx, by) {
    this.name = "Line";
    this.begin = new PUBLIC.Point(ax, ay);
    this.end = new PUBLIC.Point(bx, by);
};

PUBLIC.Line.prototype = new PUBLIC.Graphic();
PUBLIC.Line.prototype._pre_draw = PUBLIC.Line.prototype._draw;
PUBLIC.Line.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.moveTo(this.begin.x, this.begin.y);
    ctx.lineTo(this.end.x, this.end.y);
};

PUBLIC.Line.prototype.boxContains = function(point) {
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
};

PUBLIC.Line.prototype.intersectPoints = function(target) {
    var default_result = [];

    // Discover the target type
    if (typeof target === 'undefined' || target === null) {
        return default_result;
    }
    if (typeof target.name === 'undefined' || target.name === null) {
        return default_result;
    }

    if (target.name == 'Circle') {
        var result = [];
        var isects = PUBLIC.util.isect_line_circle(this, target);
        for (var i in isects) {
            var p = isects[i];
            if (this.boxContains(p)) {
                result.push(p);
            }
        }
        return result;
    }
    return default_result;
};

PUBLIC.Line.prototype.perpendicularMove = function(delta) {
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
};

PUBLIC.Line.prototype.isMouseOver = function(mouse_x, mouse_y) {
    var a, b, pa, pb, intersect_x, intersect_y;
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
    if (Math.abs(dx) > 0.001) {
        // Main line parameters
        a = dy / dx;
        b = this.begin.y - a * this.begin.x;
        
        // Mouse perpendicular line parameters
        pa = pb = intersect_x = intersect_y = 0;
        if (a > 0.001 || a < -0.001) {
            pa = Math.tan(Math.atan(a) + Math.HALFPI);
            pb = mouse_y - (pa * mouse_x);
            intersect_x = (pb - b) / (a - pa);  // (a - pa) is never 0
            intersect_y = a * intersect_x + b;
        } else {
            pa = a;
            pb = mouse_x - (pa * mouse_y);
            intersect_x = (pa*b + pb) / (1 - a*pa);  // (a*pa) should never be 1, at this point
            intersect_y = a*intersect_x + b;
        }
        return (PUBLIC.util.points_distance(mouse_x, mouse_y, intersect_x, intersect_y) <= threshold);
    } else {
        // Main line parameters
        a = dx / dy;
        b = this.begin.x - a * this.begin.y;
        
        // Mouse perpendicular line parameters
        pa = pb = intersect_x = intersect_y = 0;
        if (a > 0.001 || a < -0.001) {
            pa = Math.tan(Math.atan(a) + Math.HALFPI);
            pb = mouse_x - (pa * mouse_y);
            intersect_y = (pb - b) / (a - pa); // (a - pa) is never 0
            intersect_x = a * intersect_y + b;
        } else {
            pa = a;
            pb = mouse_y - (pa * mouse_x);
            intersect_y = (pa*b + pb) / (1 - a*pa);
            intersect_x = a*intersect_y + b;
        }
        return (PUBLIC.util.points_distance(mouse_x, mouse_y, intersect_x, intersect_y) <= threshold);
    }
    return false;
};

    
/******************************* CIRCLE **************************************/

PUBLIC.Circle = function(x, y, r) {
    this.name = "Circle";
    this.center = new PUBLIC.Point(x, y);
    this.radius = typeof r !== 'undefined' ? r : 1;
};

PUBLIC.Circle.prototype = new PUBLIC.Graphic();
PUBLIC.Circle.prototype._pre_draw = PUBLIC.Circle.prototype._draw;
PUBLIC.Circle.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.TWOPI);
};

PUBLIC.Circle.prototype.intersectPoints = function(target) {
    var default_result = [];

    // Discover the target type
    if (typeof target === 'undefined' || target === null) {
        return default_result;
    }
    if (typeof target.name === 'undefined' || target.name === null) {
        return default_result;
    }

    if (target.name == 'Circle') {
        return PUBLIC.util.isect_circle_circle(this, target);
    } else if (target.name == 'Line') {
        return PUBLIC.util.isect_line_circle(target, this);
    }
    return default_result;
};

PUBLIC.Circle.prototype.isMouseOver = function(mouse_x, mouse_y) {
    var delta_x = mouse_x - this.center.x;
    var delta_y = mouse_y - this.center.y;
    var distance = Math.sqrt(delta_x*delta_x + delta_y*delta_y);

    var half_width = Math.max(5, this.line_width / 2);
    return ( (distance <= (this.radius + half_width)) &&
             (distance >= (this.radius - half_width)) );
};

    
/******************************** ARC ****************************************/

PUBLIC.Arc = function(x, y, r, begin, end) {
    this.name = "Arc";
    this.circle = new PUBLIC.Circle(x, y, r);
    this.begin_angle = typeof begin !== 'undefined' ? begin : 0;
    this.end_angle = typeof end !== 'undefined' ? end : Math.TWOPI;
};

PUBLIC.Arc.prototype = new PUBLIC.Graphic();
PUBLIC.Arc.prototype._pre_draw = PUBLIC.Arc.prototype._draw;
PUBLIC.Arc.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.begin_angle, this.end_angle);
};

PUBLIC.Arc.prototype.intersectPoints = function(target) {
    var i, point, isect_points, result;
    var default_result = [];

    // Discover the target type
    if (typeof target === 'undefined') {
        return default_result;
    }
    if (typeof target.name === 'undefined') {
        return default_result;
    }

    if (target.name == 'Line') {
        isect_points = PUBLIC.util.isect_line_circle(target, this.circle);
        result = [];
        for (i in isect_points) {
            point = isect_points[i];
            if (this.containsPoint(point) && target.boxContains(point)) {
                result.push(point);
            }
        }
        return result;
    } else if (target.name == 'Circle') {
        isect_points = PUBLIC.util.isect_circle_circle(this.circle, target);
        result = [];
        for (i in isect_points) {
            point = isect_points[i];
            if (this.containsPoint(point)) {
                result.push(point);
            }
        }
        return result;
    } else if (target.name == 'Arc') {
        isect_points = PUBLIC.util.isect_circle_circle(this.circle, target.circle);
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
};

PUBLIC.Arc.prototype.containsPoint = function(point) {
    if (typeof point === 'undefined') {
        return false;
    }
    var angle = Math.atan2(point.y - this.circle.center.y, point.x - this.circle.center.x);
    if ((angle >= this.begin_angle) && (angle <= this.end_angle)) {
        return true;
    }
    return false;
};

PUBLIC.Arc.prototype.isMouseOver = function(mouse_x, mouse_y) {
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
};

    
/******************************* SENTENCE ************************************/

PUBLIC.Sentence = function(text, left, top, size) {
    this.text = typeof text !== 'undefined' ? text : '';
    this.size = typeof size !== 'undefined' ? size : 300;
    this.left = typeof left !== 'undefined' ? left : 0;
    this.top = typeof top !== 'undefined' ? top : 0;
    this.center_x = this.left + this.size/2;
    this.center_y = this.top + this.size/2;
    this.outside_circle = new PUBLIC.Circle(this.center_x, this.center_y, this.size/2);
    this.outside_circle.line_width *= 1.4;
    this.inside_circle = new PUBLIC.Circle(this.center_x, this.center_y, this.size/2-6);
    this.words = [];
    this.setText(text);
};

PUBLIC.Sentence.prototype.draw = function(canvas) {
    // clear first
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    var background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, '#00345c');
    //background.addColorStop(1, '#001940');
    background.addColorStop(1, '#00112b');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    var i = null;
    this.outside_circle.draw(canvas);
    this.inside_circle.draw(canvas);
    for (i in this.words) {
        this.words[i].draw(canvas);
    }
};

PUBLIC.Sentence.prototype.setText = function(text) {
    var i = null;
    var w = null;
    var w_object = null;
    this.words = [];
    this.text = this.preprocessText(text.trim());

    var usable_radius = this.inside_circle.radius * 0.95; // MAGIC NUMBER!
    var word_list = this.text.split(' ');
    if (word_list && word_list.length == 1) {
        w_object = new PUBLIC.Word(word_list[0], this.center_x, this.center_y, usable_radius * 2, this.inside_circle);
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

            w_object = new PUBLIC.Word(w, word_x, word_y, word_radius * 2, this.inside_circle);
            this.words.push(w_object);

            current_angle += angle_increment;
        }
    }
    this.shareModLines();
};

PUBLIC.Sentence.prototype.preprocessText = function(text) {
    var next;

    var valid_chars = /[a-z ]/i;
    var e_or_i = /[ei]/i;
    var final_text = '';

    for (var i=0; i<text.length; ++i) {
        var c = text[i];
        if (!valid_chars.test(c)) {
            continue;
        }
        if (c == 'c') {
            if (text.length > (i+1)) {
                next = text[i+1];
                if (e_or_i.test(next)) {
                    final_text += 's';
                } else {
                    final_text += 'k';
                }
            } else {
                final_text += 'k';
            }
        } else if (c == 'q') {
            if (text.length > (i+1)) {
                next = text[i+1];
                if (next === 'u') {
                    final_text += 'q';
                } else {
                    final_text += 'k';
                }
            } else {
                final_text += 'k';
            }
        } else {
            final_text += c;
        }
    }
    return final_text;
};

PUBLIC.Sentence.prototype.shareModLines = function() {
    var i, j, w, c, c2;
    var all_chars = [];

    for (i = 0; i < this.words.length; ++i) {
        w = this.words[i];
        for (j = 0; j < w.chars.length; ++j) {
            c = w.chars[j];
            c.clearSharedLines();
            all_chars.push(c);
        }
    }

    for (i = 0; i < all_chars.length; ++i) {
        c = all_chars[i];
        for (j = i + 1; j < all_chars.length; ++j) {
            c2 = all_chars[j];
            if (c.shareModLines(c2)) {
                break;
            }
            // else continue searching
        }
    }
};

PUBLIC.Sentence.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
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
};

PUBLIC.Sentence.prototype.setLineColor = function(new_color) {
    this.inside_circle.line_color = new_color;
    this.outside_circle.line_color = new_color;
    for (var i in this.words) {
        this.words[i].setLineColor(new_color);
    }
};

    
/*********************************** WORD ************************************/

PUBLIC.Word = function(text, center_x, center_y, max_diameter, sentence_circle) {
    this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 250;
    this.radius = this.max_diameter / 2;
    this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
    this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
    this.circle = new PUBLIC.Circle(this.x, this.y, this.radius);
    this.circle.line_color = PUBLIC.options.guidelinesColor;
    this.circle.line_width = 1;
    this.sentence_circle = typeof sentence_circle !== 'undefined' ? sentence_circle : this.circle;
    this.arcs_circle = new PUBLIC.Circle(this.x, this.y, this.radius);
    this.arcs_circle.line_color = PUBLIC.options.guidelinesColor;
    this.arcs_circle.line_width = 1;
    this.arcs = [new PUBLIC.Arc(this.x, this.y, this.radius, 0, Math.TWOPI)];
    this.text = "";
    this.chars = [];
    this.setText(text);
};

PUBLIC.Word.prototype.draw = function(canvas) {
    var i = null;
    var arc = null;
    for (i in this.arcs) {
        arc = this.arcs[i];
        arc.draw(canvas);
    }
    for (i in this.chars) {
        this.chars[i].draw(canvas);
    }
    if (PUBLIC.options.guidelinesEnabled) {
        this.circle.draw(canvas);
        this.arcs_circle.draw(canvas);
    }
};

PUBLIC.Word.prototype.setText = function(text) {
    this.text = text = text.trim().split(' ')[0];
    this.chars = [];
    var last_len = 0;
    var c = null;
    while ((text.length > 0) && (last_len != text.length)) {
        c = new PUBLIC.Char(text);
        this.chars.push(c);
        last_len = text.length;
        text = text.substr(c.main.length*c.main_count + c.secondary.length*c.secondary_count);
    }
    this.setDimensions();
};

PUBLIC.Word.prototype.setDimensions = function() {
    if (!this.chars || this.chars.length <= 0) {
        return;
    }

    // Split homogeneously the word circle, to fit exactly all char circles
    var char_max_diameter = 20;
    if (this.chars.length > 0) {
        if (this.chars.length == 1) {
            this.arcs_circle.center.y = this.y - this.radius * 0.15;
            this.arcs_circle.radius = this.radius * 0.7;
            char_max_diameter = this.max_diameter;
        } else {
            this.arcs_circle.center.y = this.y;

            var alpha = (Math.TWOPI / this.chars.length) / 2;
            var sin_alpha = Math.sin(alpha);

            // value to calculate new word radius
            char_max_diameter = 2 * this.arcs_circle.radius * sin_alpha;
            var new_arcs_circle = this.positionChars(char_max_diameter, true);
            this.arcs_circle.radius = new_arcs_circle.radius;
            this.arcs_circle.center.x = new_arcs_circle.center.x;
            this.arcs_circle.center.y = new_arcs_circle.center.y;

            // final value
            char_max_diameter = 2 * this.arcs_circle.radius * sin_alpha;

            if (this.chars.length == 2) {
                char_max_diameter *= 0.93;
            }
        }
        this.positionChars(char_max_diameter);
        //this.shareCharModLines();
    }
};

PUBLIC.Word.prototype.positionChars = function(char_max_diameter, resize_word_circle) {
    resize_word_circle = typeof resize_word_circle !== "boolean" ? false : resize_word_circle;

    // Position the char
    var i, j, c, isect_points;
    var current_angle = Math.PI / 2; // Start on the bottom
    var angle_increment = -Math.TWOPI / this.chars.length; // Then go counter-clockwise
    var arcs_angles = [];
    var is_first_intersect = true;
    var first_envolves_HALFPI = true;
    var first_angle = null;
    var new_center = new PUBLIC.Point(this.arcs_circle.center.x, this.arcs_circle.center.y);
    for (i in this.chars) {
        c = this.chars[i];
        c.sentence_circle = this.sentence_circle;
        c.up_angle = current_angle + Math.PI;
        c.up_vector = new PUBLIC.Point(Math.cos(c.up_angle), Math.sin(c.up_angle));
        c.word_circle = this.arcs_circle;
        // Dont use the methods 'setX' and 'setY' to avoid re-calculating everything
        c.x = this.arcs_circle.center.x + this.arcs_circle.radius * Math.cos(current_angle);
        c.y = this.arcs_circle.center.y + this.arcs_circle.radius * Math.sin(current_angle);
        c.setMaxDiameter(char_max_diameter); // Now re-calculate

        // Now check for intersections with the word line
        isect_points = c.word_intersect_points;
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

            a1 = PUBLIC.util.normalize_angle(a1, -Math.THREEQUARTERSPI);
            a2 = PUBLIC.util.normalize_angle(a2, -Math.THREEQUARTERSPI);

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
        this.arcs = [ new PUBLIC.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, 0, Math.TWOPI) ];
    }
    var new_size_circle = this.arcs_circle;
    if (resize_word_circle) {
        var new_radius = this.radius; // Just a starting value for the algorithm
        for (i in this.chars) {
            c = this.chars[i];
            var target_x = new_center.x - c.up_vector.x * this.max_diameter;
            var target_y = new_center.y - c.up_vector.y * this.max_diameter;
            var helper_line = new PUBLIC.Line(new_center.x, new_center.y, target_x, target_y);
            isect_points = helper_line.intersectPoints(this.circle);
            if (isect_points.length > 0) {
                var p = isect_points[0];
                var dx = p.x - new_center.x;
                var dy = p.y - new_center.y;
                var char_new_max_radius = Math.sqrt(dx*dx + dy*dy) * 0.94;
                char_new_max_radius -= c.max_used_word_radius - this.arcs_circle.radius;
                new_radius = Math.min(new_radius, char_new_max_radius);
            }
        }
        new_size_circle = new PUBLIC.Circle(new_center.x, new_center.y, new_radius);
    }
    return new_size_circle;
};

PUBLIC.Word.prototype.addArc = function(begin_angle, end_angle) {
    this.arcs.push(new PUBLIC.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, begin_angle, end_angle));
};

PUBLIC.Word.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
    var i, k;
    var object_list = [];
    for (i in this.arcs) {
        var arc = this.arcs[i];
        if (arc.isMouseOver(mouse_x, mouse_y)) {
            object_list.push(arc);
        }
    }
    for (i in this.chars) {
        var char_objs_list = this.chars[i].mouseOverObjects(mouse_x, mouse_y);
        if (char_objs_list.length > 0) {
            for (k in char_objs_list) {
                object_list.push(char_objs_list[k]);
            }
        }
    }
    return object_list;
};

PUBLIC.Word.prototype.setLineColor = function(new_color) {
    var i;
    
    for (i in this.arcs) {
        this.arcs[i].line_color = new_color;
    }

    for (i in this.chars) {
        this.chars[i].setLineColor(new_color);
    }
};

    
/********************************** CHAR *************************************/

// This can be a single character, repeated "n" times and/or followed by
// a vowel (which could also be repeated "n" times)
PUBLIC.Char = function(text, center_x, center_y, max_diameter, up_vector, word_circle, sentence_circle) {
    this.draw_objects = [];
    this.max_circle = null;
    this.owner_intersect_object = null;
    this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
    this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
    this.up_angle = -Math.HALFPI;
    this.up_vector = typeof up_vector !== 'undefined' ? up_vector : new PUBLIC.Point(0, -1);
    this.word_circle = typeof word_circle !== 'undefined' ? word_circle : new PUBLIC.Circle(0, 0, 1);
    this.sentence_circle = typeof sentence_circle !== 'undefined' ? sentence_circle : this.word_circle;
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
    this.main_mod = null;
    this.secondary_mod = null;
    this.mod_lines = [];
    this.mod_line_secondary = null;
};

PUBLIC.Char.prototype.setX = function(new_x) {
    this.x = typeof new_x !== 'undefined' ? new_x : this.radius;
    this.loadObjects();
};

PUBLIC.Char.prototype.setY = function(new_y) {
    this.y = typeof new_y !== 'undefined' ? new_y : this.radius;
    this.loadObjects();
};

PUBLIC.Char.prototype.setMaxDiameter = function(max_diameter) {
    this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 50;
    this.radius = this.max_diameter / 2;
    this.consonant_radius = this.radius * 0.45; // 90% of the max radius = the diameter of the consonant circle
    this.vowel_radius = this.consonant_radius * 0.3; // 20%
    if (!this.max_circle) {
        this.max_circle = new PUBLIC.Circle();
    }
    this.max_circle.center.x = this.x;
    this.max_circle.center.y = this.y;
    this.max_circle.radius = this.max_diameter/2;
    this.max_circle.line_color = PUBLIC.options.guidelinesColor;
    this.max_circle.line_width = 1;
    this.loadObjects();
};

PUBLIC.Char.prototype.draw = function(canvas) {
    var i = null;
    for (i in this.draw_objects) {
        this.draw_objects[i].draw(canvas);
    }
    if (PUBLIC.options.guidelinesEnabled && this.max_circle) {
        this.max_circle.draw(canvas);
    }
};

PUBLIC.Char.prototype.loadObjects = function() {
    this.draw_objects = [];

    // Primary
    if (!this.main || this.main.length <= 0 || this.main_count <= 0) {
        return;
    }

    var modifier = null;
    if (/^([bdfgh]|ch)$/i.test(this.main)) {
        if (this.main == 'ch') { modifier = '2dots'; }
        else if (this.main == 'd') { modifier = '3dots'; }
        else if (this.main == 'f') { modifier = '3lines'; }
        else if (this.main == 'g') { modifier = '1line'; }
        else if (this.main == 'h') { modifier = '2lines'; }
        this.loadB(modifier);
    } else if (/^[jklmnp]$/i.test(this.main)) {
        if (this.main == 'k') { modifier = '2dots'; }
        else if (this.main == 'l') { modifier = '3dots'; }
        else if (this.main == 'm') { modifier = '3lines'; }
        else if (this.main == 'n') { modifier = '1line'; }
        else if (this.main == 'p') { modifier = '2lines'; }
        this.loadJ(modifier);
    } else if (/^([trsvw]|sh)$/i.test(this.main)) {
        if (this.main == 'sh') { modifier = '2dots'; }
        else if (this.main == 'r') { modifier = '3dots'; }
        else if (this.main == 's') { modifier = '3lines'; }
        else if (this.main == 'v') { modifier = '1line'; }
        else if (this.main == 'w') { modifier = '2lines'; }
        this.loadT(modifier);
    } else if (/^([yzx]|th|ng|qu)$/i.test(this.main)) {
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
};

PUBLIC.Char.prototype.loadModifier = function(modifier, circle, min_angle, max_angle) {
    var p1, p2, p3, p1_angle, p2_angle, p3_angle, angles;

    var small_dot_size = this.consonant_radius * 0.07;
    var big_dot_size = this.consonant_radius * 0.10;
    var angle_ratio = circle.radius / Math.PI;

    this.dots = [];
    this.mod_lines = [];
    switch (modifier) {
        case '3dots':
            p3_angle = (this.up_angle * angle_ratio - big_dot_size) / angle_ratio;
            p3 = new PUBLIC.Point(
                circle.center.x + Math.cos(p3_angle) * (circle.radius - big_dot_size * 1.8),
                circle.center.y + Math.sin(p3_angle) * (circle.radius - big_dot_size * 1.8),
                small_dot_size);
            this.dots.push(p3);
            this.draw_objects.push(p3);
            p1 = new PUBLIC.Point(
                circle.center.x + this.up_vector.x * (circle.radius - big_dot_size * 1.8),
                circle.center.y + this.up_vector.y * (circle.radius - big_dot_size * 1.8),
                big_dot_size);
            this.dots.push(p1);
            this.draw_objects.push(p1);
            p2_angle = (this.up_angle * angle_ratio + big_dot_size) / angle_ratio;
            p2 = new PUBLIC.Point(
                circle.center.x + Math.cos(p2_angle) * (circle.radius - big_dot_size * 1.8),
                circle.center.y + Math.sin(p2_angle) * (circle.radius - big_dot_size * 1.8),
                small_dot_size);
            this.dots.push(p2);
            this.draw_objects.push(p2);
            break;
        case '2dots':
            p1_angle = (this.up_angle * angle_ratio - small_dot_size / 1.8) / angle_ratio;
            p1 = new PUBLIC.Point(
                circle.center.x + Math.cos(p1_angle) * (circle.radius - big_dot_size * 1.5),
                circle.center.y + Math.sin(p1_angle) * (circle.radius - big_dot_size * 1.5),
                small_dot_size);
            this.draw_objects.push(p1);
            p2_angle = (this.up_angle * angle_ratio + small_dot_size / 1.8) / angle_ratio;
            p2 = new PUBLIC.Point(
                circle.center.x + Math.cos(p2_angle) * (circle.radius - big_dot_size * 1.5),
                circle.center.y + Math.sin(p2_angle) * (circle.radius - big_dot_size * 1.5),
                small_dot_size);
            this.draw_objects.push(p2);
            break;
        case '2lines':
            angles = PUBLIC.util.randomize_angles(2, min_angle, max_angle);
            //var l1_angle = (this.up_angle * angle_ratio - big_dot_size / 2) / angle_ratio;
            this.loadModifierLine(circle, angles[0]);
            //var l2_angle = (this.up_angle * angle_ratio + big_dot_size / 2) / angle_ratio;
            this.loadModifierLine(circle, angles[1]);
            break;
        case '3lines':
            angles = PUBLIC.util.randomize_angles(3, min_angle, max_angle);
            //var l3_angle = (this.up_angle * angle_ratio - big_dot_size) / angle_ratio;
            //var l2_angle = (this.up_angle * angle_ratio + big_dot_size) / angle_ratio;
            this.loadModifierLine(circle, angles[0]);
            this.loadModifierLine(circle, angles[1]); //this.up_angle);
            this.loadModifierLine(circle, angles[2]); //l2_angle);
            break;
        case '1line':
            angles = PUBLIC.util.randomize_angles(1, min_angle, max_angle);
            this.loadModifierLine(circle, angles[0]); //this.up_angle);
            break;
    }
};

PUBLIC.Char.prototype.loadModifierLine = function(circle, angle, is_secondary) {
    if (typeof(is_secondary) === 'undefined') {
        is_secondary = false;
    }
    var l = new PUBLIC.Line(
        circle.center.x + Math.cos(angle) * (circle.radius + circle.line_width/2),
        circle.center.y + Math.sin(angle) * (circle.radius + circle.line_width/2),
        circle.center.x + Math.cos(angle) * this.sentence_circle.radius * 2,
        circle.center.y + Math.sin(angle) * this.sentence_circle.radius * 2);
    var p_list = l.intersectPoints(this.sentence_circle);
    if (p_list.length > 0) {
        l.end = p_list[0];
    }
    l.holder_circle = circle;
    l.holder_char = this;
    if (is_secondary) {
        this.mod_line_secondary = l;
    } else {
        this.mod_lines.push(l);
    }
    this.draw_objects.push(l);
};

PUBLIC.Char.prototype.clearSharedLines = function() {
    var i;
    for (i in this.mod_lines) {
        this.mod_lines[i].shared = false;
        this.mod_lines[i].visible = true;
    }
    if (this.mod_line_secondary) {
        this.mod_line_secondary.shared = false;
        this.mod_line_secondary.visible = true;
    }
};

// Returns a boolean informing if shared everything or not
PUBLIC.Char.prototype.shareModLines = function(shared_char) {
    if (!this.mod_lines || this.mod_lines.length <= 0 || !shared_char.mod_lines || shared_char.mod_lines.length <= 0) {
        return false;
    }

    var angle_share_threshold = Math.HALFPI - 0.3; // .3 just to add a margin
    var this_max_angle = this.up_angle + angle_share_threshold;
    var this_min_angle = this.up_angle - angle_share_threshold;

    for (var i = 0; i < this.mod_lines.length; ++i) {
        var s1 = this.mod_lines[i];
        if (s1.shared) {
            continue;
        }

        for (var j = 0; j < shared_char.mod_lines.length; ++j) {
            var s2 = shared_char.mod_lines[j];
            if (s2.shared) {
                continue;
            }

            // Check if the current char can line up to the potential target
            var angle_chars = PUBLIC.util.angle_between_points(this.x, this.y, shared_char.x, shared_char.y);
            if (angle_chars < this_min_angle || angle_chars > this_max_angle) {
                continue; 
            }

            // Now check if the char candidate can line up to the current
            var target_max_angle = shared_char.up_angle + angle_share_threshold;
            var target_min_angle = shared_char.up_angle - angle_share_threshold;
            angle_chars = PUBLIC.util.angle_between_points(shared_char.x, shared_char.y, this.x, this.y);
            if (angle_chars < target_min_angle || angle_chars > target_max_angle) {
                continue; 
            }
 
            this.shareLine(s1, s2);
            break;
        }
        if (!s1.shared) {
            return false;
        }
    }

    return true;
};

PUBLIC.Char.prototype.shareLine = function(this_line, shared_line) {
    var guide_line = new PUBLIC.Line(this_line.holder_circle.center.x,
                                      this_line.holder_circle.center.y,
                                      shared_line.holder_circle.center.x,
                                      shared_line.holder_circle.center.y);

    var isect1 = guide_line.intersectPoints(this_line.holder_circle)[0];
    var isect2 = guide_line.intersectPoints(shared_line.holder_circle)[0];

    this_line.begin.x = shared_line.begin.x = isect1.x;
    this_line.begin.y = shared_line.begin.x = isect1.y;
    this_line.end.x = shared_line.end.x = isect2.x;
    this_line.end.y = shared_line.end.x = isect2.y;

    // Set up info to know the line is shared
    shared_line.shared = this_line.shared = true;
    shared_line.visible = false;
    this_line.shared_line = shared_line;
    shared_line.shared_line = this_line;
};

PUBLIC.Char.prototype.loadArc = function(modifier, circle, skip_intersect_points) {
    // Check intersection points to discover the angles for the arc
    var arc_begin = 0;
    var arc_end = Math.TWOPI;
    var set_intersect_points = skip_intersect_points ? false : true;

    // I'm not sure why the points always comes on the correct order to draw the arc
    // Maybe on other browsers it doesn't work.
    //  *** TODO: check it out
    var isects = circle.intersectPoints(this.word_circle);
    if (isects.length == 2) {
        this.first_angle = Math.atan2(isects[0].y - circle.center.y, isects[0].x - circle.center.x);
        this.second_angle = Math.atan2(isects[1].y - circle.center.y, isects[1].x - circle.center.x);
        arc_begin = this.first_angle;
        arc_end = this.second_angle;
        if (set_intersect_points) {
            this.word_intersect_points = [ isects[0], isects[1] ];
        }
    } else {
        if (set_intersect_points) {
            this.word_intersect_points = [];
        }
    }

    var a = new PUBLIC.Arc();
    a.circle = circle;
    a.begin_angle = arc_begin;
    a.end_angle = arc_end;
    this.draw_objects.push(a);

    while (arc_end < arc_begin) {
        arc_end += Math.TWOPI;
    }
    var angle_delta = Math.min(Math.PI/4, (arc_end - arc_begin)/2.5);

    this.loadModifier(modifier, circle, this.up_angle - angle_delta, this.up_angle + angle_delta);
};

PUBLIC.Char.prototype.loadB = function(modifier) {
    var offset_distance = this.consonant_radius * 0.9;
    var c = new PUBLIC.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
    this.owner_intersect_object = c;
    this.loadArc(modifier, c);
    this.max_used_word_radius = this.word_circle.radius;
    if (this.main_count > 1) {
        var current_radius = c.radius;
        for (var i=1; i < this.main_count; ++i) {
            current_radius += c.line_width * 2;
            var c2 = new PUBLIC.Circle(c.center.x, c.center.y, current_radius);
            this.loadArc(null, c2, true);
        }
    }
    this.loadSecondaryVowel(c, true);
};

PUBLIC.Char.prototype.loadJ = function(modifier) {
    var offset_distance = this.radius * 0.55;
    var c = new PUBLIC.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
    this.owner_intersect_object = c;
    this.draw_objects.push(c);
    var angle_delta = Math.PI / 4;  // 45 degrees
    this.loadModifier(modifier, c, this.up_angle - angle_delta, this.up_angle + angle_delta);
    this.max_used_word_radius = this.word_circle.radius;
    if (this.main_count > 1) {
        var current_radius = c.radius;
        for (var i=1; i < this.main_count; ++i) {
            current_radius += c.line_width * 2;
            var c2 = new PUBLIC.Circle(c.center.x, c.center.y, current_radius);
            this.draw_objects.push(c2);
        }
    }
    this.loadSecondaryVowel(c);
};

PUBLIC.Char.prototype.loadT = function(modifier) {
    var offset_distance = -this.consonant_radius * 2.3; // Magic number
    var c = new PUBLIC.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius * 3.2);
    this.loadArc(modifier, c);
    this.max_used_word_radius = this.word_circle.radius;
    if (this.main_count > 1) {
        var current_radius = c.radius;
        for (var i=1; i < this.main_count; ++i) {
            current_radius += c.line_width * 2;
            var c2 = new PUBLIC.Circle(c.center.x, c.center.y, current_radius);
            this.loadArc(null, c2, true);
        }
    }
    this.loadSecondaryVowel(c);
};

PUBLIC.Char.prototype.loadTH = function(modifier) {
    var c = new PUBLIC.Circle(this.x, this.y, this.consonant_radius);
    this.draw_objects.push(c);
    var angle_delta = Math.PI / 3;  // 60 degrees
    this.loadModifier(modifier, c, this.up_angle - angle_delta, this.up_angle + angle_delta);
    this.max_used_word_radius = this.word_circle.radius + this.consonant_radius;
    this.loadSecondaryVowel(c);
};

PUBLIC.Char.prototype.repeatVowel = function(circle, is_secondary) {
    function doRepeatVowel(c, count, draw_objs) {
        if (count > 1) {
            var current_radius = c.radius;
            for (var i=1; i < count; ++i) {
                current_radius -= c.line_width * 2;
                if (current_radius > 0) {
                    var c2 = new PUBLIC.Circle(c.center.x, c.center.y, current_radius);
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
};

PUBLIC.Char.prototype.loadA = function(circle, is_secondary) {
    is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
    var distance_factor = 1.6;
    var c = new PUBLIC.Circle(
        this.x - this.up_vector.x * this.vowel_radius * distance_factor,
        this.y - this.up_vector.y * this.vowel_radius * distance_factor,
        this.vowel_radius);
    if (!(is_secondary && /^([yzx]|th|ng|qu)$/i.test(this.main))) {
        this.max_used_word_radius = this.word_circle.radius + this.vowel_radius * distance_factor;
    }
    this.draw_objects.push(c);
    this.repeatVowel(c, is_secondary);
    return c;
};

PUBLIC.Char.prototype.loadE = function(circle, is_secondary) {
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
    var c = new PUBLIC.Circle(c_x, c_y, this.vowel_radius);
    if (!is_secondary) {
        this.max_used_word_radius = this.word_circle.radius + this.vowel_radius;
    }
    this.draw_objects.push(c);
    this.repeatVowel(c, is_secondary);
    return c;
};

PUBLIC.Char.prototype.loadI = function(circle, is_secondary) {
    is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
    var c = this.loadE(circle, is_secondary);
    this.dots = [];
    this.mod_lines = [];
    var angle_delta = Math.PI / 12;  // 15 degrees
    var angles = PUBLIC.util.randomize_angles(1, this.up_angle - angle_delta, this.up_angle + angle_delta);
    this.loadModifierLine(c, angles[0], true);  // this.up_angle, true);
};

PUBLIC.Char.prototype.loadO = function(circle, is_secondary) {
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
    var c = new PUBLIC.Circle(c_x, c_y, this.vowel_radius);
    if (!(is_secondary && /^([yzx]|th|ng|qu)$/i.test(this.main))) {
        this.max_used_word_radius = this.word_circle.radius;
    }
    this.draw_objects.push(c);
    this.repeatVowel(c, is_secondary);
    return c;
};

PUBLIC.Char.prototype.loadU = function(circle, is_secondary) {
    var c = this.loadE(circle, is_secondary);
    this.dots = [];
    this.mod_lines = [];
    var angle_delta = Math.PI / 12;  // 15 degrees
    var angles = PUBLIC.util.randomize_angles(1, this.up_angle + Math.PI - angle_delta, this.up_angle + Math.PI + angle_delta);
    this.loadModifierLine(c, angles[0], true);  //this.up_angle - Math.PI, true);
};

PUBLIC.Char.prototype.loadSecondaryVowel = function(circle) {
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
};

PUBLIC.Char.prototype.loadOther = function() {
    var p = new PUBLIC.Point(this.x, this.y);
    p.line_color = "#ff0000";
    p.line_width = 8;
    this.draw_objects.push(p);
};

PUBLIC.Char.prototype.getFirstChar = function(text) {
    this.main = "";
    this.main_count = 0;
    this.secondary = "";
    this.secondary_count = 0;
    if (text === null || text.length <= 0) {
        return;
    }

    var vowels = /^[aeiou]/i;
    //var single_consonants = /^[bcdfghjklmnprstvwxyz]/i;
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
        } else { //if (single_consonants.test(c)) {
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
};

PUBLIC.Char.prototype.countCharRepeat = function(text, start_index) {
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
};

PUBLIC.Char.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
    var i, obj;
    var object_list = [];
    for (i in this.draw_objects) {
        obj = this.draw_objects[i];
        if (obj.isMouseOver(mouse_x, mouse_y)) {
            object_list.push(obj);
        }
    }
    for (i in this.mod_lines) {
        obj = this.mod_lines[i];
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
};

PUBLIC.Char.prototype.setLineColor = function(new_color) {
    var i;
    for (i in this.draw_objects) {
        this.draw_objects[i].line_color = new_color;
    }
    for (i in this.mod_lines) {
        this.mod_lines[i].line_color = new_color;
    }
    if (this.mod_line_secondary) {
        this.mod_line_secondary.line_color = new_color;
    }
};

    
/********************************** UTIL *************************************/

PUBLIC.util = {
    bhaskara: function(A, B, C) {
        // If A=0, then it is NOT a second degree polynomial
        if (A !== 0) {
            var delta = B*B - 4*A*C;
            if (delta < 0) {
                return [];
            }
            var sqrt_delta = Math.sqrt(delta);
            var r1 = (-B + sqrt_delta) / (2*A);
            var r2 = (-B - sqrt_delta) / (2*A);
            return [ r1, r2 ];
        } else if (B !== 0) {
            return [ -C / B ];
        }
        return [];
    },
    angle_between_points: function(base_x, base_y, target_x, target_y) {
        var dx = target_x - base_x;
        var dy = target_y - base_y;
        return PUBLIC.util.normalize_angle(Math.atan2(dy, dx), 0);
    },
    normalize_angle: function(angle, start_angle) {
        // Converts any "angle" to the range ["start_angle" ~ "start_angle" + 360 degrees]
        while (angle < start_angle) {
            angle += Math.TWOPI;
        }
        var end_angle = start_angle + Math.TWOPI;
        while (angle > end_angle) {
            angle -= Math.TWOPI;
        }
        return angle;
    },
    points_distance: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy);
    },
    // Kind of randomize the angles in certain intervals
    randomize_angles: function(count, min_angle, max_angle) {
        var angles = [];
        if (typeof(count) === "undefined" || count <= 0) {
            return angles;
        }
        
        // Normalize angles
        min_angle = typeof(min_angle) === "undefined" ? 0 : min_angle;
        max_angle = typeof(max_angle) === "undefined" ? Math.TWOPI : max_angle;
        if (min_angle > max_angle) {
            min_angle -= Math.TWOPI;
        }

        var range = max_angle - min_angle;
        var i;
        var total_slots = count * 3;
        var slots = [];
        var slot_step = range / (total_slots - 1);

        for (i = min_angle; i <= max_angle; i += slot_step) {
            slots.push(i);
        }

        for (i = 0; i < count; ++i) {
            var slot_id = Math.floor(Math.random() * slots.length);
            angles.push(slots[slot_id]);
            slots.splice(slot_id, 1);
        }
        return angles;
    },
    line_equation: function(start_x, start_y, end_x, end_y) {
        // Line equation is:  y = A*X + B
        // Except when it's a vertical line, then it's:  x = A*y + B
        var result = {
            a: 0,
            b: 0,
            vertical: false
        };

        var dx = end_x - start_x;
        var dy = end_y - start_y;

        if (dx > 0.0001) {
            // Not near vertical

            result.a = dy / dx;
            result.b = result.a * start_y + start_x;
        } else {
            // Is near vertical
            result.a = dx / dy;
            result.b = result.a * start_x + start_y;
            result.vertical = true;
        }

        return result;
    }
};

/***************************** INTERSECTIONS *********************************/
PUBLIC.util.isect_line_circle = function(line, circle) {
    var default_result = [];

    // Line: y = ax + b
    // Circle: (x − p)^2 + (y − q)^2 = r^2
    // p = circle.center.x
    // q = circle.center.y
    // r = circle.radius

    var point1 = new PUBLIC.Point();
    var point2 = new PUBLIC.Point();
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

        var y_points = PUBLIC.util.bhaskara(A, B, C);
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

        var x_points = PUBLIC.util.bhaskara(A, B, C);
        if (x_points.length != 2) {
            return default_result;
        }

        point1.x = x_points[0];
        point1.y = a*point1.x + b;

        point2.x = x_points[1];
        point2.y = a*point2.x + b;
    }

    return [ point1, point2 ];
};

PUBLIC.util.isect_circle_circle = function(circle1, circle2) {
    var default_result = [];

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

    var p2 = new PUBLIC.Point();
    var p3_a = new PUBLIC.Point();
    var p3_b = new PUBLIC.Point();

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
};


})(this); // usually, 'this = window;' but sometimes the user may want to include inside his own code
