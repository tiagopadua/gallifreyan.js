Math.TWOPI = 2 * Math.PI;

/*************************** BASE DRAWING OBJECT *****************************/
function Graphic(targetCanvas) {
    this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
    this.line_color = "#ffffff";
    this.line_thickness = 2;
}

Graphic.prototype._draw = function(ctx) {
    // Intended to be inherited/overwritten
    ctx.strokeStyle = this.line_color;
    ctx.lineWidth = this.line_thickness;
}

Graphic.prototype.draw = function() {
    context = this.canvas.getContext("2d");
    context.beginPath();
    this._draw(context);
    context.stroke();
}

/******************************* POINT ***************************************/
function Point(x, y) {
    this.x = typeof x !== 'undefined' ? x : 0;
    this.y = typeof y !== 'undefined' ? y : 0;
}

Point.prototype = new Graphic();
Point.prototype._pre_draw = Point.prototype._draw;
Point.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    // Actually draw a circle with almost-zero radius
    var radius = this.line_thickness / 2.1;
    ctx.arc(this.x, this.y, radius, 0, Math.TWOPI);
}

/******************************** LINE ***************************************/
function Line(ax, ay, bx, by) {
    this.begin = new Point();
    this.end = new Point();
    this.begin.x = typeof ax !== 'undefined' ? ax : 0;
    this.begin.y = typeof ay !== 'undefined' ? ay : 0;
    this.end.x = typeof bx !== 'undefined' ? bx : 0;
    this.end.y = typeof by !== 'undefined' ? by : 0;
}

Line.prototype = new Graphic();
Line.prototype._pre_draw = Line.prototype._draw;
Line.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.moveTo(this.begin.x, this.begin.y);
    ctx.lineTo(this.end.x, this.end.y);
}

/******************************* CIRCLE **************************************/
function Circle(x, y, r) {
    this.center = new Point(x, y);
    this.radius = typeof r !== 'undefined' ? r : 1;
}
Circle.prototype = new Graphic();
Circle.prototype._pre_draw = Circle.prototype._draw;
Circle.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.TWOPI);
}

/******************************** ARC ****************************************/
function Arc(x, y, r, begin, end) {
    this.circle = new Circle(x, y, r)
    this.begin_angle = typeof begin !== 'undefined' ? begin : 0;
    this.end_angle = typeof end !== 'undefined' ? end : Math.TWOPI;
}

Arc.prototype = new Graphic();
Arc.prototype._pre_draw = Arc.prototype._draw;
Arc.prototype._draw = function(ctx) {
    // Call the "parent" class's method
    this._pre_draw(ctx);
    ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.begin_angle, this.end_angle);
}
Arc.prototype.intersectPoints = function(target) {
    // Intersection between
    mid_x = this.circle.center.x - target.circle.center.x;
    mid_y = this.circle.center.y - target.circle.center.y;
    d = Math.sqrt(mid_x*mid_x + mid_y*mid_y);
    if ((d < 0.00001) || // consider 5 digits, just for approximation
        (d > (this.circle.radius + target.circle.radius)) ||
        (d < Math.abs(this.circle.radius - target.circle.radius))) {
        return [];
    }

    r02 = this.circle.radius * this.circle.radius;
    r12 = target.circle.radius * target.circle.radius;
    a = (r02 - r12 + d*d) / (d + d);
    h = Math.sqrt(r02 - a*a);

    p2 = new Point();
    p3_a = new Point();
    p3_b = new Point();

    a_d = a / d;
    x_diff = target.circle.center.x - this.circle.center.x;
    y_diff = target.circle.center.y - this.circle.center.y;
    p2.x = this.circle.center.x + (a_d * x_diff);
    p2.y = this.circle.center.y + (a_d * y_diff);

    h_d = h / d;
    p3_a.x = p2.x + (h_d * y_diff);
    p3_b.x = p2.x - (h_d * y_diff);
    p3_a.y = p2.y - (h_d * x_diff);
    p3_b.y = p2.y + (h_d * x_diff);

    return [ p3_a, p3_b ];
}
