
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
