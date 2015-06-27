scale_mult = 0.5;

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
        var pos = [0, 0];
        if (key != 'e') {
            pos = [Math.random()*2 - 1, Math.random()*2 - 1];
        }
        elements[key].pos = pos;
    }

    drawFrame(0);
}

function drawFrame(frame) {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var scale = Math.min(canvas.width, canvas.height) * scale_mult;
    ctx.setTransform(scale, 0, 0, -scale, canvas.width/2, canvas.height/2);
    ctx.lineWidth = 1/scale;

    for (var key in elements) {
        var el = elements[key];
        ctx.beginPath();
        ctx.arc(el.pos[0], el.pos[1], 0.1, 0, 2*Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
}
