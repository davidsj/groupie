scale_mult = 0.35;
zoom = 1.0;
circle_radius = 0.1;
frame_period = 10;
create_period = 50;
repforce = 0.002;
connforce = 0.02;
dims = 3;
maxnodes = 128;

generators = {a: 'blue', b: 'green'};
// generators = {a: 'red', b: 'green', c: 'blue'};
// generators = {a: 'red', b: 'green', c: 'blue', d: 'yellow'};

elements = {};
rules = {};

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
        var rotspeed = 0.002;
        var rot =
            [[Math.cos(rotspeed), -Math.sin(rotspeed), 0],
             [0, 1, 0],
             [Math.sin(rotspeed), 0, Math.cos(rotspeed)]];
        for (var key in elements) {
            elements[key].pos = mat_vec_mult(rot, elements[key].pos);
        }
    }
}

function invert(letters) {
    str = '';
    for (var i = letters.length - 1; i >= 0; i--) {
        letter = letters[i];
        if (letter == letter.toLowerCase()) {
            str += letter.toUpperCase();
        } else {
            str += letter.toLowerCase();
        }        
    }
    return str;
}

function reconcile_rule(left, right) {
    // Permutes a rule to see what else can be learned from it.

    // 0. Put equation in canonical form with identity on the right.
    left = left + invert(right);
    right = '';

    // 1. Generate all rotations of the equation through left- and
    // right-products.
    var rots = [];
    for (var start = 0; start <= left.length; start++) {
        for (var end = start; end <= left.length; end++) {
            eqleft = left.slice(start, end);
            eqright = invert(left.slice(0, start)) + invert(left.slice(end));
            rots.push([eqleft, eqright]);
        }
    }

    // 2. Simplify each equation using existing rules.
    for (var i = 0; i < rots.length; i++) {
        eq = rots[i];
        eq[0] = simplify_key(eq[0]);
        eq[1] = simplify_key(eq[1]);
    }

    // 3. For each equation, if the two sides are unequal, map the
    // more complex one to the simpler one (through a strict ordering
    // of all possible expressions).
    var count = 0;
    for (var i = 0; i < rots.length; i++) {
        eqleft = rots[i][0];
        eqright = rots[i][1];
        if (eqleft == eqright) continue;

        count++;
        if (eqleft.length > eqright.length ||
            (eqleft.length == eqright.length &&
             invert(eqleft) > invert(eqright))) {
            rules[eqleft] = eqright;
            console.log(eqleft + ' = ' + eqright);
        } else {
            rules[eqright] = eqleft;
            console.log(eqright + ' = ' + eqleft);
        }
    }

    // Return the number of new rules added.
    return count;
}

function join_elements(to, from) {
    if (to === undefined ||
        from === undefined ||
        to === from ||
        elements[to] === undefined ||
        elements[from] === undefined) return;
    if (to.length > from.length ||
        (to.length == from.length &&
         invert(to) > invert(from))) {
        var tmp = from;
        from = to;
        to = tmp;
    }

    console.log(from + ' -> ' + to);
    // Add a rule to simplify the algebra in the future.
    rules[from] = to;

    toel = elements[to];
    fromel = elements[from];
    delete elements[from];

    for (var gen in generators) {
        join_elements(toel[gen], fromel[gen]);
        join_elements(toel[gen.toUpperCase()], fromel[gen.toUpperCase()]);
    }
}

function start() {
    // Identity and inverses
    rules['e'] = '';
    rules['E'] = '';
    for (var gen in generators) {
        rules[gen + gen.toUpperCase()] = 'e';
        rules[gen.toUpperCase() + gen] = 'e';
    }

//     // Truncated tetrahedron
//     rules['aaa'] = 'e';
//     rules['bb'] = 'e';
//     rules['ababab'] = 'e';

//     // Truncated tetrahedron alternate
//     rules['aaa'] = 'e';
//     rules['bbb'] = 'e';
//     rules['AbAb'] = 'e';

    // Soccer ball
    rules['aaaaa'] = 'e';
    rules['bb'] = 'e';
    rules['AbA'] = 'bab';

//     // Abelian cube
//     rules['aa'] = 'e';
//     rules['bb'] = 'e';
//     rules['cc'] = 'e';
//     rules['ab'] = 'ba';
//     rules['ac'] = 'ca';
//     rules['bc'] = 'cb';

//     // Abelian hypercube
//     rules['aa'] = 'e';
//     rules['bb'] = 'e';
//     rules['cc'] = 'e';
//     rules['dd'] = 'e';
//     rules['ab'] = 'ba';
//     rules['ac'] = 'ca';
//     rules['bc'] = 'cb';
//     rules['ad'] = 'da';
//     rules['bd'] = 'db';
//     rules['cd'] = 'dc';

//     // Rectangular Loop
//     rules['aaaaaaaaaaaa'] = 'e';
//     rules['bbbb'] = 'e';
//     rules['ab'] = 'ba';

//     // Flat Loop
//     rules['aaaaaaaaaaaa'] = 'e';
//     rules['bb'] = 'e';
//     rules['ab'] = 'ba';

//     // D3
//     rules['aaa'] = 'e';
//     rules['bb'] = 'e';
//     rules['bab'] = 'A';

//     // S4
//     rules['aaaa'] = 'e';
//     rules['bb'] = 'e';
//     rules['ababab'] = 'e';

//     // S4 alternate
//     rules['aaaa'] = 'e';
//     rules['bbb'] = 'e';
//     rules['aBaB'] = 'e';

//     // S5
//     rules['aaaaa'] = 'e';
//     rules['bb'] = 'e';
//     rules['abab'] = 'bAbA';

    // Reconcile all the rules.
    while (true) {
        var count = 0;
        for (var left in rules) {
            var right = rules[left];
            count += reconcile_rule(left, right);
        }
        if (count == 0) break;
    }

    create_element('e');
    draw_frame(0);
}

function simplify_key(key) {
    var matched = true;
    while (matched) {
        matched = false;
        for (var left in rules) {
            rep = key.replace(left, rules[left]);
            if (rep !== key) {
                matched = true;
            }
            key = rep;
        }
    }
    return key;
}

function display_key(key) {
    key = simplify_key(key);
    if (key == '') return 'e';

    var dkey = '';
    var curgen = null;
    var curcount = 0;
    for (var i = 0; i < key.length; i++) {
        if (key[i] != curgen) {
            if (curgen !== null) {
                dkey += expstr(curgen, curcount);
            }
            curgen = key[i];
            curcount = 0;
        }
        curcount++;
    }
    if (curgen !== null) {
        dkey += expstr(curgen, curcount);
    }
    return dkey;
}

function expstr(letter, n) {
    var neg = false;
    if (letter == letter.toUpperCase()) {
        neg = true;
        letter = letter.toLowerCase();
    }
    str = '';
    if (n == 1 && !neg) return letter;
    while (n > 0) {
        digit = n % 10;
        str = ['\u2070',
               '\u00b9',
               '\u00b2',
               '\u00b3',
               '\u2074',
               '\u2075',
               '\u2076',
               '\u2077',
               '\u2078',
               '\u2079'][digit] + str;
        n = Math.round((n - digit) / 10);
    }
    if (neg) str = '\u207b'+ str;
    return letter + str;
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
            near = simplify_key(near);
            nearpos = elements[near].pos;
            el.pos[i] = nearpos[i] + Math.random()*0.1 - 0.05;
        }
    }
    elements[key] = el;
}

function link_elements(k1, k2, gen) {
    k1 = simplify_key(k1);
    k2 = simplify_key(k2);

    el1 = elements[k1];
    if (el1[gen] === undefined) {
        el1[gen] = k2;
    } else if (el1[gen] != k2) {
        join_elements(k2, el1[gen]);
    }

    k1 = simplify_key(k1);
    k2 = simplify_key(k2);
    elements[k1][gen] = k2;
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

    var sum_norm_sq = 0;
    var num_els = 0;
    for (var key in elements) {
        sum_norm_sq += vec_norm(elements[key].pos.slice(0, 2))
        num_els++;
    }
    var stdev = Math.sqrt(sum_norm_sq / num_els);
    zoom = Math.pow(zoom, 0.99) * Math.pow(stdev, 0.01);

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var scale = Math.min(canvas.width, canvas.height) * scale_mult / zoom;
    ctx.setTransform(scale, 0, 0, scale, canvas.width/2, canvas.height/2);
    ctx.font = '0.04px sans-serif';

    // Fill background.
    ctx.fillStyle = 'white';
    ctx.fillRect(-5*zoom, -5*zoom, 10*zoom, 10*zoom);

    // Draw edges.
//     ctx.lineWidth = 1/scale;
    ctx.lineWidth = 0.01;
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
                         y + circle_radius * Math.sin(angle)],
                        simplify_key(gen + gen) != '');
            ctx.strokeStyle = generators[gen];
            ctx.stroke();
        }
    }

    // Draw elements.
//     ctx.lineWidth = 1/scale;
    ctx.lineWidth = 0.01;
    for (var key in elements) {
        var el = elements[key];
        var x = el.pos[0];
        var y = el.pos[1];

        ctx.fillStyle = 'black';
        key = display_key(key);
        ctx.fillText(key, x - key.length*0.02, y + 0.02);
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

function draw_vector(ctx, v, origin, with_arrow) {
    if (origin === undefined) {
        origin = [0, 0];
    }
    if (with_arrow === undefined) {
        with_arrow = true;
    }
    ctx.moveTo(origin[0], origin[1]);

    ctx.lineTo(v[0] + origin[0], v[1] + origin[1]);

    if (with_arrow) {
        var Tv1 = vec_normalize(mat_vec_mult([[-0.5, 0.5], [-0.5, -0.5]], v), 0.05);
        var Tv2 = vec_normalize(mat_vec_mult([[-0.5, -0.5], [0.5, -0.5]], v), 0.05);
        ctx.lineTo(v[0] + Tv1[0] + origin[0], v[1] + Tv1[1] + origin[1]);
        ctx.moveTo(v[0] + origin[0], v[1] + origin[1]);
        ctx.lineTo(v[0] + Tv2[0] + origin[0], v[1] + Tv2[1] + origin[1]);
    }
}
