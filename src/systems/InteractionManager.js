/**
 * InteractionManager.js
 * Manages NPC interactions and dialogue display
 */

import Phaser from 'phaser';
import NPC from '../entities/NPC';
import { getNPCsForRegion } from '../utils/NPCConfig';
import { getNPCDialogue } from '../utils/DialogueConfig';
import AudioManager from './AudioManager';

export default class InteractionManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
        this.currentRegion = null;
        
        // Dialogue UI
        this.dialogueBox = null;
        this.dialogueText = null;
        this.npcNameText = null;
        this.dialogueContainer = null;
        this.isDialogueOpen = false;
        this.currentDialogueIndex = 0;
        this.currentDialogueLines = [];
        this.currentNPCName = '';
        
        // Audio
        this.audioManager = AudioManager.getInstance(scene);
        
        // Create dialogue UI (hidden by default)
        this.createDialogueUI();
        
        // Input for cycling through dialogue
        this.interactKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.closeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }
    
    createDialogueUI() {
        const { width, height } = this.scene.cameras.main;
        
        // Container for all dialogue UI elements
        this.dialogueContainer = this.scene.add.container(0, 0);
        this.dialogueContainer.setScrollFactor(0);
        this.dialogueContainer.setDepth(200);
        this.dialogueContainer.setVisible(false);
        
        // Semi-transparent overlay to dim the game
        this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
        this.overlay.setInteractive();
        this.dialogueContainer.add(this.overlay);
        
        // Dialogue box background
        const boxWidth = width - 100;
        const boxHeight = 200;
        const boxX = width / 2;
        const boxY = height - boxHeight / 2 - 20;
        
        // Box background with glitch theme
        this.dialogueBox = this.scene.add.graphics();
        this.dialogueBox.fillStyle(0x001a1a, 0.95);
        this.dialogueBox.fillRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 10);
        this.dialogueBox.lineStyle(3, 0x00ffff, 1);
        this.dialogueBox.strokeRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 10);
        this.dialogueContainer.add(this.dialogueBox);
        
        // NPC name banner
        const nameWidth = 250;
        const nameHeight = 40;
        const nameX = boxX - boxWidth / 2 + nameWidth / 2 + 10;
        const nameY = boxY - boxHeight / 2 - nameHeight / 2;
        
        const nameBanner = this.scene.add.graphics();
        nameBanner.fillStyle(0x00ffff, 0.9);
        nameBanner.fillRoundedRect(nameX - nameWidth / 2, nameY - nameHeight / 2, nameWidth, nameHeight, 5);
        this.dialogueContainer.add(nameBanner);
        
        this.npcNameText = this.scene.add.text(nameX, nameY, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.dialogueContainer.add(this.npcNameText);
        
        // Dialogue text
        this.dialogueText = this.scene.add.text(
            boxX - boxWidth / 2 + 30,
            boxY - boxHeight / 2 + 50,
            '',
            {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#ffffff',
                wordWrap: { width: boxWidth - 60 }
            }
        );
        this.dialogueContainer.add(this.dialogueText);
        
        // Continue prompt
        this.continuePrompt = this.scene.add.text(
            boxX + boxWidth / 2 - 30,
            boxY + boxHeight / 2 - 30,
            '[E] Continue  [ESC] Close',
            {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#00ffff'
            }
        ).setOrigin(1, 0);
        this.dialogueContainer.add(this.continuePrompt);
        
        // Pulsing animation for continue prompt
        this.scene.tweens.add({
            targets: this.continuePrompt,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    spawnNPCs(region) {
        // Clear existing NPCs
        this.clearNPCs();
        
        this.currentRegion = region;
        const npcConfigs = getNPCsForRegion(region);
        
        // Create NPC instances
        npcConfigs.forEach(config => {
            const npc = new NPC(this.scene, config);
            this.npcs.push(npc);
        });
        
        console.log(`Spawned ${this.npcs.length} NPCs in ${region}`);
    }
    
    clearNPCs() {
        this.npcs.forEach(npc => npc.destroy());
        this.npcs = [];
    }
    
    update(player) {
        if (!player) return;
        
        // Update all NPCs (for idle animations and interaction indicators)
        this.npcs.forEach(npc => {
            npc.update(player.x, player.y);
        });
        
        // Handle interaction input
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            if (this.isDialogueOpen) {
                // Advance dialogue or close if at end
                this.advanceDialogue();
            } else {
                // Try to interact with nearby NPC
                this.tryInteract(player);
            }
        }
        
        // Handle close dialogue
        if (Phaser.Input.Keyboard.JustDown(this.closeKey) && this.isDialogueOpen) {
            this.closeDialogue();
        }
    }
    
    tryInteract(player) {
        // Find closest NPC within interaction range
        let closestNPC = null;
        let closestDistance = Infinity;
        
        this.npcs.forEach(npc => {
            if (npc.canInteract(player.x, player.y)) {
                const distance = Phaser.Math.Distance.Between(npc.x, npc.y, player.x, player.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestNPC = npc;
                }
            }
        });
        
        if (closestNPC) {
            this.startInteraction(closestNPC);
        }
    }
    
    startInteraction(npc) {
        const interactionData = npc.interact();
        const dialogueData = getNPCDialogue(interactionData.dialogueId);
        
        this.currentDialogueLines = dialogueData.dialogues;
        this.currentNPCName = dialogueData.name;
        this.currentDialogueIndex = 0;
        
        this.openDialogue();
        this.displayCurrentDialogue();
        
        // Play interaction sound
        if (this.audioManager) {
            this.audioManager.playSound('menu-select');
        }
    }
    
    openDialogue() {
        this.isDialogueOpen = true;
        this.dialogueContainer.setVisible(true);
        
        // Pause game physics if needed (optional - keeps game active during dialogue)
        // this.scene.physics.pause();
        
        // Emit event so other systems know dialogue is open
        this.scene.events.emit('dialogue-opened');
    }
    
    closeDialogue() {
        this.isDialogueOpen = false;
        this.dialogueContainer.setVisible(false);
        this.currentDialogueIndex = 0;
        this.currentDialogueLines = [];
        
        // Resume game physics
        // this.scene.physics.resume();
        
        // Play close sound
        if (this.audioManager) {
            this.audioManager.playSound('menu-back');
        }
        
        // Emit event
        this.scene.events.emit('dialogue-closed');
    }
    
    advanceDialogue() {
        this.currentDialogueIndex++;
        
        if (this.currentDialogueIndex >= this.currentDialogueLines.length) {
            // Reached end of dialogue - close it
            this.closeDialogue();
        } else {
            // Show next line
            this.displayCurrentDialogue();
            
            // Play advance sound
            if (this.audioManager) {
                this.audioManager.playSound('menu-hover');
            }
        }
    }
    
    displayCurrentDialogue() {
        if (this.currentDialogueIndex < this.currentDialogueLines.length) {
            const line = this.currentDialogueLines[this.currentDialogueIndex];
            this.dialogueText.setText(line);
            this.npcNameText.setText(this.currentNPCName);
            
            // Update continue prompt if on last line
            if (this.currentDialogueIndex === this.currentDialogueLines.length - 1) {
                this.continuePrompt.setText('[E] Close  [ESC] Close');
            } else {
                this.continuePrompt.setText('[E] Continue  [ESC] Close');
            }
        }
    }
    
    getNPCs() {
        return this.npcs;
    }
    
    shutdown() {
        this.closeDialogue();
        this.clearNPCs();
        
        if (this.dialogueContainer) {
            this.dialogueContainer.destroy();
        }
    }
}
