Math.TWOPI = 2 * Math.PI;

/*************************** BASE DRAWING OBJECT *****************************/
function Graphic(targetCanvas) {
    this.name = "Graphic";
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
    this.name = "Point";
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
    this.name = "Line";
    this.begin = new Point(ax, ay);
    this.end = new Point(bx, by);
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
    this.name = "Circle";
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
    this.name = "Arc";
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
    default_result = [];

    if (typeof target === 'undefined') {
        return default_result;
    }

    // Discover the target type
    if (typeof target.name === 'undefined') {
        return default_result;
    }
    var name = target.name;

    if (name == 'Line') {
        // Line: y = ax + b
        // Circle: (x − p)^2 + (y − q)^2 = r^2
        // p = this.circle.center.x
        // q = this.circle.center.y
        // r = this.circle.radius
        var a = (target.end.y - target.begin.y) / (target.end.x - target.begin.x);
        var b = target.begin.y - (a * target.begin.x);
        var A = a*a + 1;
        console.log("y = " + a.toString() + "x + " + b.toString());
        var B = 2*(a*b - a*this.circle.center.y - this.circle.center.x);
        var q2 = this.circle.center.y * this.circle.center.y;
        var p2 = this.circle.center.x * this.circle.center.x;
        var r2 = this.circle.radius * this.circle.radius;
        var C = (p2 + q2 - r2 - (2*b*this.circle.center.y) + b*b);

        var delta = B*B - 4*A*C;
        if (delta < 0) {
            return default_result;
        }
        var point1 = new Point();
        var point2 = new Point();

        sqrt_delta = Math.sqrt(delta);
        point1.x = (-B + sqrt_delta) / (2*A);
        point1.y = a*point1.x + b;

        point2.x = (-B - sqrt_delta) / (2*A);
        point2.y = a*point2.x + b;

        return [ point1, point2 ];
    } else if (name == 'Arc') {
        // Intersection between circles
        var mid_x = this.circle.center.x - target.circle.center.x;
        var mid_y = this.circle.center.y - target.circle.center.y;
        var d = Math.sqrt(mid_x*mid_x + mid_y*mid_y);
        if ((d < 0.00001) || // consider 5 digits, just for approximation
            (d > (this.circle.radius + target.circle.radius)) ||
            (d < Math.abs(this.circle.radius - target.circle.radius))) {
            return default_result;
        }

        var r02 = this.circle.radius * this.circle.radius;
        var r12 = target.circle.radius * target.circle.radius;
        var a = (r02 - r12 + d*d) / (d + d);
        var h = Math.sqrt(r02 - a*a);

        var p2 = new Point();
        var p3_a = new Point();
        var p3_b = new Point();

        var a_d = a / d;
        var x_diff = target.circle.center.x - this.circle.center.x;
        var y_diff = target.circle.center.y - this.circle.center.y;
        p2.x = this.circle.center.x + (a_d * x_diff);
        p2.y = this.circle.center.y + (a_d * y_diff);

        var h_d = h / d;
        p3_a.x = p2.x + (h_d * y_diff);
        p3_b.x = p2.x - (h_d * y_diff);
        p3_a.y = p2.y - (h_d * x_diff);
        p3_b.y = p2.y + (h_d * x_diff);

        return [ p3_a, p3_b ];
    }

    return default_result;
}
