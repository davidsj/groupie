scale_mult = 0.2;
circle_radius = 0.1;
frame_period = 20;
force = 0.1;
trydist = 0.5;

generators = {a: 'red', b: 'green'};
// 3x2 12-group
twelve = {e: {a: 'a', A: 'A', b: 'b', B: 'b'},
          a: {a: 'A', A: 'e', b: 'ba', B: 'ba'},
          A: {a: 'e', A: 'a', b: 'bA', B: 'bA'},
          b: {a: 'ab', A: 'Ab', b: 'e', B: 'e'},
          ab: {a: 'Ab', A: 'b', b: 'AbA', B: 'AbA'},
          Ab: {a: 'b', A: 'ab', b: 'aba', B: 'aba'},
          ba: {a: 'aba', A: 'Aba', b: 'a', B: 'a'},
          aba: {a: 'Aba', A: 'ba', b: 'Ab', B: 'Ab'},
          Aba: {a: 'ba', A: 'aba', b: 'abA', B: 'abA'},
          bA: {a: 'abA', A: 'AbA', b: 'A', B: 'A'},
          abA: {a: 'AbA', A: 'bA', b: 'Aba', B: 'Aba'},
          AbA: {a: 'bA', A: 'abA', b: 'ab', B: 'ab'}
         };

// S3
s3 = {e: {a: 'a', A: 'A', b: 'b', B: 'b'},
      a: {a: 'A', A: 'e', b: 'ba', B: 'ba'},
      A: {a: 'e', A: 'a', b: 'bA', B: 'bA'},
      b: {a: 'ab', A: 'Ab', b: 'e', B: 'e'},
      ab: {a: 'Ab', A: 'b', b: 'A', B: 'A'},
      Ab: {a: 'b', A: 'ab', b: 'a', B: 'a'},
     };

// Abelian 4
a4 = {e: {a: 'a', A: 'a', b: 'b', B: 'b'},
      a: {a: 'e', A: 'e', b: 'ab', B: 'ab'},
      b: {a: 'ab', A: 'ab', b: 'e', B: 'e'},
      ab: {a: 'b', A: 'b', b: 'a', B: 'a'}
     };

elements = twelve;

function physics() {
    // Prepare the new positions.
    for (var key in elements) {
        elements[key].newpos = elements[key].pos.slice();
    }

    // Apply force.
    for (var key in elements) {
        var el = elements[key];
        var pos = el.pos;
        var newpos = el.newpos;

        for (var key2 in elements) {
            var el2 = elements[key2];
            var pos2 = el2.pos;
            var newpos2 = el2.newpos;

            var xdist = pos2[0] - pos[0];
            var ydist = pos2[1] - pos[1];
            var angle = Math.atan2(ydist, xdist);
            var dist = Math.sqrt(xdist*xdist + ydist*ydist);

            var connected = false;
            for (gen in generators) {
                if (el[gen] == key2 || el2[gen] == key) {
                    connected = true;
                    break;
                }
            }
            var attr = force * (dist - trydist);
            if (!connected) {
                attr = Math.min(0, attr) * 2;
            }

            newpos[0] += attr * Math.cos(angle);
            newpos[1] += attr * Math.sin(angle);
            newpos2[0] -= attr * Math.cos(angle);
            newpos2[1] -= attr * Math.sin(angle);
        }
    }

    // Assign the new positions, putting identity center.
    for (var key in elements) {
        elements[key].pos = vec_sub(elements[key].newpos, elements.e.newpos);
    }
}

function draw() {
    for (var key in elements) {
        elements[key].pos = [Math.random()*2 - 1, Math.random()*2 - 1];
    }

    draw_frame(0);
}

function draw_frame(frame) {
    // Do physics.
    physics();

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var scale = Math.min(canvas.width, canvas.height) * scale_mult;
    ctx.setTransform(scale, 0, 0, scale, canvas.width/2, canvas.height/2);
    ctx.font = '0.1px sans-serif';

    // Fill background.
    ctx.fillStyle = 'white';
    ctx.fillRect(-5, -5, 10, 10);

    // Draw edges.
    ctx.lineWidth = 1/scale;
    for (var key in elements) {
        var el = elements[key];
        var x = el.pos[0];
        var y = el.pos[1];

        for (var gen in generators) {
            var el2 = elements[el[gen]];
            if (el2 === undefined) continue;
            var target_pos = el2.pos;
            var xlen = target_pos[0] - x;
            var ylen = target_pos[1] - y;
            var angle = Math.atan2(ylen, xlen);
            xlen -= circle_radius * Math.cos(angle);
            ylen -= circle_radius * Math.sin(angle);

            ctx.beginPath();
            draw_vector(ctx, [xlen, ylen], [x, y]);
            ctx.strokeStyle = generators[gen];
            ctx.stroke();
        }
    }

    // Draw elements.
    ctx.lineWidth = 1/scale;
    for (var key in elements) {
        var el = elements[key];
        var x = el.pos[0];
        var y = el.pos[1];

        ctx.beginPath();
        ctx.arc(x, y, 0.1, 0, 2*Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.fillText(key, x - key.length*0.03, y + 0.03);
    }

    // Set timer for next frame.
    setTimeout("draw_frame("+(frame+1)+")", frame_period);
}

function mat_vec_mult(A, x) {
    var Ax = [];
    for (var i = 0; i < A.length; i++) {
        Ax[i] = 0;
        for (var j = 0; j < A[i].length; j++) {
            Ax[i] += A[i][j] * x[j];
        }
    }
    return Ax;
}

function vec_sub(a, b) {
    var sub = [];
    var dist_sq = 0;
    for (var i = 0; i < a.length; i++) {
        sub[i] = a[i] - b[i];
    }
    return sub;
}

function draw_vector(ctx, v, origin) {
    if (origin === undefined) {
        origin = [0, 0];
    }
    ctx.moveTo(origin[0], origin[1]);

    var Tv1 = mat_vec_mult([[0.9, -0.1], [0.1, 0.9]], v);
    var Tv2 = mat_vec_mult([[0.9, 0.1], [-0.1, 0.9]], v);
    ctx.lineTo(v[0] + origin[0], v[1] + origin[1]);
    ctx.lineTo(Tv1[0] + origin[0], Tv1[1] + origin[1]);
    ctx.moveTo(v[0] + origin[0], v[1] + origin[1]);
    ctx.lineTo(Tv2[0] + origin[0], Tv2[1] + origin[1]);
}
