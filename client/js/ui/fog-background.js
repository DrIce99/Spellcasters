// fog-background.js - Foschia/nuvole animate sullo sfondo (Home e Patch notes)

export function startFogBackground(fogCanvas) {
    if (!fogCanvas) return;

    const ctx = fogCanvas.getContext('2d');
    let W = window.innerWidth;
    let H = fogCanvas.clientHeight || 320;
    fogCanvas.width = W;
    fogCanvas.height = H;

    const LAYERS = 2;
    const FOG_PER_LAYER = [5, 8];
    const LIGHT_BEAM_COUNT = 3;
    const COLORS = [
        'rgba(120,200,255,0.12)',
        'rgba(120,220,255,0.08)',
        'rgba(180,240,255,0.05)'
    ];

    let fogClouds = [];

    function createCloud(layer) {
        return {
            layer,
            x: Math.random() * W,
            y: H * (0.5 + 0.15 * layer + Math.random() * 0.15),
            rx: 60 + Math.random() * 80 + layer * 20,
            ry: 20 + Math.random() * 24 + layer * 6,
            alpha: 0.08 + Math.random() * 0.06,
            speed: 0.08 + Math.random() * 0.06 + layer * 0.2,
            vy: (Math.random() - 0.1) * 0.2 + (layer - 1) * 0.1,
            color: COLORS[layer % COLORS.length],
            phase: Math.random() * Math.PI * 2
        };
    }

    function initFog() {
        fogClouds = [];
        for (let l = 0; l < LAYERS; l++) {
            for (let i = 0; i < FOG_PER_LAYER[l]; i++) {
                fogClouds.push(createCloud(l));
            }
        }
    }

    // I gradienti dei fasci di luce vengono calcolati una volta sola (e ricalcolati al resize)
    let lightGradients = [];
    function createLightGradients() {
        lightGradients = [];
        for (let i = 0; i < LIGHT_BEAM_COUNT; i++) {
            const grad = ctx.createLinearGradient(0, 0, 0, -H * 0.95);
            grad.addColorStop(0, 'rgba(120,220,255,0.10)');
            grad.addColorStop(0.2, 'rgba(120,220,255,0.05)');
            grad.addColorStop(0.7, 'rgba(120,220,255,0.005)');
            grad.addColorStop(1, 'rgba(120,220,255,0)');
            lightGradients.push(grad);
        }
    }

    function resizeFogCanvas() {
        W = window.innerWidth;
        H = fogCanvas.clientHeight || 320;
        fogCanvas.width = W;
        fogCanvas.height = H;
        initFog();
        createLightGradients();
    }
    window.addEventListener('resize', resizeFogCanvas);

    function drawFog() {
        ctx.clearRect(0, 0, W, H);

        // Fasci di luce (simulazione volumetrica)
        for (let i = 0; i < LIGHT_BEAM_COUNT; i++) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.moveTo(-40 - i * 12, 0);
            ctx.lineTo(40 + i * 12, 0);
            ctx.lineTo(12 + i * 5, -H * 0.95);
            ctx.lineTo(-12 - i * 5, -H * 0.95);
            ctx.closePath();
            ctx.fillStyle = lightGradients[i];
            ctx.fill();
            ctx.restore();
        }

        // Nuvole
        const time = Date.now() * 0.00012;
        for (const c of fogClouds) {
            ctx.save();
            const yRatio = 1 - (c.y / H);
            ctx.globalAlpha = c.alpha * (1 - 0.85 * yRatio * yRatio); // più in alto = meno visibile
            ctx.translate(c.x, c.y);
            ctx.rotate(Math.sin(time + c.phase) * 0.02);
            ctx.fillStyle = c.color.replace(/\d?\.\d+\)$/, '0.15)');
            ctx.beginPath();
            ctx.arc(0, 0, c.rx * 0.6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    }

    function updateFog() {
        const time = Date.now() * 0.0003;
        for (const c of fogClouds) {
            c.x += c.speed;
            c.y += c.vy + Math.sin(time + c.phase) * 0.02;
            if (c.y < H * 0.2) c.y = H * 0.2 + Math.abs(c.vy);
            if (c.y > H * 0.9) c.y = H * 0.9 - Math.abs(c.vy);
            if (c.x - c.rx > W) {
                Object.assign(c, createCloud(c.layer), { x: -c.rx });
            }
        }
    }

    // ~30 FPS: più che sufficienti per uno sfondo
    let lastTime = 0;
    const targetFrameTime = 1000 / 30;
    function animateFog(currentTime) {
        if (currentTime - lastTime >= targetFrameTime) {
            updateFog();
            drawFog();
            lastTime = currentTime;
        }
        requestAnimationFrame(animateFog);
    }

    initFog();
    createLightGradients();
    requestAnimationFrame(animateFog);
}
