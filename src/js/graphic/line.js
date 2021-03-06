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
