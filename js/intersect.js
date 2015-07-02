/***************************** INTERSECTIONS *********************************/
window.gallifreyan.util.isect_line_circle = function(line, circle) {
    var default_result = [];

    // Line: y = ax + b
    // Circle: (x − p)^2 + (y − q)^2 = r^2
    // p = circle.center.x
    // q = circle.center.y
    // r = circle.radius

    var point1 = new window.gallifreyan.Point();
    var point2 = new window.gallifreyan.Point();
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

        var y_points = window.gallifreyan.util.bhaskara(A, B, C);
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

        var x_points = window.gallifreyan.util.bhaskara(A, B, C);
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

window.gallifreyan.util.isect_circle_circle = function(circle1, circle2) {
    var default_result = [];

    if (!circle1 || !circle2) {
        return default_result;
    }

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

    var p2 = new window.gallifreyan.Point();
    var p3_a = new window.gallifreyan.Point();
    var p3_b = new window.gallifreyan.Point();

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
