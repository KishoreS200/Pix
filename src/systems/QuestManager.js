/**
 * QuestManager.js
 * Manages quest tracking, objectives, and completion
 */

import { getQuestConfig } from '../utils/QuestConfig';

export default class QuestManager {
    constructor(scene) {
        this.scene = scene;
        
        // Quest state
        this.activeQuests = new Map(); // questId -> quest data with current progress
        this.completedQuests = new Set();
        
        // Quest UI elements
        this.questUI = null;
        this.questText = null;
        this.questContainer = null;
        
        // Audio
        this.audioManager = scene.audioManager;
        
        // Create quest UI
        this.createQuestUI();
        
        // Set up event listeners for quest objectives
        this.setupQuestEventListeners();
        
        console.log('QuestManager initialized');
    }
    
    createQuestUI() {
        const { width, height } = this.scene.cameras.main;
        
        // Quest display container (top-left, below region text)
        this.questContainer = this.scene.add.container(10, 70);
        this.questContainer.setScrollFactor(0);
        this.questContainer.setDepth(50);
        this.questContainer.setVisible(false);
        
        // Quest background
        const questBg = this.scene.add.graphics();
        questBg.fillStyle(0x001a1a, 0.9);
        questBg.fillRoundedRect(0, 0, 280, 60, 8);
        questBg.lineStyle(2, 0x00ffff, 0.8);
        questBg.strokeRoundedRect(0, 0, 280, 60, 8);
        this.questContainer.add(questBg);
        
        // Quest title
        this.questTitle = this.scene.add.text(15, 10, 'Active Quest:', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ffff',
            fontStyle: 'bold'
        });
        this.questContainer.add(this.questTitle);
        
        // Quest objective
        this.questText = this.scene.add.text(15, 30, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            wordWrap: { width: 250 }
        });
        this.questContainer.add(this.questText);
        
        // Quest complete indicator (hidden by default)
        this.questCompleteIndicator = this.scene.add.text(240, 25, '✓', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.questCompleteIndicator.setVisible(false);
        this.questContainer.add(this.questCompleteIndicator);
    }
    
    setupQuestEventListeners() {
        // Enemy killed events
        this.scene.events.on('enemy-defeated', (data) => {
            this.onEnemyDefeated(data);
        });
        
        // Boss defeated events
        this.scene.events.on('boss-defeated', (data) => {
            this.onBossDefeated(data);
        });
        
        // Item collected events
        this.scene.events.on('potion-collected', () => {
            this.onPotionCollected();
        });
        
        // Region change events
        this.scene.events.on('regionchanged', (data) => {
            this.onRegionChanged(data);
        });
    }
    
    /**
     * Accept a quest from an NPC
     */
    acceptQuest(questId) {
        // Check if quest is already active
        if (this.activeQuests.has(questId)) {
            console.log(`Quest ${questId} is already active`);
            return false;
        }
        
        // Check if quest is already completed
        if (this.completedQuests.has(questId)) {
            console.log(`Quest ${questId} is already completed`);
            return false;
        }
        
        const questConfig = getQuestConfig(questId);
        if (!questConfig) {
            console.error(`Quest config not found: ${questId}`);
            return false;
        }
        
        // Clone the quest config to track progress
        const quest = {
            ...questConfig,
            objectives: questConfig.objectives.map(obj => ({
                ...obj,
                current: obj.current || 0
            }))
        };
        
        this.activeQuests.set(questId, quest);
        
        // Play quest accept sound
        if (this.audioManager) {
            this.audioManager.playSound('menu-select');
        }
        
        // Show quest started notification
        this.showQuestNotification(quest.title, 'Quest Started!');
        
        // Update quest UI
        this.updateQuestUI();
        
        console.log(`Quest accepted: ${quest.title}`);
        return true;
    }
    
    /**
     * Complete a quest (player returns to NPC)
     */
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        
        if (!quest) {
            console.log(`Quest ${questId} is not active`);
            return false;
        }
        
        // Check if all objectives are complete
        const allComplete = quest.objectives.every(obj => obj.current >= obj.count);
        
        if (!allComplete) {
            console.log(`Quest ${questId} objectives not complete`);
            return false;
        }
        
        // Grant rewards
        if (quest.rewards.coins) {
            this.scene.playerCoins += quest.rewards.coins;
            this.scene.updateCoinText();
        }
        
        if (quest.rewards.xp) {
            if (this.scene.progressionManager) {
                this.scene.progressionManager.addXP(quest.rewards.xp);
            }
        }
        
        // Play quest complete sound
        if (this.audioManager) {
            this.audioManager.playSound('coin-pickup');
        }
        
        // Show quest completion notification
        this.showQuestCompleteNotification(quest.title, quest.rewards);
        
        // Move quest to completed
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        
        // Update quest UI
        this.updateQuestUI();
        
        console.log(`Quest completed: ${quest.title}`);
        return true;
    }
    
    /**
     * Check if a quest can be turned in
     */
    canTurnInQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;
        
        return quest.objectives.every(obj => obj.current >= obj.count);
    }
    
    /**
     * Get active quest data
     */
    getActiveQuest(questId) {
        return this.activeQuests.get(questId);
    }
    
    /**
     * Get all active quests
     */
    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }
    
    /**
     * Get quests that can be completed
     */
    getCompletableQuests() {
        return this.getActiveQuests().filter(quest => 
            quest.objectives.every(obj => obj.current >= obj.count)
        );
    }
    
    /**
     * Check if player has any quests from an NPC
     */
    hasQuestsFromNPC(npcId) {
        return this.getActiveQuests().some(quest => quest.giver === npcId);
    }
    
    /**
     * Get active quests from an NPC
     */
    getQuestsFromNPC(npcId) {
        return this.getActiveQuests().filter(quest => quest.giver === npcId);
    }
    
    /**
     * Handle enemy defeat for kill objectives
     */
    onEnemyDefeated(data) {
        const enemyType = data.enemy.enemyType;
        const region = this.scene.currentRegion;
        
        this.activeQuests.forEach((quest, questId) => {
            quest.objectives.forEach(obj => {
                if (obj.type === 'kill' && obj.current < obj.count) {
                    // Check if objective matches
                    const matchesTarget = obj.target === 'any-enemy' || 
                                         obj.target === enemyType;
                    const matchesRegion = obj.region === 'any' || 
                                         obj.region === region;
                    
                    if (matchesTarget && matchesRegion) {
                        obj.current++;
                        
                        // Show progress notification
                        this.showQuestProgress(quest.title, obj.current, obj.count);
                        
                        // Update quest UI
                        this.updateQuestUI();
                        
                        // Check if quest is complete
                        if (quest.objectives.every(o => o.current >= o.count)) {
                            this.showQuestReadyNotification(quest.title);
                        }
                    }
                }
            });
        });
    }
    
    /**
     * Handle boss defeat for boss objectives
     */
    onBossDefeated(data) {
        const bossName = data.name;
        const region = this.scene.currentRegion;
        
        this.activeQuests.forEach((quest, questId) => {
            quest.objectives.forEach(obj => {
                if (obj.type === 'defeat-boss' && obj.current < obj.count) {
                    // Normalize boss name for comparison
                    const questTarget = obj.target.toLowerCase().replace(/_/g, '-');
                    const defeatedName = bossName.toLowerCase().replace(/_/g, '-');
                    
                    if (questTarget === defeatedName && obj.region === region) {
                        obj.current++;
                        
                        // Show progress notification
                        this.showQuestProgress(quest.title, obj.current, obj.count);
                        
                        // Update quest UI
                        this.updateQuestUI();
                        
                        // Check if quest is complete
                        if (quest.objectives.every(o => o.current >= o.count)) {
                            this.showQuestReadyNotification(quest.title);
                        }
                    }
                }
            });
        });
    }
    
    /**
     * Handle potion collection for fetch objectives
     */
    onPotionCollected() {
        this.activeQuests.forEach((quest, questId) => {
            quest.objectives.forEach(obj => {
                if (obj.type === 'collect' && obj.target === 'health-potion' && obj.current < obj.count) {
                    obj.current++;
                    
                    // Show progress notification
                    this.showQuestProgress(quest.title, obj.current, obj.count);
                    
                    // Update quest UI
                    this.updateQuestUI();
                    
                    // Check if quest is complete
                    if (quest.objectives.every(o => o.current >= o.count)) {
                        this.showQuestReadyNotification(quest.title);
                    }
                }
            });
        });
    }
    
    /**
     * Handle region change for exploration objectives
     */
    onRegionChanged(data) {
        const newRegion = data.newRegion;
        
        this.activeQuests.forEach((quest, questId) => {
            quest.objectives.forEach(obj => {
                if (obj.type === 'explore' && obj.current < obj.count) {
                    if (obj.region === newRegion) {
                        obj.current++;
                        
                        // Show progress notification
                        this.showQuestProgress(quest.title, obj.current, obj.count);
                        
                        // Update quest UI
                        this.updateQuestUI();
                        
                        // Check if quest is complete
                        if (quest.objectives.every(o => o.current >= o.count)) {
                            this.showQuestReadyNotification(quest.title);
                        }
                    }
                }
            });
        });
    }
    
    /**
     * Update quest UI display
     */
    updateQuestUI() {
        const activeQuests = this.getActiveQuests();
        
        if (activeQuests.length === 0) {
            this.questContainer.setVisible(false);
            return;
        }
        
        // Show the first active quest
        const quest = activeQuests[0];
        this.questContainer.setVisible(true);
        this.questTitle.setText(quest.title);
        
        // Show objectives progress
        const objective = quest.objectives[0];
        const progress = `${objective.current}/${objective.count}`;
        
        let objectiveText = '';
        if (objective.type === 'kill') {
            const target = objective.target === 'any-enemy' ? 'enemies' : objective.target;
            objectiveText = `Defeat ${target}: ${progress}`;
        } else if (objective.type === 'collect') {
            objectiveText = `Collect ${objective.target}: ${progress}`;
        } else if (objective.type === 'explore') {
            objectiveText = `Explore ${objective.target}: ${progress}`;
        } else if (objective.type === 'defeat-boss') {
            objectiveText = `Defeat ${objective.target}: ${progress}`;
        }
        
        this.questText.setText(objectiveText);
        
        // Show complete indicator if quest is ready to turn in
        const canTurnIn = this.canTurnInQuest(quest.questId);
        this.questCompleteIndicator.setVisible(canTurnIn);
        
        if (canTurnIn) {
            this.questText.setColor('#00ff00');
        } else {
            this.questText.setColor('#ffffff');
        }
    }
    
    /**
     * Show quest notification
     */
    showQuestNotification(title, subtitle) {
        const { width } = this.scene.cameras.main;
        
        const notification = this.scene.add.container(width / 2, 100);
        notification.setScrollFactor(0);
        notification.setDepth(200);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x00ffff, 0.9);
        bg.fillRoundedRect(-150, -25, 300, 50, 10);
        notification.add(bg);
        
        const titleText = this.scene.add.text(0, -8, title, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        notification.add(titleText);
        
        const subtitleText = this.scene.add.text(0, 8, subtitle, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#000033'
        }).setOrigin(0.5);
        notification.add(subtitleText);
        
        // Animate and remove
        this.scene.tweens.add({
            targets: notification,
            y: 80,
            alpha: 0,
            duration: 3000,
            ease: 'Quad.easeOut',
            onComplete: () => {
                notification.destroy();
            }
        });
    }
    
    /**
     * Show quest progress notification
     */
    showQuestProgress(title, current, total) {
        const { width } = this.scene.cameras.main;
        
        const progress = this.scene.add.text(width / 2, 120, `${title}: ${current}/${total}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);
        
        this.scene.tweens.add({
            targets: progress,
            y: 100,
            alpha: 0,
            duration: 2000,
            ease: 'Quad.easeOut',
            onComplete: () => {
                progress.destroy();
            }
        });
    }
    
    /**
     * Show quest ready notification
     */
    showQuestReadyNotification(title) {
        const { width } = this.scene.cameras.main;
        
        const notification = this.scene.add.text(width / 2, 100, `${title} - Return to Quest Giver!`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        
        this.scene.tweens.add({
            targets: notification,
            y: 80,
            alpha: 0,
            duration: 3000,
            ease: 'Quad.easeOut',
            onComplete: () => {
                notification.destroy();
            }
        });
        
        // Play notification sound
        if (this.audioManager) {
            this.audioManager.playSound('coin-pickup');
        }
    }
    
    /**
     * Show quest complete notification
     */
    showQuestCompleteNotification(title, rewards) {
        const { width, height } = this.scene.cameras.main;
        
        const notification = this.scene.add.container(width / 2, height / 2);
        notification.setScrollFactor(0);
        notification.setDepth(300);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x001a1a, 0.95);
        bg.fillRoundedRect(-200, -80, 400, 160, 15);
        bg.lineStyle(3, 0x00ff00, 1);
        bg.strokeRoundedRect(-200, -80, 400, 160, 15);
        notification.add(bg);
        
        const titleText = this.scene.add.text(0, -50, 'Quest Complete!', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        notification.add(titleText);
        
        const questName = this.scene.add.text(0, -15, title, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        notification.add(questName);
        
        const rewardText = this.scene.add.text(0, 20, `+${rewards.coins} Coins | +${rewards.xp} XP`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        notification.add(rewardText);
        
        // Animate and remove
        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: height / 2 - 50,
            duration: 3000,
            ease: 'Quad.easeOut',
            delay: 1000,
            onComplete: () => {
                notification.destroy();
            }
        });
    }
    
    shutdown() {
        this.activeQuests.clear();
        this.completedQuests.clear();
        
        if (this.questContainer) {
            this.questContainer.destroy();
        }
    }
}
