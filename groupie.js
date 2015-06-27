scale_mult = 0.3;
circle_radius = 0.1;
frame_period = 10;
create_period = 400;
repforce = 0.001;
connforce = 0.02;
dims = 3;
maxnodes = 26;

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

twelverules = [
    ['aaa', 'e'],
    ['bb', 'e'],
    ['ababab', 'e']
];

// S3
s3 = {e: {a: 'a', A: 'A', b: 'b', B: 'b'},
      a: {a: 'A', A: 'e', b: 'Ab', B: 'Ab'},
      A: {a: 'e', A: 'a', b: 'ab', B: 'ab'},
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

elements = {};
rules = [];

function physics() {
    // Prepare the new positions.
    for (var key in elements) {
        elements[key].newpos = elements[key].pos.slice();
    }

    // Apply force.
    for (var key in elements) {
        var el = elements[key];
        var pos = el.pos;

        for (var key2 in elements) {
            if (key == key2) continue;
            var el2 = elements[key2];
            var pos2 = el2.pos;

            var dist = vec_sub(pos2, pos);
            var distnorm = vec_norm(dist);
            var dir = vec_normalize(dist);

            var connected = false;
            for (gen in generators) {
                if (el[gen] == key2 || el2[gen] == key) {
                    connected = true;
                    break;
                }
            }
            var attr = -repforce / (distnorm * distnorm);
            if (connected) {
                attr += connforce;
            }

            el.newpos = vec_add(el.newpos, scal_vec_mult(attr, dir));
            el2.newpos = vec_sub(el2.newpos, scal_vec_mult(attr, dir));
        }
    }

    // Assign the new positions relative to center of mass.
    var center = zero_vec(dims);
    var count = 0;
    for (var key in elements) {
        center = vec_add(center, elements[key].newpos);
        count++;
    }
    center = scal_vec_mult(0.01/count, center);
    for (var key in elements) {
        elements[key].pos = vec_sub(elements[key].newpos, center);
    }

    // Rotate
    if (dims == 3) {
        var rotspeed = 0.01;
        var rot =
            [[Math.cos(rotspeed), -Math.sin(rotspeed), 0],
             [0, 1, 0],
             [Math.sin(rotspeed), 0, Math.cos(rotspeed)]];
        for (var key in elements) {
            elements[key].pos = mat_vec_mult(rot, elements[key].pos);
        }
    }
}

function start() {
    rules.push(['e', '']);
    rules.push(['aA', 'e']);
    rules.push(['Aa', 'e']);
    rules.push(['bb', 'e']);
    rules.push(['B', 'b']);
    rules.push(['aaa', 'A']);
    rules.push(['AA', 'aa']);

    rules.push(['bab', 'AbA']);
    rules.push(['bAb', 'aba']);
    rules.push(['aabaab', 'baabaa']);
    rules.push(['abaaba', 'baab']);
    rules.push(['baabA', 'abaab']);
    rules.push(['Abaab', 'baaba']);

    create_element('e');
    draw_frame(0);
}

function simplify_key(key) {
    var matched = true;
    while (matched) {
        matched = false;
        for (var i = 0; i < rules.length; i++) {
            rep = key.replace(rules[i][0], rules[i][1]);
            if (rep !== key) {
                matched = true;
            }
            key = rep;
        }
    }
    return key;
}

function create_element(key, near) {
    key = simplify_key(key);
    if (elements[key] !== undefined) return;
    el = {};
    el.pos = [];
    for (var i = 0; i < dims; i++) {
        if (near === undefined) {
            el.pos[i] = Math.random()*2 - 1;
        } else {
            nearpos = elements[near].pos;
            el.pos[i] = nearpos[i] + Math.random()*0.2 - 0.1;
        }
    }
    elements[key] = el;
}

function link_elements(k1, k2, gen) {
    k1 = simplify_key(k1);
    k2 = simplify_key(k2);
    if (elements[k1][gen] === undefined) {
        elements[k1][gen] = k2;
    }
}

function create_nodes() {
    q = [];
    for (var key in elements) {
        q.push(key);
    }

    if (q.length >= maxnodes) return;
    for (var i = 0; i < q.length; i++) {
        key = q[i];
        for (var gen in generators) {
            create_element(gen + key, key);
            link_elements(key, gen + key, gen);
            link_elements(gen + key, key, gen.toUpperCase());
            create_element(gen.toUpperCase() + key, key);
            link_elements(key, gen.toUpperCase() + key, gen.toUpperCase());
            link_elements(gen.toUpperCase() + key, key, gen);
        }
    }
}

function draw_frame(frame) {
    // Create nodes and do physics.
    if (frame % create_period == 0) {
        create_nodes();
    }
    physics();

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var scale = Math.min(canvas.width, canvas.height) * scale_mult;
    ctx.setTransform(scale, 0, 0, scale, canvas.width/2, canvas.height/2);
    ctx.font = '0.05px sans-serif';

    // Fill background.
    ctx.fillStyle = 'white';
    ctx.fillRect(-5, -5, 10, 10);

    // Draw edges.
    ctx.lineWidth = 1/scale;
    for (var key in elements) {
        var el = elements[key];
        var pos = el.pos;
        var x = el.pos[0];
        var y = el.pos[1];

        for (var gen in generators) {
            var el2 = elements[el[gen]];
            if (el2 === undefined) continue;
            var target_pos = el2.pos;
            var xlen = target_pos[0] - x;
            var ylen = target_pos[1] - y;
            var angle = Math.atan2(ylen, xlen);
            xlen -= circle_radius * 2 * Math.cos(angle);
            ylen -= circle_radius * 2 * Math.sin(angle);

            ctx.beginPath();
            draw_vector(ctx, [xlen, ylen],
                        [x + circle_radius * Math.cos(angle),
                         y + circle_radius * Math.sin(angle)]);
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

        ctx.fillStyle = 'black';
        if (key == '') key = 'e';
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

function vec_norm(a) {
    var norm_sq = 0;
    for (var i = 0; i < a.length; i++) {
        norm_sq += a[i] * a[i];
    }
    return Math.sqrt(norm_sq);
}

function vec_add(a, b) {
    var add = [];
    var dist_sq = 0;
    for (var i = 0; i < a.length; i++) {
        add[i] = a[i] + b[i];
    }
    return add;
}

function zero_vec(n) {
    var v = [];
    for (var i = 0; i < n; i++) {
        v[i] = 0;
    }
    return v;
}

function vec_sub(a, b) {
    var sub = [];
    var dist_sq = 0;
    for (var i = 0; i < a.length; i++) {
        sub[i] = a[i] - b[i];
    }
    return sub;
}

function scal_vec_mult(a, v) {
    var av = [];
    for (var i = 0; i < v.length; i++) {
        av[i] = a * v[i];
    }
    return av;
}

function vec_normalize(v, scale) {
    if (scale === undefined) {
        scale = 1;
    }
    var norm = vec_norm(v);
    if (norm == 0) {
        return v;
    } else {
        return scal_vec_mult(scale/norm, v);
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

    var Tv1 = vec_normalize(mat_vec_mult([[-0.5, 0.5], [-0.5, -0.5]], v), 0.05);
    var Tv2 = vec_normalize(mat_vec_mult([[-0.5, -0.5], [0.5, -0.5]], v), 0.05);
    ctx.lineTo(v[0] + origin[0], v[1] + origin[1]);
    ctx.lineTo(v[0] + Tv1[0] + origin[0], v[1] + Tv1[1] + origin[1]);
    ctx.moveTo(v[0] + origin[0], v[1] + origin[1]);
    ctx.lineTo(v[0] + Tv2[0] + origin[0], v[1] + Tv2[1] + origin[1]);
}
