Math.TWOPI = 2 * Math.PI;

(function($, undefined) {

/*************************** BASE DRAWING OBJECT *****************************/
    $.Graphic = function(targetCanvas) {
        this.name = "Graphic";
        this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
        this.line_color = "#ffffff";
        this.line_thickness = 2;
    }
    $.Graphic.prototype._draw = function(ctx) {
        // Intended to be inherited/overwritten
        ctx.strokeStyle = this.line_color;
        ctx.lineWidth = this.line_thickness;
    }
    $.Graphic.prototype.draw = function() {
        context = this.canvas.getContext("2d");
        context.beginPath();
        this._draw(context);
        context.stroke();
    }

/******************************* POINT ***************************************/
    $.Point = function(x, y) {
        this.name = "Point";
        this.x = typeof x !== 'undefined' ? x : 0;
        this.y = typeof y !== 'undefined' ? y : 0;
    }
    $.Point.prototype = new gallifreyan.Graphic();
    $.Point.prototype._pre_draw = $.Point.prototype._draw;
    $.Point.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        // Actually draw a circle with almost-zero radius
        var radius = this.line_thickness / 2.1;
        ctx.arc(this.x, this.y, radius, 0, Math.TWOPI);
    }

/******************************** LINE ***************************************/
    $.Line = function(ax, ay, bx, by) {
        this.name = "Line";
        this.begin = new $.Point(ax, ay);
        this.end = new $.Point(bx, by);
    }
    $.Line.prototype = new gallifreyan.Graphic();
    $.Line.prototype._pre_draw = $.Line.prototype._draw;
    $.Line.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.moveTo(this.begin.x, this.begin.y);
        ctx.lineTo(this.end.x, this.end.y);
    }
    $.Line.prototype.boxContains = function(point) {
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
    }

/******************************* CIRCLE **************************************/
    $.Circle = function(x, y, r) {
        this.name = "Circle";
        this.center = new $.Point(x, y);
        this.radius = typeof r !== 'undefined' ? r : 1;
    }
    $.Circle.prototype = new gallifreyan.Graphic();
    $.Circle.prototype._pre_draw = $.Circle.prototype._draw;
    $.Circle.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.TWOPI);
    }

/******************************** ARC ****************************************/
    $.Arc = function(x, y, r, begin, end) {
        this.name = "Arc";
        this.circle = new $.Circle(x, y, r)
        this.begin_angle = typeof begin !== 'undefined' ? begin : 0;
        this.end_angle = typeof end !== 'undefined' ? end : Math.TWOPI;
    }
    $.Arc.prototype = new gallifreyan.Graphic();
    $.Arc.prototype._pre_draw = $.Arc.prototype._draw;
    $.Arc.prototype._draw = function(ctx) {
        // Call the "parent" class's method
        this._pre_draw(ctx);
        ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.begin_angle, this.end_angle);
    }
    $.Arc.prototype.intersectPoints = function(target) {
        var i = null;
        var point = null;
        var default_result = [];

        // Discover the target type
        if (typeof target === 'undefined') {
            return default_result;
        }
        if (typeof target.name === 'undefined') {
            return default_result;
        }

        if (target.name == 'Line') {
            isect_points = isect_line_circle(target, this.circle);
            result = [];
            for (i in isect_points) {
                point = isect_points[i];
                if (this.containsPoint(point) && target.boxContains(point)) {
                    result.push(point);
                }
            }
            return result;
        } else if (target.name == 'Circle') {
            return isect_circle_circle(this.circle, target);
        } else if (target.name == 'Arc') {
            isect_points = isect_circle_circle(this.circle, target.circle);
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
    }
    $.Arc.prototype.containsPoint = function(point) {
        if (typeof point === 'undefined') {
            return false;
        }
        angle = Math.atan2(point.y - this.circle.center.y, point.x - this.circle.center.x);
        if ((angle >= this.begin_angle) && (angle <= this.end_angle)) {
            return true;
        }
        return false;
    }

/********************************** UTIL *************************************/

    function bhaskara(A, B, C) {
        var delta = B*B - 4*A*C;
        if (delta < 0) {
            return [];
        }
        sqrt_delta = Math.sqrt(delta);
        r1 = (-B + sqrt_delta) / (2*A);
        r2 = (-B - sqrt_delta) / (2*A);
        return [ r1, r2 ];
    }

/***************************** INTERSECTIONS *********************************/

    function isect_line_circle(line, circle) {
        default_result = [];

        // Line: y = ax + b
        // Circle: (x − p)^2 + (y − q)^2 = r^2
        // p = circle.center.x
        // q = circle.center.y
        // r = circle.radius

        var point1 = new $.Point();
        var point2 = new $.Point();
        var A = 0;
        var B = 0;
        var C = 0;
        var q2 = circle.center.y * circle.center.y;
        var p2 = circle.center.x * circle.center.x;
        var r2 = circle.radius * circle.radius;

        // Check if it is (or almost is) a VERTICAL LINE
        if (Math.abs(line.begin.x - line.end.x) < 0.000001) { 
            // In vertical lines, the "a" parameter is infinite (or too big)
            // In this case, the usual algorithm does not work
            var x = line.begin.x;
            A = 1;
            B = -2 * circle.center.y;
            C = x*x - 2*x*circle.center.x + p2 + q2 - r2;

            y_points = bhaskara(A, B, C);
            if (y_points.length != 2) {
                return default_result;
            }

            point1.x = x;
            point1.y = y_points[0];

            point2.x = x;
            point2.y = y_points[1];
        } else {
            var a = (line.end.y - line.begin.y) / (line.end.x - line.begin.x);
            var b = line.begin.y - (a * line.begin.x);
            A = a*a + 1;
            B = 2*(a*b - a*circle.center.y - circle.center.x);
            C = (p2 + q2 - r2 - (2*b*circle.center.y) + b*b);

            x_points = bhaskara(A, B, C);
            if (x_points.length != 2) {
                return default_result;
            }

            point1.x = x_points[0];
            point1.y = a*point1.x + b;

            point2.x = x_points[1];
            point2.y = a*point2.x + b;
        }

        return [ point1, point2 ];
    }

    function isect_circle_circle(circle1, circle2) {
        default_result = [];

        // Intersection between circles
        var mid_x = circle1.center.x - circle2.center.x;
        var mid_y = circle1.center.y - circle2.center.y;
        var d = Math.sqrt(mid_x*mid_x + mid_y*mid_y);
        if ((d < 0.000001) || // consider 5 digits, just for approximation
            (d > (circle1.radius + circle2.radius)) ||
            (d < Math.abs(circle1.radius - circle2.radius))) {
            return default_result;
        }

        var r02 = circle1.radius * circle1.radius;
        var r12 = circle2.radius * circle2.radius;
        var a = (r02 - r12 + d*d) / (d + d);
        var h = Math.sqrt(r02 - a*a);

        var p2 = new $.Point();
        var p3_a = new $.Point();
        var p3_b = new $.Point();

        var a_d = a / d;
        var x_diff = circle2.center.x - circle1.center.x;
        var y_diff = circle2.center.y - circle1.center.y;
        p2.x = circle1.center.x + (a_d * x_diff);
        p2.y = circle1.center.y + (a_d * y_diff);

        var h_d = h / d;
        p3_a.x = p2.x + (h_d * y_diff);
        p3_b.x = p2.x - (h_d * y_diff);
        p3_a.y = p2.y - (h_d * x_diff);
        p3_b.y = p2.y + (h_d * x_diff);

        return [ p3_a, p3_b ];
    }

}(window.gallifreyan = window.gallifreyan || {}));
