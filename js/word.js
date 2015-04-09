/*********************************** WORD ************************************/
    SELF.Word = function(text, center_x, center_y, max_diameter, sentence_circle) {
        this.max_diameter = typeof max_diameter !== 'undefined' ? max_diameter : 250;
        this.radius = this.max_diameter / 2;
        this.x = typeof center_x !== 'undefined' ? center_x : this.radius;
        this.y = typeof center_y !== 'undefined' ? center_y : this.radius;
        this.circle = new SELF.Circle(this.x, this.y, this.radius);
        this.circle.line_color = SELF.guideline_color;
        this.circle.line_width = 1;
        this.sentence_circle = typeof sentence_circle !== 'undefined' ? sentence_circle : this.circle;
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
            //this.shareCharModLines();
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
            c.sentence_circle = this.sentence_circle;
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
