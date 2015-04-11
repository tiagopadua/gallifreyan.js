/******************************** ARC ****************************************/
window.gallifreyan.Arc = function(x, y, r, begin, end) {
    this.name = "Arc";
    this.circle = new window.gallifreyan.Circle(x, y, r)
    this.begin_angle = typeof begin !== 'undefined' ? begin : 0;
    this.end_angle = typeof end !== 'undefined' ? end : Math.TWOPI;
}
window.gallifreyan.Arc.prototype = new gallifreyan.Graphic();
window.gallifreyan.Arc.prototype._pre_draw = window.gallifreyan.Arc.prototype._draw;
window.gallifreyan.Arc.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.begin_angle, this.end_angle);
}
window.gallifreyan.Arc.prototype.intersectPoints = function(target) {
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
        isect_points = window.gallifreyan.util.isect_line_circle(target, this.circle);
        result = [];
        for (i in isect_points) {
            point = isect_points[i];
            if (this.containsPoint(point) && target.boxContains(point)) {
                result.push(point);
            }
        }
        return result;
    } else if (target.name == 'Circle') {
        isect_points = window.gallifreyan.util.isect_circle_circle(this.circle, target);
        result = [];
        for (i in isect_points) {
            point = isect_points[i];
            if (this.containsPoint(point)) {
                result.push(point);
            }
        }
        return result;
    } else if (target.name == 'Arc') {
        isect_points = window.gallifreyan.util.isect_circle_circle(this.circle, target.circle);
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
window.gallifreyan.Arc.prototype.containsPoint = function(point) {
    if (typeof point === 'undefined') {
        return false;
    }
    angle = Math.atan2(point.y - this.circle.center.y, point.x - this.circle.center.x);
    if ((angle >= this.begin_angle) && (angle <= this.end_angle)) {
        return true;
    }
    return false;
}
window.gallifreyan.Arc.prototype.isMouseOver = function(mouse_x, mouse_y) {
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
/********************************** CHAR *************************************/
// This can be a single character, repeated "n" times and/or followed by
// a vowel (which could also be repeated "n" times)
window.gallifreyan.Char = function(text, center_x, center_y, max_diameter, up_vector, word_circle, sentence_circle) {
    this.draw_objects = [];
    this.max_circle = null;
    this.owner_intersect_object = null;
    this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
    this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
    this.up_angle = -Math.HALFPI;
    this.up_vector = typeof up_vector !== 'undefined' ? up_vector : new window.gallifreyan.Point(0, -1);
    this.word_circle = typeof word_circle !== 'undefined' ? word_circle : new window.gallifreyan.Circle(0, 0, 1);
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
}
window.gallifreyan.Char.prototype.setX = function(new_x) {
    this.x = typeof new_x !== 'undefined' ? new_x : this.radius;
    this.loadObjects();
}
window.gallifreyan.Char.prototype.setY = function(new_y) {
    this.y = typeof new_y !== 'undefined' ? new_y : this.radius;
    this.loadObjects();
}
window.gallifreyan.Char.prototype.setMaxDiameter = function(max_diameter) {
    this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 50;
    this.radius = this.max_diameter / 2;
    this.consonant_radius = this.radius * .45; // 90% of the max radius = the diameter of the consonant circle
    this.vowel_radius = this.consonant_radius * .3; // 20%
    if (!this.max_circle) {
        this.max_circle = new window.gallifreyan.Circle();
    }
    this.max_circle.center.x = this.x;
    this.max_circle.center.y = this.y;
    this.max_circle.radius = this.max_diameter/2;
    this.max_circle.line_color = window.gallifreyan.guideline_color;
    this.max_circle.line_width = 1;
    this.loadObjects();
}
window.gallifreyan.Char.prototype.draw = function(canvas) {
    var i = null;
    for (i in this.draw_objects) {
        this.draw_objects[i].draw(canvas);
    }
    if (window.gallifreyan.draw_guidelines && this.max_circle) {
        this.max_circle.draw(canvas);
    }
}
window.gallifreyan.Char.prototype.loadObjects = function() {
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
}
window.gallifreyan.Char.prototype.loadModifier = function(modifier, circle, min_angle, max_angle) {
    var distance = 1;
    var small_dot_size = this.consonant_radius * .07;
    var big_dot_size = this.consonant_radius * .10;
    var angle_ratio = circle.radius / Math.PI;
    this.dots = [];
    this.mod_lines = [];
    switch (modifier) {
        case '3dots':
            var p3_angle = (this.up_angle * angle_ratio - big_dot_size) / angle_ratio;
            var p3 = new window.gallifreyan.Point(
                circle.center.x + Math.cos(p3_angle) * (circle.radius - big_dot_size * 1.8),
                circle.center.y + Math.sin(p3_angle) * (circle.radius - big_dot_size * 1.8),
                small_dot_size);
            this.dots.push(p3);
            this.draw_objects.push(p3);
            var p1 = new window.gallifreyan.Point(
                circle.center.x + this.up_vector.x * (circle.radius - big_dot_size * 1.8),
                circle.center.y + this.up_vector.y * (circle.radius - big_dot_size * 1.8),
                big_dot_size);
            this.dots.push(p1);
            this.draw_objects.push(p1);
            var p2_angle = (this.up_angle * angle_ratio + big_dot_size) / angle_ratio;
            var p2 = new window.gallifreyan.Point(
                circle.center.x + Math.cos(p2_angle) * (circle.radius - big_dot_size * 1.8),
                circle.center.y + Math.sin(p2_angle) * (circle.radius - big_dot_size * 1.8),
                small_dot_size);
            this.dots.push(p2);
            this.draw_objects.push(p2);
            break;
        case '2dots':
            var p1_angle = (this.up_angle * angle_ratio - small_dot_size / 1.8) / angle_ratio;
            var p1 = new window.gallifreyan.Point(
                circle.center.x + Math.cos(p1_angle) * (circle.radius - big_dot_size * 1.5),
                circle.center.y + Math.sin(p1_angle) * (circle.radius - big_dot_size * 1.5),
                small_dot_size);
            this.draw_objects.push(p1);
            var p2_angle = (this.up_angle * angle_ratio + small_dot_size / 1.8) / angle_ratio;
            var p2 = new window.gallifreyan.Point(
                circle.center.x + Math.cos(p2_angle) * (circle.radius - big_dot_size * 1.5),
                circle.center.y + Math.sin(p2_angle) * (circle.radius - big_dot_size * 1.5),
                small_dot_size);
            this.draw_objects.push(p2);
            break;
        case '2lines':
            var angles = window.gallifreyan.util.randomize_angles(2, min_angle, max_angle);
            //var l1_angle = (this.up_angle * angle_ratio - big_dot_size / 2) / angle_ratio;
            this.loadModifierLine(circle, angles[0]);
            //var l2_angle = (this.up_angle * angle_ratio + big_dot_size / 2) / angle_ratio;
            this.loadModifierLine(circle, angles[1]);
            break;
        case '3lines':
            var angles = window.gallifreyan.util.randomize_angles(3, min_angle, max_angle);
            //var l3_angle = (this.up_angle * angle_ratio - big_dot_size) / angle_ratio;
            //var l2_angle = (this.up_angle * angle_ratio + big_dot_size) / angle_ratio;
            this.loadModifierLine(circle, angles[0]);
            this.loadModifierLine(circle, angles[1]); //this.up_angle);
            this.loadModifierLine(circle, angles[2]); //l2_angle);
            break;
        case '1line':
            var angles = window.gallifreyan.util.randomize_angles(1, min_angle, max_angle);
            this.loadModifierLine(circle, angles[0]); //this.up_angle);
            break;
    }
}
window.gallifreyan.Char.prototype.loadModifierLine = function(circle, angle, is_secondary) {
    if (typeof(is_secondary) === 'undefined') {
        is_secondary = false;
    }
    var l = new window.gallifreyan.Line(
        circle.center.x + Math.cos(angle) * (circle.radius + circle.line_width/2),
        circle.center.y + Math.sin(angle) * (circle.radius + circle.line_width/2),
        circle.center.x + Math.cos(angle) * this.sentence_circle.radius * 2,
        circle.center.y + Math.sin(angle) * this.sentence_circle.radius * 2);
    var p_list = l.intersectPoints(this.sentence_circle);
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
window.gallifreyan.Char.prototype.shareModifierLine = function(shared_list) {
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

        var axis = new window.gallifreyan.Line(this_line.holder_circle.center.x,
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
window.gallifreyan.Char.prototype.loadArc = function(modifier, circle, skip_intersect_points) {
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

    var a = new window.gallifreyan.Arc();
    a.circle = circle;
    a.begin_angle = arc_begin;
    a.end_angle = arc_end;
    this.draw_objects.push(a);

    while (arc_end < arc_begin) {
        arc_end += Math.TWOPI;
    }
    var angle_delta = Math.min(Math.PI/4, (arc_end - arc_begin)/2.5);

    this.loadModifier(modifier, circle, this.up_angle - angle_delta, this.up_angle + angle_delta);
}
window.gallifreyan.Char.prototype.loadB = function(modifier) {
    var offset_distance = this.consonant_radius * .9;
    var c = new window.gallifreyan.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
    this.owner_intersect_object = c;
    this.loadArc(modifier, c);
    this.max_used_word_radius = this.word_circle.radius;
    if (this.main_count > 1) {
        var current_radius = c.radius;
        for (var i=1; i < this.main_count; ++i) {
            current_radius += c.line_width * 2;
            var c2 = new window.gallifreyan.Circle(c.center.x, c.center.y, current_radius);
            this.loadArc(null, c2, true);
        }
    }
    this.loadSecondaryVowel(c, true);
}
window.gallifreyan.Char.prototype.loadJ = function(modifier) {
    var offset_distance = this.radius * .55;
    var c = new window.gallifreyan.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius);
    this.owner_intersect_object = c;
    this.draw_objects.push(c);
    var angle_delta = Math.PI / 4;  // 45 degrees
    this.loadModifier(modifier, c, this.up_angle - angle_delta, this.up_angle + angle_delta);
    this.max_used_word_radius = this.word_circle.radius;
    if (this.main_count > 1) {
        var current_radius = c.radius;
        for (var i=1; i < this.main_count; ++i) {
            current_radius += c.line_width * 2;
            var c2 = new window.gallifreyan.Circle(c.center.x, c.center.y, current_radius);
            this.draw_objects.push(c2);
        }
    }
    this.loadSecondaryVowel(c);
}
window.gallifreyan.Char.prototype.loadT = function(modifier) {
    var offset_distance = -this.consonant_radius * 2.3; // Magic number
    var c = new window.gallifreyan.Circle(this.x + offset_distance*this.up_vector.x, this.y + offset_distance*this.up_vector.y, this.consonant_radius * 3.2);
    this.loadArc(modifier, c);
    this.max_used_word_radius = this.word_circle.radius;
    if (this.main_count > 1) {
        var current_radius = c.radius;
        for (var i=1; i < this.main_count; ++i) {
            current_radius += c.line_width * 2;
            var c2 = new window.gallifreyan.Circle(c.center.x, c.center.y, current_radius);
            this.loadArc(null, c2, true);
        }
    }
    this.loadSecondaryVowel(c);
}
window.gallifreyan.Char.prototype.loadTH = function(modifier) {
    var c = new window.gallifreyan.Circle(this.x, this.y, this.consonant_radius);
    this.draw_objects.push(c);
    var angle_delta = Math.PI / 3;  // 60 degrees
    this.loadModifier(modifier, c, this.up_angle - angle_delta, this.up_angle + angle_delta);
    this.max_used_word_radius = this.word_circle.radius + this.consonant_radius;
    this.loadSecondaryVowel(c);
}
window.gallifreyan.Char.prototype.repeatVowel = function(circle, is_secondary) {
    function doRepeatVowel(c, count, draw_objs) {
        if (count > 1) {
            var current_radius = c.radius;
            for (var i=1; i < count; ++i) {
                current_radius -= c.line_width * 2;
                if (current_radius > 0) {
                    var c2 = new window.gallifreyan.Circle(c.center.x, c.center.y, current_radius);
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
window.gallifreyan.Char.prototype.loadA = function(circle, is_secondary) {
    is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
    var distance_factor = 1.6;
    var c = new window.gallifreyan.Circle(
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
window.gallifreyan.Char.prototype.loadE = function(circle, is_secondary) {
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
    var c = new window.gallifreyan.Circle(c_x, c_y, this.vowel_radius);
    if (!is_secondary) {
        this.max_used_word_radius = this.word_circle.radius + this.vowel_radius;
    }
    this.draw_objects.push(c);
    this.repeatVowel(c, is_secondary);
    return c;
}
window.gallifreyan.Char.prototype.loadI = function(circle, is_secondary) {
    is_secondary = typeof is_secondary === "boolean" ? is_secondary : false;
    var c = this.loadE(circle, is_secondary);
    this.dots = [];
    this.mod_lines = [];
    var angle_delta = Math.PI / 12;  // 15 degrees
    var angles = window.gallifreyan.util.randomize_angles(1, this.up_angle - angle_delta, this.up_angle + angle_delta);
    this.loadModifierLine(c, angles[0], true);  // this.up_angle, true);
}
window.gallifreyan.Char.prototype.loadO = function(circle, is_secondary) {
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
    var c = new window.gallifreyan.Circle(c_x, c_y, this.vowel_radius);
    if (!(is_secondary && /^([yzx]|th|ng|qu)$/i.test(this.main))) {
        this.max_used_word_radius = this.word_circle.radius;
    }
    this.draw_objects.push(c);
    this.repeatVowel(c, is_secondary);
    return c;
}
window.gallifreyan.Char.prototype.loadU = function(circle, is_secondary) {
    var c = this.loadE(circle, is_secondary);
    this.dots = [];
    this.mod_lines = [];
    var angle_delta = Math.PI / 12;  // 15 degrees
    var angles = window.gallifreyan.util.randomize_angles(1, this.up_angle + Math.PI - angle_delta, this.up_angle + Math.PI + angle_delta);
    this.loadModifierLine(c, angles[0], true);  //this.up_angle - Math.PI, true);
}
window.gallifreyan.Char.prototype.loadSecondaryVowel = function(circle) {
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
window.gallifreyan.Char.prototype.loadOther = function() {
    var p = new window.gallifreyan.Point(this.x, this.y);
    p.line_color = "#ff0000";
    p.line_width = 8;
    this.draw_objects.push(p);
}
window.gallifreyan.Char.prototype.getFirstChar = function(text) {
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
}
window.gallifreyan.Char.prototype.countCharRepeat = function(text, start_index) {
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
window.gallifreyan.Char.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
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
window.gallifreyan.Char.prototype.setLineColor = function(new_color) {
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
/******************************* CIRCLE **************************************/
window.gallifreyan.Circle = function(x, y, r) {
    this.name = "Circle";
    this.center = new window.gallifreyan.Point(x, y);
    this.radius = typeof r !== 'undefined' ? r : 1;
}
window.gallifreyan.Circle.prototype = new gallifreyan.Graphic();
window.gallifreyan.Circle.prototype._pre_draw = window.gallifreyan.Circle.prototype._draw;
window.gallifreyan.Circle.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.TWOPI);
}
window.gallifreyan.Circle.prototype.intersectPoints = function(target) {
    var default_result = [];

    // Discover the target type
    if (typeof target === 'undefined' || target == null) {
        return default_result;
    }
    if (typeof target.name === 'undefined' || target.name == null) {
        return default_result;
    }

    if (target.name == 'Circle') {
        return window.gallifreyan.util.isect_circle_circle(this, target);
    } else if (target.name == 'Line') {
        return window.gallifreyan.util.isect_line_circle(target, this);
    }
    return default_result;
}
window.gallifreyan.Circle.prototype.isMouseOver = function(mouse_x, mouse_y) {
    var delta_x = mouse_x - this.center.x;
    var delta_y = mouse_y - this.center.y;
    var distance = Math.sqrt(delta_x*delta_x + delta_y*delta_y);

    var half_width = Math.max(5, this.line_width / 2);
    return ( (distance <= (this.radius + half_width)) &&
             (distance >= (this.radius - half_width)) );
}
/******************************** TEST ***************************************/
window.gallifreyan.drawTest = function(canvas) {
        var s = new SELF.Sentence('bthtj', 20, 20, 460);
        //var s = new SELF.Sentence('jthjthjthbjbjbj', 100, 100);
        //var s = new SELF.Sentence('abajatatha chekesheye dilirizi fomosongo gunuvuquu hapawaxa', 4, 296);
        s.draw(canvas);
    }
(function(e,h){Math.TWOPI=2*Math.PI;Math.HALFPI=Math.PI/2;Math.THREEQUARTERSPI=Math.PI+Math.HALFPI;e.draw_guidelines=false;e.guideline_color="#999933";e.Graphic=function(i){this.name="Graphic";this.canvas=typeof i!=="undefined"?i:null;this.line_color="#f0cc05";this.line_width=2;this.visible=true};e.Graphic.prototype._draw=function(i){i.strokeStyle=this.line_color;i.lineWidth=this.line_width;i.lineCap="round"};e.Graphic.prototype.draw=function(i){if(!this.visible){return}if(typeof i!=="undefined"){this.canvas=i}if((typeof this.canvas==="undefined")||(this.canvas===null)){return}context=this.canvas.getContext("2d");context.beginPath();this._draw(context);context.stroke()};e.Point=function(i,k,j){this.name="Point";this.x=typeof i!=="undefined"?i:0;this.y=typeof k!=="undefined"?k:0;if(typeof j==="number"){this.line_width=j}};e.Point.prototype=new gallifreyan.Graphic();e.Point.prototype._pre_draw=e.Point.prototype._draw;e.Point.prototype._draw=function(j){this._pre_draw(j);var i=this.line_width/2.01;j.arc(this.x,this.y,i,0,Math.TWOPI)};e.Point.prototype.moveXY=function(j,i){this.x+=j;this.y+=i;return this};e.Point.prototype.move=function(j,i){this.moveXY(Math.cos(j)*i,Math.sin(j)*i);return this};e.Point.prototype.isMouseOver=function(k,j){var i=Math.max(5,this.line_width);if((k<(this.x-i))||(k>(this.x+i))||(j<(this.y-i))||(j>(this.y+i))){return false}var n=k-this.x;var l=j-this.y;var m=Math.sqrt(n*n+l*l);return((m<=i)&&(m>=-i))};e.Line=function(j,i,l,k){this.name="Line";this.begin=new e.Point(j,i);this.end=new e.Point(l,k)};e.Line.prototype=new gallifreyan.Graphic();e.Line.prototype._pre_draw=e.Line.prototype._draw;e.Line.prototype._draw=function(i){this._pre_draw(i);i.moveTo(this.begin.x,this.begin.y);i.lineTo(this.end.x,this.end.y)};e.Line.prototype.boxContains=function(j){if(typeof j==="undefined"){return false}var k=0;var m=0;var i=0;var l=0;if(this.begin.x<this.end.x){k=this.begin.x;m=this.end.x}else{k=this.end.x;m=this.begin.x}if(this.begin.y<this.end.y){i=this.begin.y;l=this.end.y}else{i=this.end.y;l=this.begin.y}return((j.x>=k&&j.x<=m)&&(j.y>=i&&j.y<=l))};e.Line.prototype.intersectPoints=function(o){var m=[];if(typeof o==="undefined"||o==null){return m}if(typeof o.name==="undefined"||o.name==null){return m}if(o.name=="Circle"){var j=[];var l=b(this,o);for(var k in l){var n=l[k];if(this.boxContains(n)){j.push(n)}}return j}return m};e.Line.prototype.perpendicularMove=function(j){if(this.begin.x==this.end.x){this.begin.y+=j}else{if(this.begin.y==this.end.y){this.begin.x+=j}else{var i=Math.atan2(this.end.y-this.begin.y,this.end.x-this.begin.x);this.begin.move(i+Math.HALFPI,j);this.end.move(i+Math.HALFPI,j)}}return this};e.Line.prototype.isMouseOver=function(n,m){var l=Math.max(5,this.line_width/2);var s=Math.min(this.begin.x,this.end.x)-l;var p=Math.min(this.begin.y,this.end.y)-l;var i=Math.max(this.begin.x,this.end.x)+l;var v=Math.max(this.begin.y,this.end.y)+l;if((n<s)||(m<p)||(n>i)||(m>v)){return false}var w=this.end.x-this.begin.x;var u=this.end.y-this.begin.y;if(Math.abs(w)>0.001){var r=u/w;var o=this.begin.y-r*this.begin.x;var t=0;var q=0;var k=0;var j=0;if(r>0.001){t=Math.tan(Math.atan(r)+Math.HALFPI);q=m-(t*n);k=(q-o)/(r-t);j=r*k+o}else{t=r;q=n-(t*m);k=(t*o+q)/(1-r*t);j=r*k+o}return(c(n,m,k,j)<=l)}else{var r=w/u;var o=this.begin.x-r*this.begin.y;var t=0;var q=0;var k=0;var j=0;if(r>0.001){t=Math.tan(Math.atan(r)+Math.HALFPI);q=n-(t*m);j=(q-o)/(r-t);k=r*j+o}else{t=r;q=m-(t*n);j=(t*o+q)/(1-r*t);k=r*j+o}return(c(n,m,k,j)<=l)}return false};e.Circle=function(i,k,j){this.name="Circle";this.center=new e.Point(i,k);this.radius=typeof j!=="undefined"?j:1};e.Circle.prototype=new gallifreyan.Graphic();e.Circle.prototype._pre_draw=e.Circle.prototype._draw;e.Circle.prototype._draw=function(i){this._pre_draw(i);i.arc(this.center.x,this.center.y,this.radius,0,Math.TWOPI)};e.Circle.prototype.intersectPoints=function(j){var i=[];if(typeof j==="undefined"||j==null){return i}if(typeof j.name==="undefined"||j.name==null){return i}if(j.name=="Circle"){return d(this,j)}else{if(j.name=="Line"){return b(j,this)}}return i};e.Circle.prototype.isMouseOver=function(k,i){var n=k-this.center.x;var l=i-this.center.y;var m=Math.sqrt(n*n+l*l);var j=Math.max(5,this.line_width/2);return((m<=(this.radius+j))&&(m>=(this.radius-j)))};e.Arc=function(i,m,l,k,j){this.name="Arc";this.circle=new e.Circle(i,m,l);this.begin_angle=typeof k!=="undefined"?k:0;this.end_angle=typeof j!=="undefined"?j:Math.TWOPI};e.Arc.prototype=new gallifreyan.Graphic();e.Arc.prototype._pre_draw=e.Arc.prototype._draw;e.Arc.prototype._draw=function(i){this._pre_draw(i);i.arc(this.circle.center.x,this.circle.center.y,this.circle.radius,this.begin_angle,this.end_angle)};e.Arc.prototype.intersectPoints=function(m){var l=null;var j=null;var k=[];if(typeof m==="undefined"){return k}if(typeof m.name==="undefined"){return k}if(m.name=="Line"){isect_points=b(m,this.circle);result=[];for(l in isect_points){j=isect_points[l];if(this.containsPoint(j)&&m.boxContains(j)){result.push(j)}}return result}else{if(m.name=="Circle"){isect_points=d(this.circle,m);result=[];for(l in isect_points){j=isect_points[l];if(this.containsPoint(j)){result.push(j)}}return result}else{if(m.name=="Arc"){isect_points=d(this.circle,m.circle);result=[];for(l in isect_points){j=isect_points[l];if(this.containsPoint(j)&&m.containsPoint(j)){result.push(j)}}return result}}}return k};e.Arc.prototype.containsPoint=function(i){if(typeof i==="undefined"){return false}angle=Math.atan2(i.y-this.circle.center.y,i.x-this.circle.center.x);if((angle>=this.begin_angle)&&(angle<=this.end_angle)){return true}return false};e.Arc.prototype.isMouseOver=function(j,i){if(!this.circle.isMouseOver(j,i)){return false}var k=Math.atan2(i-this.circle.center.y,j-this.circle.center.x);var m=this.begin_angle;var n=this.end_angle;while(m>n){m-=Math.TWOPI}if((n>Math.PI)&&(k<(n-Math.TWOPI))){k+=Math.TWOPI}if((m<-Math.PI)&&(k>(m+Math.TWOPI))){k-=Math.TWOPI}var l=(k>=m)&&(k<=n);return l};e.Sentence=function(l,k,j,i){this.text=typeof l!=="undefined"?l:"";this.size=typeof i!=="undefined"?i:300;this.left=typeof k!=="undefined"?k:0;this.top=typeof j!=="undefined"?j:0;this.center_x=this.left+this.size/2;this.center_y=this.top+this.size/2;this.outside_circle=new e.Circle(this.center_x,this.center_y,this.size/2);this.outside_circle.line_width*=1.4;this.inside_circle=new e.Circle(this.center_x,this.center_y,this.size/2-6);this.words=[];this.setText(l)};e.Sentence.prototype.draw=function(j){var n=j.getContext("2d");n.clearRect(0,0,j.width,j.height);var m=n.createLinearGradient(0,0,j.width,j.height);m.addColorStop(0,"#00345c");m.addColorStop(1,"#00112b");n.fillStyle=m;n.fillRect(0,0,j.width,j.height);var l=null;var k=null;var o=null;this.outside_circle.draw(j);this.inside_circle.draw(j);for(l in this.words){this.words[l].draw(j)}};e.Sentence.prototype.setText=function(x){var m=null;var u=null;var r=null;this.words=[];this.text=this.preprocessText(x.trim());var j=this.inside_circle.radius*0.95;var l=this.text.split(" ");if(l&&l.length==1){r=new e.Word(l[0],this.center_x,this.center_y,j*2,this.inside_circle);this.words.push(r)}else{var n=-Math.TWOPI/l.length;var s=Math.PI/2;var t=Math.abs(Math.sin(n/2));var y=j*t/(1+t);var v=j-y;for(m in l){u=l[m];var k=Math.sin(s);var p=Math.cos(s);var q=this.center_x+v*p;var o=this.center_y+v*k;r=new e.Word(u,q,o,y*2,this.inside_circle);this.words.push(r);s+=n}}};e.Sentence.prototype.preprocessText=function(o){var l=/[a-z ]/i;var n=/[ei]/i;var j="";for(var k=0;k<o.length;++k){var p=o[k];if(!l.test(p)){continue}if(p=="c"){if(o.length>(k+1)){var m=o[k+1];if(n.test(m)){j+="s"}else{j+="k"}}else{j+="k"}}else{if(p=="q"){if(o.length>(k+1)){var m=o[k+1];if(m=="u"){j+="q"}else{j+="k"}}else{j+="k"}}else{j+=p}}}return j};e.Sentence.prototype.mouseOverObjects=function(m,k){var q=[];if(this.outside_circle.isMouseOver(m,k)){q.push(this.outside_circle)}if(this.inside_circle.isMouseOver(m,k)){q.push(this.inside_circle)}for(var p in this.words){var n=this.words[p].mouseOverObjects(m,k);for(var o in n){var l=n[o];q.push(l)}}return q};e.Sentence.prototype.setLineColor=function(k){this.inside_circle.line_color=k;this.outside_circle.line_color=k;for(var j in this.words){this.words[j].setLineColor(k)}};e.Word=function(m,k,j,l,i){this.max_diameter=typeof l!=="undefined"?l:250;this.radius=this.max_diameter/2;this.x=typeof k!=="undefined"?k:this.radius;this.y=typeof j!=="undefined"?j:this.radius;this.circle=new e.Circle(this.x,this.y,this.radius);this.circle.line_color=e.guideline_color;this.circle.line_width=1;this.sentence_circle=typeof i!=="undefined"?i:this.circle;this.arcs_circle=new e.Circle(this.x,this.y,this.radius);this.arcs_circle.line_color=e.guideline_color;this.arcs_circle.line_width=1;this.arcs=[new e.Arc(this.x,this.y,this.radius,0,Math.TWOPI)];this.text="";this.chars=[];this.setText(m)};e.Word.prototype.draw=function(j){var l=null;var k=null;for(l in this.arcs){k=this.arcs[l];k.draw(j)}for(l in this.chars){this.chars[l].draw(j)}if(e.draw_guidelines){this.circle.draw(j);this.arcs_circle.draw(j)}};e.Word.prototype.setText=function(j){this.text=j=j.trim().split(" ")[0];this.chars=[];var i=0;var k=null;while((j.length>0)&&(i!=j.length)){k=new e.Char(j);this.chars.push(k);i=j.length;j=j.substr(k.main.length*k.main_count+k.secondary.length*k.secondary_count)}this.setDimensions()};e.Word.prototype.setDimensions=function(){if(!this.chars||this.chars.length<=0){return}var i=20;if(this.chars.length>0){if(this.chars.length==1){this.arcs_circle.center.y=this.y-this.radius*0.15;this.arcs_circle.radius=this.radius*0.7;i=this.max_diameter}else{this.arcs_circle.center.y=this.y;var j=(Math.TWOPI/this.chars.length)/2;var l=Math.sin(j);i=2*this.arcs_circle.radius*Math.sin(j);var k=this.positionChars(i,true);this.arcs_circle.radius=k.radius;this.arcs_circle.center.x=k.center.x;this.arcs_circle.center.y=k.center.y;i=2*this.arcs_circle.radius*Math.sin(j);if(this.chars.length==2){i*=0.93}}this.positionChars(i)}};e.Word.prototype.positionChars=function(o,n){n=typeof n!=="boolean"?false:n;var F=null;var E=null;var y=Math.PI/2;var L=-Math.TWOPI/this.chars.length;var x=[];var I=true;var C=true;var t=null;var s=new e.Point(this.arcs_circle.center.x,this.arcs_circle.center.y);for(F in this.chars){var J=this.chars[F];J.sentence_circle=this.sentence_circle;J.up_angle=y+Math.PI;J.up_vector=new e.Point(Math.cos(J.up_angle),Math.sin(J.up_angle));J.word_circle=this.arcs_circle;J.x=this.arcs_circle.center.x+this.arcs_circle.radius*Math.cos(y);J.y=this.arcs_circle.center.y+this.arcs_circle.radius*Math.sin(y);J.setMaxDiameter(o);var z=J.word_intersect_points;if(z.length==2){var m=z[0];var l=z[1];var M=Math.atan2(m.y-this.arcs_circle.center.y,m.x-this.arcs_circle.center.x);var K=Math.atan2(l.y-this.arcs_circle.center.y,l.x-this.arcs_circle.center.x);var k=false;if((M>Math.HALFPI&&K<Math.HALFPI)||(K>Math.HALFPI&&M<Math.HALFPI)){k=true}M=f(M,-Math.THREEQUARTERSPI);K=f(K,-Math.THREEQUARTERSPI);if((K>M)||(I&&(M>-Math.PI)&&(K<-Math.PI))){var u=M;M=K;K=u}if(I){I=false;if(!k){t=M-Math.TWOPI;x.push(K)}else{t=K;x.push(M)}}else{x.push(M);x.push(K)}}if(n){s.x+=J.max_used_word_radius*Math.cos(J.up_angle)/this.chars.length;s.y+=J.max_used_word_radius*Math.sin(J.up_angle)/this.chars.length}y+=L}if(t){x.push(t)}if(x.length>0){this.arcs=[];for(F=0;F<x.length-1;F+=2){this.addArc(x[F+1],x[F])}}else{this.arcs=[new e.Arc(this.arcs_circle.center.x,this.arcs_circle.center.y,this.arcs_circle.radius,0,Math.TWOPI)]}var H=this.arcs_circle;if(n){var A=this.radius;for(F in this.chars){J=this.chars[F];var r=s.x-J.up_vector.x*this.max_diameter;var q=s.y-J.up_vector.y*this.max_diameter;var D=new e.Line(s.x,s.y,r,q);var z=D.intersectPoints(this.circle);if(z.length>0){var B=z[0];var w=B.x-s.x;var v=B.y-s.y;var G=Math.sqrt(w*w+v*v)*0.94;G-=J.max_used_word_radius-this.arcs_circle.radius;A=Math.min(A,G)}}H=new e.Circle(s.x,s.y,A)}return H};e.Word.prototype.shareCharModLines=function(){var l=0;var j=0;var k=null;for(l in this.chars){var m=this.chars[l];if(m.mod_lines&&m.mod_lines.length<=0){continue}if(k){m.shareModifierLine(k.mod_lines);k=null;continue}k=m}};e.Word.prototype.addArc=function(i,j){this.arcs.push(new e.Arc(this.arcs_circle.center.x,this.arcs_circle.center.y,this.arcs_circle.radius,i,j))};e.Word.prototype.mouseOverObjects=function(l,j){var q=[];for(var p in this.arcs){var o=this.arcs[p];if(o.isMouseOver(l,j)){q.push(o)}}for(var p in this.chars){var n=this.chars[p].mouseOverObjects(l,j);if(n.length>0){for(var m in n){q.push(n[m])}}}return q};e.Word.prototype.setLineColor=function(k){for(var j in this.arcs){this.arcs[j].line_color=k}for(var j in this.chars){this.chars[j].setLineColor(k)}};e.Char=function(n,k,j,m,l,o,i){this.draw_objects=[];this.max_circle=null;this.owner_intersect_object=null;this.x=typeof k!=="undefined"?k:this.radius;this.y=typeof j!=="undefined"?j:this.radius;this.up_angle=-Math.HALFPI;this.up_vector=typeof l!=="undefined"?l:new e.Point(0,-1);this.word_circle=typeof o!=="undefined"?o:new e.Circle(0,0,1);this.sentence_circle=typeof i!=="undefined"?i:this.word_circle;this.word_intersect_points=[];this.main="";this.main_count=0;this.secondary="";this.secondary_count=0;this.text="";this.getFirstChar(n);this.max_used_word_radius=this.word_circle.radius+this.radius;this.setMaxDiameter(m);this.dots=[];this.main_mod=null;this.secondary_mod=null;this.mod_lines=[];this.mod_line_secondary=null};e.Char.prototype.setX=function(i){this.x=typeof i!=="undefined"?i:this.radius;this.loadObjects()};e.Char.prototype.setY=function(i){this.y=typeof i!=="undefined"?i:this.radius;this.loadObjects()};e.Char.prototype.setMaxDiameter=function(i){this.max_diameter=typeof i!=="undefined"?i:50;this.radius=this.max_diameter/2;this.consonant_radius=this.radius*0.45;this.vowel_radius=this.consonant_radius*0.3;if(!this.max_circle){this.max_circle=new e.Circle()}this.max_circle.center.x=this.x;this.max_circle.center.y=this.y;this.max_circle.radius=this.max_diameter/2;this.max_circle.line_color=e.guideline_color;this.max_circle.line_width=1;this.loadObjects()};e.Char.prototype.draw=function(j){var k=null;for(k in this.draw_objects){this.draw_objects[k].draw(j)}if(e.draw_guidelines&&this.max_circle){this.max_circle.draw(j)}};e.Char.prototype.loadObjects=function(){this.draw_objects=[];if(!this.main||this.main.length<=0||this.main_count<=0){return}if(/^([bdfgh]|ch)$/i.test(this.main)){var i=null;if(this.main=="ch"){i="2dots"}else{if(this.main=="d"){i="3dots"}else{if(this.main=="f"){i="3lines"}else{if(this.main=="g"){i="1line"}else{if(this.main=="h"){i="2lines"}}}}}this.loadB(i)}else{if(/^[jklmnp]$/i.test(this.main)){var i=null;if(this.main=="k"){i="2dots"}else{if(this.main=="l"){i="3dots"}else{if(this.main=="m"){i="3lines"}else{if(this.main=="n"){i="1line"}else{if(this.main=="p"){i="2lines"}}}}}this.loadJ(i)}else{if(/^([trsvw]|sh)$/i.test(this.main)){var i=null;if(this.main=="sh"){i="2dots"}else{if(this.main=="r"){i="3dots"}else{if(this.main=="s"){i="3lines"}else{if(this.main=="v"){i="1line"}else{if(this.main=="w"){i="2lines"}}}}}this.loadT(i)}else{if(/^([yzx]|th|ng|qu)$/i.test(this.main)){var i=null;if(this.main=="y"){i="2dots"}else{if(this.main=="z"){i="3dots"}else{if(this.main=="ng"){i="3lines"}else{if(this.main=="qu"){i="1line"}else{if(this.main=="x"){i="2lines"}}}}}this.loadTH(i)}else{if(/^a$/i.test(this.main)){this.loadA(this.word_circle)}else{if(/^e$/i.test(this.main)){this.loadE(this.word_circle)}else{if(/^i$/i.test(this.main)){this.loadI(this.word_circle)}else{if(/^o$/i.test(this.main)){this.loadO(this.word_circle)}else{if(/^u$/i.test(this.main)){this.loadU(this.word_circle)}else{this.loadOther()}}}}}}}}}};e.Char.prototype.loadModifier=function(m,k,p,l){var j=1;var w=this.consonant_radius*0.07;var o=this.consonant_radius*0.1;var q=k.radius/Math.PI;this.dots=[];this.mod_lines=[];switch(m){case"3dots":var i=(this.up_angle*q-o)/q;var s=new e.Point(k.center.x+Math.cos(i)*(k.radius-o*1.8),k.center.y+Math.sin(i)*(k.radius-o*1.8),w);this.dots.push(s);this.draw_objects.push(s);var v=new e.Point(k.center.x+this.up_vector.x*(k.radius-o*1.8),k.center.y+this.up_vector.y*(k.radius-o*1.8),o);this.dots.push(v);this.draw_objects.push(v);var n=(this.up_angle*q+o)/q;var t=new e.Point(k.center.x+Math.cos(n)*(k.radius-o*1.8),k.center.y+Math.sin(n)*(k.radius-o*1.8),w);this.dots.push(t);this.draw_objects.push(t);break;case"2dots":var u=(this.up_angle*q-w/1.8)/q;var v=new e.Point(k.center.x+Math.cos(u)*(k.radius-o*1.5),k.center.y+Math.sin(u)*(k.radius-o*1.5),w);this.draw_objects.push(v);var n=(this.up_angle*q+w/1.8)/q;var t=new e.Point(k.center.x+Math.cos(n)*(k.radius-o*1.5),k.center.y+Math.sin(n)*(k.radius-o*1.5),w);this.draw_objects.push(t);break;case"2lines":var r=a(2,p,l);this.loadModifierLine(k,r[0]);this.loadModifierLine(k,r[1]);break;case"3lines":var r=a(3,p,l);this.loadModifierLine(k,r[0]);this.loadModifierLine(k,r[1]);this.loadModifierLine(k,r[2]);break;case"1line":var r=a(1,p,l);this.loadModifierLine(k,r[0]);break}};e.Char.prototype.loadModifierLine=function(m,n,j){if(typeof(j)==="undefined"){j=false}var i=new e.Line(m.center.x+Math.cos(n)*(m.radius+m.line_width/2),m.center.y+Math.sin(n)*(m.radius+m.line_width/2),m.center.x+Math.cos(n)*this.sentence_circle.radius*2,m.center.y+Math.sin(n)*this.sentence_circle.radius*2);var k=i.intersectPoints(this.sentence_circle);if(k.length>0){i.end=k[0]}i.holder_circle=m;if(j){this.mod_line_secondary=i}else{this.mod_lines.push(i)}this.draw_objects.push(i)};e.Char.prototype.shareModifierLine=function(t){if(this.mod_lines&&this.mod_lines.length<=0){return}var n=0;var p=0;var o=this.mod_lines.length-1;for(p in t){var k=t[p];if(!k||(o<0)){continue}this_line=this.mod_lines[o];var l=new e.Line(this_line.holder_circle.center.x,this_line.holder_circle.center.y,k.holder_circle.center.x,k.holder_circle.center.y);var s=Math.min(this_line.holder_circle.radius,k.holder_circle.radius)*0.7;var m=(o/(this.mod_lines.length-1))*s-(s/2);l.perpendicularMove(m);var r=l.intersectPoints(this_line.holder_circle);if(r.length<=0){return}var q=l.intersectPoints(k.holder_circle);if(q.length<=0){return}this_line.begin.x=r[0].x;this_line.begin.y=r[0].y;this_line.end.x=q[0].x;this_line.end.y=q[0].y;k.visible=false;--o}};e.Char.prototype.loadArc=function(l,j,k){var p=0;var n=Math.TWOPI;var o=k?false:true;var i=j.intersectPoints(this.word_circle);if(i.length==2){var m=Math.atan2(i[0].y-j.center.y,i[0].x-j.center.x);var s=Math.atan2(i[1].y-j.center.y,i[1].x-j.center.x);p=m;n=s;if(o){this.word_intersect_points=[i[0],i[1]]}}else{if(o){this.word_intersect_points=[]}}var r=new e.Arc();r.circle=j;r.begin_angle=p;r.end_angle=n;this.draw_objects.push(r);while(n<p){n+=Math.TWOPI}var q=Math.min(Math.PI/4,(n-p)/2.5);this.loadModifier(l,j,this.up_angle-q,this.up_angle+q)};e.Char.prototype.loadB=function(j){var n=this.consonant_radius*0.9;var o=new e.Circle(this.x+n*this.up_vector.x,this.y+n*this.up_vector.y,this.consonant_radius);this.owner_intersect_object=o;this.loadArc(j,o);this.max_used_word_radius=this.word_circle.radius;if(this.main_count>1){var m=o.radius;for(var l=1;l<this.main_count;++l){m+=o.line_width*2;var k=new e.Circle(o.center.x,o.center.y,m);this.loadArc(null,k,true)}}this.loadSecondaryVowel(o,true)};e.Char.prototype.loadJ=function(j){var o=this.radius*0.55;var p=new e.Circle(this.x+o*this.up_vector.x,this.y+o*this.up_vector.y,this.consonant_radius);this.owner_intersect_object=p;this.draw_objects.push(p);var n=Math.PI/4;this.loadModifier(j,p,this.up_angle-n,this.up_angle+n);this.max_used_word_radius=this.word_circle.radius;if(this.main_count>1){var m=p.radius;for(var l=1;l<this.main_count;++l){m+=p.line_width*2;var k=new e.Circle(p.center.x,p.center.y,m);this.draw_objects.push(k)}}this.loadSecondaryVowel(p)};e.Char.prototype.loadT=function(j){var n=-this.consonant_radius*2.3;var o=new e.Circle(this.x+n*this.up_vector.x,this.y+n*this.up_vector.y,this.consonant_radius*3.2);this.loadArc(j,o);this.max_used_word_radius=this.word_circle.radius;if(this.main_count>1){var m=o.radius;for(var l=1;l<this.main_count;++l){m+=o.line_width*2;var k=new e.Circle(o.center.x,o.center.y,m);this.loadArc(null,k,true)}}this.loadSecondaryVowel(o)};e.Char.prototype.loadTH=function(i){var k=new e.Circle(this.x,this.y,this.consonant_radius);this.draw_objects.push(k);var j=Math.PI/3;this.loadModifier(i,k,this.up_angle-j,this.up_angle+j);this.max_used_word_radius=this.word_circle.radius+this.consonant_radius;this.loadSecondaryVowel(k)};e.Char.prototype.repeatVowel=function(k,j){function i(q,n,p){if(n>1){var o=q.radius;for(var m=1;m<n;++m){o-=q.line_width*2;if(o>0){var l=new e.Circle(q.center.x,q.center.y,o);p.push(l)}}}}if(j){i(k,this.secondary_count,this.draw_objects)}else{i(k,this.main_count,this.draw_objects)}};e.Char.prototype.loadA=function(k,j){j=typeof j==="boolean"?j:false;var i=1.6;var l=new e.Circle(this.x-this.up_vector.x*this.vowel_radius*i,this.y-this.up_vector.y*this.vowel_radius*i,this.vowel_radius);if(!(j&&/^([yzx]|th|ng|qu)$/i.test(this.main))){this.max_used_word_radius=this.word_circle.radius+this.vowel_radius*i}this.draw_objects.push(l);this.repeatVowel(l,j);return l};e.Char.prototype.loadE=function(l,k){k=typeof k==="boolean"?k:false;var j=this.x;var i=this.y;if(k){if(/^([trsvw]|sh)$/i.test(this.main)){j=this.x+this.up_vector.x*this.vowel_radius;i=this.y+this.up_vector.y*this.vowel_radius}else{j=l.center.x;i=l.center.y}}var m=new e.Circle(j,i,this.vowel_radius);if(!k){this.max_used_word_radius=this.word_circle.radius+this.vowel_radius}this.draw_objects.push(m);this.repeatVowel(m,k);return m};e.Char.prototype.loadI=function(k,i){i=typeof i==="boolean"?i:false;var m=this.loadE(k,i);this.dots=[];this.mod_lines=[];var j=Math.PI/12;var l=a(1,this.up_angle-j,this.up_angle+j);this.loadModifierLine(m,l[0],true)};e.Char.prototype.loadO=function(m,l){l=typeof l==="boolean"?l:false;var j=1.5;var k=0;var i=0;if(l){k=m.center.x+this.up_vector.x*m.radius;i=m.center.y+this.up_vector.y*m.radius}else{k=this.x+this.up_vector.x*this.vowel_radius*j;i=this.y+this.up_vector.y*this.vowel_radius*j}var n=new e.Circle(k,i,this.vowel_radius);if(!(l&&/^([yzx]|th|ng|qu)$/i.test(this.main))){this.max_used_word_radius=this.word_circle.radius}this.draw_objects.push(n);this.repeatVowel(n,l);return n};e.Char.prototype.loadU=function(k,i){var m=this.loadE(k,i);this.dots=[];this.mod_lines=[];var j=Math.PI/12;var l=a(1,this.up_angle+Math.PI-j,this.up_angle+Math.PI+j);this.loadModifierLine(m,l[0],true)};e.Char.prototype.loadSecondaryVowel=function(i){if(/^a$/i.test(this.secondary)){this.loadA(this.word_circle,true)}else{if(/^e$/i.test(this.secondary)){this.loadE(i,true)}else{if(/^i$/i.test(this.secondary)){this.loadI(i,true)}else{if(/^o$/i.test(this.secondary)){this.loadO(i,true)}else{if(/^u$/i.test(this.secondary)){this.loadU(i,true)}}}}}};e.Char.prototype.loadOther=function(){var i=new e.Point(this.x,this.y);i.line_color="#ff0000";i.line_width=8;this.draw_objects.push(i)};e.Char.prototype.getFirstChar=function(l){this.main="";this.main_count=0;this.secondary="";this.secondary_count=0;if(l==null||l.length<=0){return}var o=/^[aeiou]/i;var i=/^[bcdfghjklmnprstvwxyz]/i;var n=/^(th|ch|sh|ng|qu)/i;var m=l[0];if(o.test(m)){this.main=m;this.main_count=this.countCharRepeat(l)}else{var k=l.substr(0,2);if(n.test(k)){this.main=k;this.main_count=1}else{this.main=m;this.main_count=this.countCharRepeat(l)}var j=this.main.length*this.main_count;if(l.length>j){m=l[j];if(o.test(m)){this.secondary=m;this.secondary_count=this.countCharRepeat(l,j)}}}};e.Char.prototype.countCharRepeat=function(m,j){j=typeof j!=="undefined"?j:0;var k=0;var l=0;var n=null;if(j>=m.length){return 0}for(k=j;k<m.length;k++){if(k==j){n=m[k];l=1}else{if(n==m[k]){l+=1}else{break}}}return l};e.Char.prototype.mouseOverObjects=function(k,j){var m=[];for(var l in this.draw_objects){var n=this.draw_objects[l];if(n.isMouseOver(k,j)){m.push(n)}}for(var l in this.mod_lines){var n=this.mod_lines[l];if(n.isMouseOver(k,j)){m.push(n)}}if(this.mod_line_secondary){if(this.mod_line_secondary.isMouseOver(k,j)){m.push(this.mod_line_secondary)}}return m};e.Char.prototype.setLineColor=function(k){for(var j in this.draw_objects){this.draw_objects[j].line_color=k}for(var j in this.mod_lines){this.mod_lines[j].line_color=k}if(this.mod_line_secondary){this.mod_line_secondary.line_color=k}};function b(w,j){default_result=[];var q=new e.Point();var o=new e.Point();var m=0;var k=0;var i=0;var n=j.center.y*j.center.y;var u=j.center.x*j.center.x;var l=j.radius*j.radius;if(Math.abs(w.begin.x-w.end.x)<0.000001){var s=w.begin.x;m=1;k=-2*j.center.y;i=s*s-2*s*j.center.x+u+n-l;var t=g(m,k,i);if(t.length!=2){return default_result}q.x=s;q.y=t[0];o.x=s;o.y=t[1]}else{var r=(w.end.y-w.begin.y)/(w.end.x-w.begin.x);var p=w.begin.y-(r*w.begin.x);m=r*r+1;k=2*(r*p-r*j.center.y-j.center.x);i=(u+n-l-(2*p*j.center.y)+p*p);var v=g(m,k,i);if(v.length!=2){return default_result}q.x=v[0];q.y=r*q.x+p;o.x=v[1];o.y=r*o.x+p}return[q,o]}function d(l,k){default_result=[];if(!l||!k){return default_result}var r=l.center.x-k.center.x;var p=l.center.y-k.center.y;var t=Math.sqrt(r*r+p*p);if((t<0.000001)||(t>(l.radius+k.radius))||(t<Math.abs(l.radius-k.radius))){return default_result}var x=l.radius*l.radius;var o=k.radius*k.radius;var v=(x-o+t*t)/(t+t);var m=Math.sqrt(x-v*v);var w=new e.Point();var q=new e.Point();var n=new e.Point();var u=v/t;var j=k.center.x-l.center.x;var s=k.center.y-l.center.y;w.x=l.center.x+(u*j);w.y=l.center.y+(u*s);var i=m/t;q.x=w.x+(i*s);n.x=w.x-(i*s);q.y=w.y-(i*j);n.y=w.y+(i*j);return[q,n]}function g(i,l,j){if(i!=0){var k=l*l-4*i*j;if(k<0){return[]}sqrt_delta=Math.sqrt(k);r1=(-l+sqrt_delta)/(2*i);r2=(-l-sqrt_delta)/(2*i);return[r1,r2]}else{if(l!=0){return[-j/l]}}return[]}function f(j,i){while(j<i){j+=Math.TWOPI}end_angle=i+Math.TWOPI;while(j>end_angle){j-=Math.TWOPI}return j}function c(l,n,k,m){var j=k-l;var i=m-n;return Math.sqrt(j*j+i*i)}function a(q,n,k){var s=[];if(typeof(q)==="undefined"||q<=0){return s}var n=typeof(n)==="undefined"?0:n;var k=typeof(k)==="undefined"?Math.TWOPI:k;if(n>k){n-=Math.TWOPI}var o=k-n;var m=0;var l=q*3;var r=[];var j=o/(l-1);for(m=n;m<=k;m+=j){r.push(m)}for(m=0;m<q;++m){var p=Math.floor(Math.random()*r.length);s.push(r[p]);r.splice(p,1)}return s}e.drawTest=function(i){var j=new e.Sentence("bthtj",20,20,460);j.draw(i)}}(window.gallifreyan=window.gallifreyan||{}));/*************************** BASE DRAWING OBJECT *****************************/
window.gallifreyan.Graphic = function(targetCanvas) {
    this.name = "Graphic";
    this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
    //this.line_color = "#ffffff";
    this.line_color = "#f0cc05";
    //this.line_color = "#87b8e7";
    this.line_width = 2;
    this.visible = true;
}
window.gallifreyan.Graphic.prototype._draw = function(ctx) {
    // Intended to be inherited/overwritten
    ctx.strokeStyle = this.line_color;
    ctx.lineWidth = this.line_width;
    ctx.lineCap = "round";
}
window.gallifreyan.Graphic.prototype.draw = function(canvas) {
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
/***************************** INTERSECTIONS *********************************/
window.gallifreyan.util.isect_line_circle = function(line, circle) {
    default_result = [];

    // Line: y = ax + b
    // Circle: (x − p)^2 + (y − q)^2 = r^2
    // p = circle.center.x
    // q = circle.center.y
    // r = circle.radius

    var point1 = new window.gallifreyan.Point();
    var point2 = new window.gallifreyan.Point();
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

        var y_points = window.gallifreyan.util.bhaskara(A, B, C);
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

        var x_points = window.gallifreyan.util.bhaskara(A, B, C);
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

window.gallifreyan.util.isect_circle_circle = function(circle1, circle2) {
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

    var p2 = new window.gallifreyan.Point();
    var p3_a = new window.gallifreyan.Point();
    var p3_b = new window.gallifreyan.Point();

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
/******************************** LINE ***************************************/
window.gallifreyan.Line = function(ax, ay, bx, by) {
    this.name = "Line";
    this.begin = new window.gallifreyan.Point(ax, ay);
    this.end = new window.gallifreyan.Point(bx, by);
}
window.gallifreyan.Line.prototype = new gallifreyan.Graphic();
window.gallifreyan.Line.prototype._pre_draw = window.gallifreyan.Line.prototype._draw;
window.gallifreyan.Line.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.moveTo(this.begin.x, this.begin.y);
    ctx.lineTo(this.end.x, this.end.y);
}
window.gallifreyan.Line.prototype.boxContains = function(point) {
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
window.gallifreyan.Line.prototype.intersectPoints = function(target) {
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
        var isects = window.gallifreyan.util.isect_line_circle(this, target);
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
window.gallifreyan.Line.prototype.perpendicularMove = function(delta) {
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
window.gallifreyan.Line.prototype.isMouseOver = function(mouse_x, mouse_y) {
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
        var pa = 0;
        var pb = 0;
        var intersect_x = 0;
        var intersect_y = 0;
        if (a > .001) {
            pa = Math.tan(Math.atan(a) + Math.HALFPI);
            pb = mouse_y - (pa * mouse_x);
            intersect_x = (pb - b) / (a - pa); // (a - pa) is never 0
            intersect_y = a * intersect_x + b;
        } else {
            pa = a;
            pb = mouse_x - (pa * mouse_y);
            intersect_x = (pa*b + pb) / (1 - a*pa);
            intersect_y = a*intersect_x + b;
        }
        return (window.gallifreyan.util.points_distance(mouse_x, mouse_y, intersect_x, intersect_y) <= threshold);
    } else {
        // Main line parameters
        var a = dx / dy;
        var b = this.begin.x - a * this.begin.y;
        
        // Mouse perpendicular line parameters
        var pa = 0;
        var pb = 0;
        var intersect_x = 0;
        var intersect_y = 0;
        if (a > .001) {
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
        return (window.gallifreyan.util.points_distance(mouse_x, mouse_y, intersect_x, intersect_y) <= threshold);
    }
    return false;
}
/******************************* POINT ***************************************/
window.gallifreyan.Point = function(x, y, size) {
    this.name = "Point";
    this.x = typeof x !== 'undefined' ? x : 0;
    this.y = typeof y !== 'undefined' ? y : 0;
    if (typeof size === 'number') {
        this.line_width = size;
    }
}
window.gallifreyan.Point.prototype = new gallifreyan.Graphic();
window.gallifreyan.Point.prototype._pre_draw = window.gallifreyan.Point.prototype._draw;
window.gallifreyan.Point.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    // Actually draw a circle with almost-zero radius
    var radius = this.line_width / 2.01;
    ctx.arc(this.x, this.y, radius, 0, Math.TWOPI);
}
window.gallifreyan.Point.prototype.moveXY = function(delta_x, delta_y) {
    this.x += delta_x;
    this.y += delta_y;
    return this;
}
window.gallifreyan.Point.prototype.move = function(angle, length) {
    this.moveXY(Math.cos(angle) * length,
                Math.sin(angle) * length);
    return this;
}
window.gallifreyan.Point.prototype.isMouseOver = function(mouse_x, mouse_y) {
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
}
/******************************* SENTENCE ************************************/
window.gallifreyan.Sentence = function(text, left, top, size) {
    this.text = typeof text !== 'undefined' ? text : '';
    this.size = typeof size !== 'undefined' ? size : 300;
    this.left = typeof left !== 'undefined' ? left : 0;
    this.top = typeof top !== 'undefined' ? top : 0;
    this.center_x = this.left + this.size/2;
    this.center_y = this.top + this.size/2;
    this.outside_circle = new window.gallifreyan.Circle(this.center_x, this.center_y, this.size/2);
    this.outside_circle.line_width *= 1.4;
    this.inside_circle = new window.gallifreyan.Circle(this.center_x, this.center_y, this.size/2-6);
    this.words = [];
    this.setText(text);
}
window.gallifreyan.Sentence.prototype.draw = function(canvas) {
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
    var arc = null;
    var word = null;
    this.outside_circle.draw(canvas);
    this.inside_circle.draw(canvas);
    for (i in this.words) {
        this.words[i].draw(canvas);
    }
}
window.gallifreyan.Sentence.prototype.setText = function(text) {
    var i = null;
    var w = null;
    var w_object = null;
    this.words = [];
    this.text = this.preprocessText(text.trim());

    var usable_radius = this.inside_circle.radius * .95; // MAGIC NUMBER!
    var word_list = this.text.split(' ');
    if (word_list && word_list.length == 1) {
        w_object = new window.gallifreyan.Word(word_list[0], this.center_x, this.center_y, usable_radius * 2, this.inside_circle);
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

            w_object = new window.gallifreyan.Word(w, word_x, word_y, word_radius * 2, this.inside_circle);
            this.words.push(w_object);

            current_angle += angle_increment;
        }
    }
}
window.gallifreyan.Sentence.prototype.preprocessText = function(text) {
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
                var next = text[i+1];
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
                var next = text[i+1];
                if (next == 'u') {
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
}
window.gallifreyan.Sentence.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
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
window.gallifreyan.Sentence.prototype.setLineColor = function(new_color) {
    this.inside_circle.line_color = new_color;
    this.outside_circle.line_color = new_color;
    for (var i in this.words) {
        this.words[i].setLineColor(new_color);
    }
}
// Organize everything in the object 'gallifreyan'
window.gallifreyan = window.gallifreyan || {};

Math.TWOPI = 2 * Math.PI;
Math.HALFPI = Math.PI / 2;
Math.THREEQUARTERSPI = Math.PI + Math.HALFPI

window.gallifreyan.draw_guidelines = false;
window.gallifreyan.guideline_color = "#000000";
/********************************** UTIL *************************************/
window.gallifreyan.util = {};
window.gallifreyan.util.bhaskara = function(A, B, C) {
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
window.gallifreyan.util.normalize_angle = function(angle, start_angle) {
    // Converts any "angle" to the range ["start_angle" ~ "start_angle" + 360 degrees]
    while (angle < start_angle) {
        angle += Math.TWOPI;
    }
    end_angle = start_angle + Math.TWOPI;
    while (angle > end_angle) {
        angle -= Math.TWOPI;
    }
    return angle;
}
window.gallifreyan.util.points_distance = function(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy);
}
// Kind of randomize the angles in certain intervals
window.gallifreyan.util.randomize_angles = function(count, min_angle, max_angle) {
    var angles = [];
    if (typeof(count) === "undefined" || count <= 0) {
        return angles;
    }
    var min_angle = typeof(min_angle) === "undefined" ? 0 : min_angle;
    var max_angle = typeof(max_angle) === "undefined" ? Math.TWOPI : max_angle;
    if (min_angle > max_angle) {
        min_angle -= Math.TWOPI;
    }
    var range = max_angle - min_angle;
    var i = 0;
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
}
/*********************************** WORD ************************************/
window.gallifreyan.Word = function(text, center_x, center_y, max_diameter, sentence_circle) {
    this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 250;
    this.radius = this.max_diameter / 2;
    this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
    this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
    this.circle = new window.gallifreyan.Circle(this.x, this.y, this.radius);
    this.circle.line_color = window.gallifreyan.guideline_color;
    this.circle.line_width = 1;
    this.sentence_circle = typeof sentence_circle !== 'undefined' ? sentence_circle : this.circle;
    this.arcs_circle = new window.gallifreyan.Circle(this.x, this.y, this.radius);
    this.arcs_circle.line_color = window.gallifreyan.guideline_color;
    this.arcs_circle.line_width = 1;
    this.arcs = [new window.gallifreyan.Arc(this.x, this.y, this.radius, 0, Math.TWOPI)];
    this.text = "";
    this.chars = [];
    this.setText(text);
}
window.gallifreyan.Word.prototype.draw = function(canvas) {
    var i = null;
    var arc = null;
    for (i in this.arcs) {
        arc = this.arcs[i];
        arc.draw(canvas);
    }
    for (i in this.chars) {
        this.chars[i].draw(canvas);
    }
    if (window.gallifreyan.draw_guidelines) {
        this.circle.draw(canvas);
        this.arcs_circle.draw(canvas);
    }
}
window.gallifreyan.Word.prototype.setText = function(text) {
    this.text = text = text.trim().split(' ')[0];
    this.chars = [];
    var last_len = 0;
    var c = null;
    while ((text.length > 0) && (last_len != text.length)) {
        c = new window.gallifreyan.Char(text);
        this.chars.push(c);
        last_len = text.length;
        text = text.substr(c.main.length*c.main_count + c.secondary.length*c.secondary_count);
    }
    this.setDimensions();
}
window.gallifreyan.Word.prototype.setDimensions = function() {
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
        //this.shareCharModLines();
    }
}
window.gallifreyan.Word.prototype.positionChars = function(char_max_diameter, resize_word_circle) {
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
    var new_center = new window.gallifreyan.Point(this.arcs_circle.center.x, this.arcs_circle.center.y);
    for (i in this.chars) {
        var c = this.chars[i];
        c.sentence_circle = this.sentence_circle;
        c.up_angle = current_angle + Math.PI;
        c.up_vector = new window.gallifreyan.Point(Math.cos(c.up_angle), Math.sin(c.up_angle));
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

            a1 = window.gallifreyan.util.normalize_angle(a1, -Math.THREEQUARTERSPI);
            a2 = window.gallifreyan.util.normalize_angle(a2, -Math.THREEQUARTERSPI);

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
        this.arcs = [ new window.gallifreyan.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, 0, Math.TWOPI) ];
    }
    var new_size_circle = this.arcs_circle;
    if (resize_word_circle) {
        var new_radius = this.radius; // Just a starting value for the algorithm
        for (i in this.chars) {
            c = this.chars[i];
            var target_x = new_center.x - c.up_vector.x * this.max_diameter;
            var target_y = new_center.y - c.up_vector.y * this.max_diameter;
            var helper_line = new window.gallifreyan.Line(new_center.x, new_center.y, target_x, target_y);
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
        new_size_circle = new window.gallifreyan.Circle(new_center.x, new_center.y, new_radius);
    }
    return new_size_circle;
}
window.gallifreyan.Word.prototype.shareCharModLines = function() {
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
window.gallifreyan.Word.prototype.addArc = function(begin_angle, end_angle) {
    this.arcs.push(new window.gallifreyan.Arc(this.arcs_circle.center.x, this.arcs_circle.center.y, this.arcs_circle.radius, begin_angle, end_angle));
}
window.gallifreyan.Word.prototype.mouseOverObjects = function(mouse_x, mouse_y) {
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
window.gallifreyan.Word.prototype.setLineColor = function(new_color) {
    for (var i in this.arcs) {
        this.arcs[i].line_color = new_color;
    }
    for (var i in this.chars) {
        this.chars[i].setLineColor(new_color);
    }
}
