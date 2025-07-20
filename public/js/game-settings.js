// 游戏设置管理器
class GameSettingsManager {
    constructor() {
        this.settings = {
            cameraDistance: 4,
            cameraHeight: 2.5,
            moveSpeed: 0.3
        };
        
        this.isSettingsOpen = false;
        this.initializeSettings();
    }

    initializeSettings() {
        // 从本地存储加载设置
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // 等待DOM加载完成后初始化UI
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            this.initializeUI();
        }
    }

    initializeUI() {
        // 设置滑块初始值
        const cameraDistanceSlider = document.getElementById('cameraDistanceSlider');
        const cameraHeightSlider = document.getElementById('cameraHeightSlider');
        const moveSpeedSlider = document.getElementById('moveSpeedSlider');
        
        if (cameraDistanceSlider) {
            cameraDistanceSlider.value = this.settings.cameraDistance;
            document.getElementById('cameraDistanceValue').textContent = this.settings.cameraDistance;
            
            cameraDistanceSlider.addEventListener('input', (e) => {
                this.settings.cameraDistance = parseFloat(e.target.value);
                document.getElementById('cameraDistanceValue').textContent = this.settings.cameraDistance;
                this.saveSettings();
                this.applySettings();
            });
        }
        
        if (cameraHeightSlider) {
            cameraHeightSlider.value = this.settings.cameraHeight;
            document.getElementById('cameraHeightValue').textContent = this.settings.cameraHeight;
            
            cameraHeightSlider.addEventListener('input', (e) => {
                this.settings.cameraHeight = parseFloat(e.target.value);
                document.getElementById('cameraHeightValue').textContent = this.settings.cameraHeight;
                this.saveSettings();
                this.applySettings();
            });
        }
        
        if (moveSpeedSlider) {
            moveSpeedSlider.value = this.settings.moveSpeed;
            document.getElementById('moveSpeedValue').textContent = this.settings.moveSpeed;
            
            moveSpeedSlider.addEventListener('input', (e) => {
                this.settings.moveSpeed = parseFloat(e.target.value);
                document.getElementById('moveSpeedValue').textContent = this.settings.moveSpeed;
                this.saveSettings();
                this.applySettings();
            });
        }
    }

    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }

    applySettings() {
        // 应用设置到游戏渲染器
        if (window.gameRenderer) {
            // 更新相机设置
            window.gameRenderer.cameraDistance = this.settings.cameraDistance;
            window.gameRenderer.cameraHeight = this.settings.cameraHeight;
            
            // 更新移动速度（通过全局变量）
            window.gameSettings = this.settings;
        }
    }

    resetToDefaults() {
        this.settings = {
            cameraDistance: 4,
            cameraHeight: 2.5,
            moveSpeed: 0.3
        };
        
        // 更新UI
        document.getElementById('cameraDistanceSlider').value = this.settings.cameraDistance;
        document.getElementById('cameraDistanceValue').textContent = this.settings.cameraDistance;
        
        document.getElementById('cameraHeightSlider').value = this.settings.cameraHeight;
        document.getElementById('cameraHeightValue').textContent = this.settings.cameraHeight;
        
        document.getElementById('moveSpeedSlider').value = this.settings.moveSpeed;
        document.getElementById('moveSpeedValue').textContent = this.settings.moveSpeed;
        
        this.saveSettings();
        this.applySettings();
    }

    togglePanel() {
        const settingsContent = document.getElementById('settingsContent');
        if (settingsContent) {
            this.isSettingsOpen = !this.isSettingsOpen;
            settingsContent.style.display = this.isSettingsOpen ? 'block' : 'none';
        }
    }
}

// 创建全局设置管理器实例
window.gameSettingsManager = new GameSettingsManager();

// 全局函数供HTML调用
function toggleGameSettings() {
    window.gameSettingsManager.togglePanel();
}

function resetGameSettings() {
    window.gameSettingsManager.resetToDefaults();
    if (window.showMessage) {
        showMessage('设置已重置为默认值', 'success');
    }
}

// 获取当前游戏设置
function getGameSettings() {
    return window.gameSettingsManager ? window.gameSettingsManager.settings : {
        cameraDistance: 4,
        cameraHeight: 2.5,
        moveSpeed: 0.3
    };
}