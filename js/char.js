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
