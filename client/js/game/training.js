// training.js - Manichino da allenamento per game.html?mode=training
import { Enemy } from "./entities/enemy.js";
import { globalCollisionSystem } from './collision-system.js';

export function setupTrainingDummy(canvas) {
    // Posizione relativa allo schermo (prima era fissa a x=1500 e finiva fuori dagli schermi piccoli)
    const enemy = new Enemy(canvas.clientWidth * 0.78 || 1500, canvas.clientHeight * 0.37 || 400, 'light');
    enemy.restitution = 0.4;
    globalCollisionSystem.registerEntity(enemy);

    // Chiamata a ogni frame da engine.js
    window.drawTrainingEnemies = function(ctx) {
        enemy.update(1 / 60);
        enemy.draw(ctx);
    };

    console.log('🎯 Sistema di training inizializzato');
}
