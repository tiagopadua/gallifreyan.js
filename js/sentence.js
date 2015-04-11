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
