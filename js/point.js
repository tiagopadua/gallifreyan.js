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
