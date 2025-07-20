// 游戏修复脚本 - 确保游戏正常显示
console.log('游戏修复脚本加载');

// 修复游戏初始化
function fixGameInitialization() {
    // 确保gameState存在
    if (typeof gameState === 'undefined') {
        window.gameState = {
            players: [{
                id: 'player1',
                username: '玩家',
                role: 'runner',
                lives: 3,
                safeZoneUses: 2,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            }],
            timeLeft: 300,
            status: 'playing'
        };
    }
}

// 修复围栏系统
function fixFenceSystem() {
    // 确保围栏系统不会阻止游戏启动
    if (window.fenceSystem) {
        const originalSyncFenceToGame = window.fenceSystem.syncFenceToGame;
        window.fenceSystem.syncFenceToGame = function() {
            try {
                if (originalSyncFenceToGame) {
                    originalSyncFenceToGame.call(this);
                }
            } catch (error) {
                console.warn('围栏同步失败，但不影响游戏:', error);
            }
        };
    }
}

// 修复游戏渲染器
function fixGameRenderer() {
    // 确保GameRenderer类存在且正常工作
    if (typeof GameRenderer !== 'undefined') {
        const originalInit = GameRenderer.prototype.init;
        GameRenderer.prototype.init = function() {
            try {
                if (originalInit) {
                    originalInit.call(this);
                }
                console.log('游戏渲染器初始化成功');
            } catch (error) {
                console.error('游戏渲染器初始化失败:', error);
                // 基本初始化
                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setClearColor(0x87CEEB);
                
                // 基本光照
                const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(50, 50, 50);
                this.scene.add(directionalLight);
                
                // 基本地面
                const groundGeometry = new THREE.PlaneGeometry(200, 200);
                const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
                const ground = new THREE.Mesh(groundGeometry, groundMaterial);
                ground.rotation.x = -Math.PI / 2;
                this.scene.add(ground);
                
                console.log('使用基本游戏渲染器初始化');
            }
        };
    }
}

// 修复游戏循环
function fixGameLoop() {
    if (typeof gameLoop === 'function') {
        const originalGameLoop = gameLoop;
        window.gameLoop = function() {
            try {
                originalGameLoop();
            } catch (error) {
                console.warn('游戏循环错误:', error);
                // 基本游戏循环
                if (gameRenderer && document.getElementById('gameScreen').classList.contains('active')) {
                    gameRenderer.render();
                    requestAnimationFrame(gameLoop);
                }
            }
        };
    }
}

// 应用所有修复
function applyGameFixes() {
    fixGameInitialization();
    fixFenceSystem();
    fixGameRenderer();
    fixGameLoop();
    console.log('游戏修复完成');
}

// 在DOM加载完成后应用修复
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGameFixes);
} else {
    applyGameFixes();
}

// 导出修复函数
window.applyGameFixes = applyGameFixes;