class GameSettings {
    constructor(gameInstance) {
        // 确保游戏实例可全局访问
        window.gameInstance = gameInstance || window.gameInstance;
        this.game = window.gameInstance;
        
        // 初始化默认参数
        this.game.rotationSpeed = this.game.rotationSpeed || 0.05;
        this.game.cameraDistance = this.game.cameraDistance || 5;
        this.game.cameraHeight = this.game.cameraHeight || 2;
        
        this.initSettingsPanel();
        
        // 添加参数变更事件
        this.addParameterListeners();
    }
    
    addParameterListeners() {
        // 监听旋转速度变化
        Object.defineProperty(this.game, 'rotationSpeed', {
            set: function(value) {
                this._rotationSpeed = value;
                console.log('Rotation speed updated to:', value);
            },
            get: function() {
                return this._rotationSpeed || 0.05;
            }
        });
        
        // 监听相机参数变化
        Object.defineProperty(this.game, 'cameraDistance', {
            set: function(value) {
                this._cameraDistance = value;
                console.log('Camera distance updated to:', value);
            },
            get: function() {
                return this._cameraDistance || 5;
            }
        });
        
        Object.defineProperty(this.game, 'cameraHeight', {
            set: function(value) {
                this._cameraHeight = value;
                console.log('Camera height updated to:', value);
            },
            get: function() {
                return this._cameraHeight || 2;
            }
        });
    }

    initSettingsPanel() {
        // 确保面板容器存在
        if (!document.getElementById('game-settings-container')) {
            const container = document.createElement('div');
            container.id = 'game-settings-container';
            document.body.appendChild(container);
        }

        // 创建面板并增强样式
        this.createEnhancedPanel();

        // 添加面板存在性检查
        this.ensurePanelVisibility();
    }

    createEnhancedPanel() {
        // 创建设置面板
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.id = 'gameSettings';
        this.settingsPanel.style.position = 'fixed';
        this.settingsPanel.style.bottom = '20px';
        this.settingsPanel.style.right = '20px';
        this.settingsPanel.style.padding = '10px';
        this.settingsPanel.style.background = 'rgba(0,0,0,0.7)';
        this.settingsPanel.style.color = 'white';
        this.settingsPanel.style.borderRadius = '5px';
        this.settingsPanel.style.zIndex = '1000';
        
        // 添加设置内容
        this.settingsPanel.innerHTML = `
            <h3 style="margin-top:0">游戏设置</h3>
            <div>
                <label>旋转速度: 
                    <input type="range" id="rotationSpeed" min="0.01" max="0.2" step="0.01" value="${this.game.rotationSpeed || 0.05}">
                    <span id="speedValue">${this.game.rotationSpeed || 0.05}</span>
                </label>
            </div>
            <div>
                <label>视角距离: 
                    <input type="range" id="cameraDistance" min="3" max="10" step="0.5" value="${this.game.cameraDistance || 5}">
                    <span id="distanceValue">${this.game.cameraDistance || 5}</span>
                </label>
            </div>
            <div>
                <label>视角高度: 
                    <input type="range" id="cameraHeight" min="1" max="5" step="0.5" value="${this.game.cameraHeight || 2}">
                    <span id="heightValue">${this.game.cameraHeight || 2}</span>
                </label>
            </div>
        `;
        
        // 添加事件监听
        this.settingsPanel.querySelector('#rotationSpeed').addEventListener('input', (e) => {
            this.game.rotationSpeed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.game.rotationSpeed;
        });
        
        this.settingsPanel.querySelector('#cameraDistance').addEventListener('input', (e) => {
            this.game.cameraDistance = parseFloat(e.target.value);
            document.getElementById('distanceValue').textContent = this.game.cameraDistance;
        });
        
        this.settingsPanel.querySelector('#cameraHeight').addEventListener('input', (e) => {
            this.game.cameraHeight = parseFloat(e.target.value);
            document.getElementById('heightValue').textContent = this.game.cameraHeight;
        });
        
        document.body.appendChild(this.settingsPanel);
    }
}

// 自动初始化设置面板
document.addEventListener('DOMContentLoaded', () => {
    if (window.gameInstance) {
        new GameSettings(window.gameInstance);
    } else {
        console.warn('Game instance not found, settings panel disabled');
    }
});