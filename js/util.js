/********************************** UTIL *************************************/
    function bhaskara(A, B, C) {
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
    }
    function normalize_angle(angle, start_angle) {
        // Converts any "angle" to the range beginning at the "start_angle" and ending in "start_angle" + 360 degrees
        while (angle < start_angle) {
            angle += Math.TWOPI;
        }
        end_angle = start_angle + Math.TWOPI;
        while (angle > end_angle) {
            angle -= Math.TWOPI;
        }
        return angle;
    }
    function points_distance(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy);
    }
    // Kind of randomize the angles in certain intervals
    function randomize_angles(count, min_angle, max_angle) {
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
    }
