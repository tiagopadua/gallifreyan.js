
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
