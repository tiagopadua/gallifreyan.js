
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
