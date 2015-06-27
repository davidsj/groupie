scale_mult = 0.3;
circle_radius = 0.1;

generators = {a: 'red', b: 'green'};
elements = {e: {a: 'a', A: 'A', b: 'b', B: 'b'},
            a: {a: 'A', A: 'e', b: 'ba', B: 'ba'},
            A: {a: 'e', A: 'a', b: 'bA', B: 'bA'},
            b: {a: 'ab', A: 'Ab', b: 'e', B: 'e'},
            ab: {a: 'Ab', A: 'b', b: 'AbA', B: 'AbA'},
            Ab: {a: 'b', A: 'ab', b: 'aba', B: 'aba'},
            ba: {a: 'aba', A: 'Aba', b: 'a', B: 'a'},
            aba: {a: 'Aba', A: 'ba', b: 'Ab', B: 'Ab'},
            Aba: {a: 'ba', A: 'aba', b: 'abA', B: 'abA'},
            bA: {a: 'abA', A: 'AbA', b: 'A', B: 'A'},
            abA: {a: 'AbA', A: 'bA', b: 'AbA', B: 'AbA'},
            AbA: {a: 'bA', A: 'abA', b: 'aba', B: 'aba'}};

function draw() {
    for (var key in elements) {
        var pos = [0.00001, 0.000001]; // for some reason this is necessary for e...?
        if (key != 'e') {
            pos = [Math.random()*2 - 1, Math.random()*2 - 1];
        }
        elements[key].pos = pos;
    }

    draw_frame(0);
}

function draw_frame(frame) {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var scale = Math.min(canvas.width, canvas.height) * scale_mult;
    ctx.setTransform(scale, 0, 0, scale, canvas.width/2, canvas.height/2);
    ctx.font = '0.1px sans-serif';

    // Draw edges.
    ctx.lineWidth = 1/scale;
    for (var key in elements) {
        var el = elements[key];
        var x = el.pos[0];
        var y = el.pos[1];

        for (var gen in generators) {
            var target_pos = elements[el[gen]].pos;
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
