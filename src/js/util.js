
/********************************** UTIL *************************************/

PUBLIC.util = {
    bhaskara: function(A, B, C) {
        // If A=0, then it is NOT a second degree polynomial
        if (A !== 0) {
            var delta = B*B - 4*A*C;
            if (delta < 0) {
                return [];
            }
            var sqrt_delta = Math.sqrt(delta);
            var r1 = (-B + sqrt_delta) / (2*A);
            var r2 = (-B - sqrt_delta) / (2*A);
            return [ r1, r2 ];
        } else if (B !== 0) {
            return [ -C / B ];
        }
        return [];
    },
    angle_between_points: function(base_x, base_y, target_x, target_y) {
        var dx = target_x - base_x;
        var dy = target_y - base_y;
        return PUBLIC.util.normalize_angle(Math.atan2(dy, dx), 0);
    },
    normalize_angle: function(angle, start_angle) {
        // Converts any "angle" to the range ["start_angle" ~ "start_angle" + 360 degrees]
        while (angle < start_angle) {
            angle += Math.TWOPI;
        }
        var end_angle = start_angle + Math.TWOPI;
        while (angle > end_angle) {
            angle -= Math.TWOPI;
        }
        return angle;
    },
    points_distance: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy);
    },
    // Kind of randomize the angles in certain intervals
    randomize_angles: function(count, min_angle, max_angle) {
        var angles = [];
        if (typeof(count) === "undefined" || count <= 0) {
            return angles;
        }
        
        // Normalize angles
        min_angle = typeof(min_angle) === "undefined" ? 0 : min_angle;
        max_angle = typeof(max_angle) === "undefined" ? Math.TWOPI : max_angle;
        if (min_angle > max_angle) {
            min_angle -= Math.TWOPI;
        }

        var range = max_angle - min_angle;
        var i;
        var total_slots = count * 3;
        var slots = [];
        var slot_step = range / (total_slots - 1);

        for (i = min_angle; i <= max_angle; i += slot_step) {
            slots.push(i);
        }

        for (i = 0; i < count; ++i) {
            var slot_id = Math.floor(Math.random() * slots.length);
            angles.push(slots[slot_id]);
            slots.splice(slot_id, 1);
        }
        return angles;
    },
    line_equation: function(start_x, start_y, end_x, end_y) {
        // Line equation is:  y = A*X + B
        // Except when it's a vertical line, then it's:  x = A*y + B
        var result = {
            a: 0,
            b: 0,
            vertical: false
        };

        var dx = end_x - start_x;
        var dy = end_y - start_y;

        if (dx > 0.0001) {
            // Not near vertical

            result.a = dy / dx;
            result.b = result.a * start_y + start_x;
        } else {
            // Is near vertical
            result.a = dx / dy;
            result.b = result.a * start_x + start_y;
            result.vertical = true;
        }

        return result;
    }
};

/***************************** INTERSECTIONS *********************************/
PUBLIC.util.isect_line_circle = function(line, circle) {
    var default_result = [];

    // Line: y = ax + b
    // Circle: (x − p)^2 + (y − q)^2 = r^2
    // p = circle.center.x
    // q = circle.center.y
    // r = circle.radius

    var point1 = new PUBLIC.Point();
    var point2 = new PUBLIC.Point();
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

        var y_points = PUBLIC.util.bhaskara(A, B, C);
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

        var x_points = PUBLIC.util.bhaskara(A, B, C);
        if (x_points.length != 2) {
            return default_result;
        }

        point1.x = x_points[0];
        point1.y = a*point1.x + b;

        point2.x = x_points[1];
        point2.y = a*point2.x + b;
    }

    return [ point1, point2 ];
};

PUBLIC.util.isect_circle_circle = function(circle1, circle2) {
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

    var p2 = new PUBLIC.Point();
    var p3_a = new PUBLIC.Point();
    var p3_b = new PUBLIC.Point();

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
};
