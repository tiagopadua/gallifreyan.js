/********************************** UTIL *************************************/
window.gallifreyan.util = {
    bhaskara: function(A, B, C) {
        // If A=0, then it is NOT a second degree polynomial
        if (A != 0) {
            var delta = B*B - 4*A*C;
            if (delta < 0) {
                return [];
            }
            sqrt_delta = Math.sqrt(delta);
            r1 = (-B + sqrt_delta) / (2*A);
            r2 = (-B - sqrt_delta) / (2*A);
            return [ r1, r2 ];
        } else if (B != 0) {
            return [ -C / B ]
        }
        return [];
    },
    angle_between_points: function(base_x, base_y, target_x, target_y) {
        var dx = target_x - base_x;
        var dy = target_y - base_y;
        return window.gallifreyan.util.normalize_angle(Math.atan2(dy, dx), 0);
    },
    normalize_angle: function(angle, start_angle) {
        // Converts any "angle" to the range ["start_angle" ~ "start_angle" + 360 degrees]
        while (angle < start_angle) {
            angle += Math.TWOPI;
        }
        end_angle = start_angle + Math.TWOPI;
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
        var min_angle = typeof(min_angle) === "undefined" ? 0 : min_angle;
        var max_angle = typeof(max_angle) === "undefined" ? Math.TWOPI : max_angle;
        if (min_angle > max_angle) {
            min_angle -= Math.TWOPI;
        }
        var range = max_angle - min_angle;
        var i = 0;
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
        result = {
            a: 0,
            b: 0,
            vertical: false
        };

        var dx = end_x - start_x;
        var dy = end_y - start_y;

        if (dx > .0001) {
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
}