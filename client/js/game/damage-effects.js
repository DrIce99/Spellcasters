// damage-effects.js

let shakeTime = 0;
let shakeIntensity = 0;
let lastHealth = null;
let redOverlayAlpha = 0;

export function triggerCameraShake(intensity = 10, duration = 250) {
    shakeTime = duration;
    shakeIntensity = intensity;
}

export function applyCameraShake(ctx) {
    if (shakeTime > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeTime -= 16; // ~1 frame a 60fps
        if (shakeTime < 0) shakeTime = 0;
    }
}

export function updateRedOverlay(playerHealth, maxHealth = 100) {
    // Aggiorna alpha in base alla percentuale di vita
    const perc = playerHealth / maxHealth;
    if (perc < 0.5) {
        // Da 0 a 0.6 di alpha tra 50% e 0% vita
        redOverlayAlpha = Math.min(0.6, (0.5 - perc) * 1.2);
    } else {
        redOverlayAlpha = 0;
    }
}

export function drawRedOverlay(ctx, canvas) {
    if (redOverlayAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = redOverlayAlpha;
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}
// Lampo a tutto schermo che si spegne da solo (colpo subito, burnout, mana ripristinato...)
let flashColor = '#ffffff';
let flashAlpha = 0;
let flashStart = 0;
let flashDuration = 0;

export function triggerScreenFlash(color = '#ffffff', alpha = 0.3, duration = 300) {
    // Un lampo più debole non copre uno più forte ancora in corso
    if (currentFlashAlpha() > alpha) return;
    flashColor = color;
    flashAlpha = alpha;
    flashStart = performance.now();
    flashDuration = duration;
}

function currentFlashAlpha() {
    if (flashDuration <= 0) return 0;
    const t = (performance.now() - flashStart) / flashDuration;
    return t >= 1 ? 0 : flashAlpha * (1 - t) * (1 - t);
}

export function drawScreenFlash(ctx, canvas) {
    const alpha = currentFlashAlpha();
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}
