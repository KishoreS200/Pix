/**
 * SafeZoneVisualizer.js
 * Visual indicators for safe zones in the game
 */

import { SafeZones } from '../utils/NPCConfig';

export default class SafeZoneVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.graphics = null;
        this.currentRegion = null;
    }
    
    visualizeSafeZones(region) {
        // Clear previous visualization
        if (this.graphics) {
            this.graphics.destroy();
        }
        
        this.currentRegion = region;
        const zones = SafeZones[region];
        
        if (!zones || zones.length === 0) return;
        
        this.graphics = this.scene.add.graphics();
        this.graphics.setDepth(0); // Above ground, below entities
        
        zones.forEach(zone => {
            // Semi-transparent green overlay
            this.graphics.fillStyle(0x00ff00, 0.05);
            this.graphics.fillRect(zone.x, zone.y, zone.width, zone.height);
            
            // Border outline
            this.graphics.lineStyle(2, 0x00ff00, 0.3);
            this.graphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
            
            // Corner markers for better visibility
            const cornerSize = 20;
            this.graphics.lineStyle(3, 0x00ffff, 0.6);
            
            // Top-left corner
            this.graphics.lineBetween(zone.x, zone.y, zone.x + cornerSize, zone.y);
            this.graphics.lineBetween(zone.x, zone.y, zone.x, zone.y + cornerSize);
            
            // Top-right corner
            this.graphics.lineBetween(zone.x + zone.width, zone.y, zone.x + zone.width - cornerSize, zone.y);
            this.graphics.lineBetween(zone.x + zone.width, zone.y, zone.x + zone.width, zone.y + cornerSize);
            
            // Bottom-left corner
            this.graphics.lineBetween(zone.x, zone.y + zone.height, zone.x + cornerSize, zone.y + zone.height);
            this.graphics.lineBetween(zone.x, zone.y + zone.height, zone.x, zone.y + zone.height - cornerSize);
            
            // Bottom-right corner
            this.graphics.lineBetween(zone.x + zone.width, zone.y + zone.height, zone.x + zone.width - cornerSize, zone.y + zone.height);
            this.graphics.lineBetween(zone.x + zone.width, zone.y + zone.height, zone.x + zone.width, zone.y + zone.height - cornerSize);
            
            // Optional: Add zone name text (subtle)
            if (zone.name) {
                const text = this.scene.add.text(
                    zone.x + zone.width / 2,
                    zone.y + 20,
                    `[ ${zone.name} - Safe Zone ]`,
                    {
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: '#00ff00',
                        alpha: 0.4
                    }
                ).setOrigin(0.5);
                text.setDepth(1);
            }
        });
    }
    
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
    }
}
