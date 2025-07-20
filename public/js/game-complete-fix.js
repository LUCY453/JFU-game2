// 完整的游戏修复脚本
console.log('加载完整游戏修复脚本');

// 重写游戏初始化函数
function fixCompleteGameSystem() {
    // 1. 修复gameState初始化
    window.gameState = {
        players: [{
            id: currentUser ? currentUser.id : 'player1',
            username: currentUser ? currentUser.username : '玩家',
            role: 'runner',
            lives: 3,
            safeZoneUses: 2,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }],
        timeLeft: 300,
        status: 'playing'
    };

    // 2. 重写GameRenderer类的关键方法
    if (typeof GameRenderer !== 'undefined') {
        // 修复setupGame方法
        GameRenderer.prototype.setupGame = function(gameState) {
            console.log('修复版setupGame开始');
            
            // 清除现有玩家
            this.players.forEach(player => {
                this.scene.remove(player);
            });
            this.players.clear();

            // 创建玩家
            gameState.players.forEach(playerData => {
                const player = this.createStickFigure(playerData.role);
                
                // 确保玩家在地面上 - 关键修复
                player.position.set(0, 0, 0);
                console.log('玩家位置设置为:', player.position);
                
                player.userData = playerData;
                this.scene.add(player);
                this.players.set(playerData.id, player);

                // 设置主玩家
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (playerData.id === currentUser.id || this.players.size === 1) {
                    this.player = player;
                    console.log('主玩家设置完成，位置:', this.player.position);
                }
            });

            // 设置相机初始位置 - 关键修复
            if (this.player) {
                this.camera.position.set(0, 5, 10);
                this.camera.lookAt(0, 0, 0);
                console.log('相机初始位置设置完成');
            }

            // 添加建筑和安全区
            this.addSchoolBuildings();
            this.addSafeZones();
        };

        // 修复update方法 - 相机跟随
        GameRenderer.prototype.update = function() {
            if (!this.player) return;

            // 确保玩家在地面上
            if (this.player.position.y !== 0) {
                this.player.position.y = 0;
            }

            // 获取游戏设置
            const settings = getGameSettings();

            // 修复相机跟随逻辑
            if (this.isFirstPerson) {
                // 第一人称视角
                this.camera.position.copy(this.player.position);
                this.camera.position.y = 1.6; // 眼部高度
                this.camera.rotation.copy(this.player.rotation);
            } else {
                // 第三人称视角 - 使用设置中的参数
                const playerPos = this.player.position;
                const cameraDistance = settings.cameraDistance;
                const cameraHeight = settings.cameraHeight;
                
                // 计算相机位置
                const angle = this.player.rotation.y || 0;
                const offsetX = Math.sin(angle) * cameraDistance;
                const offsetZ = Math.cos(angle) * cameraDistance;
                
                this.camera.position.set(
                    playerPos.x + offsetX,
                    playerPos.y + cameraHeight,
                    playerPos.z + offsetZ
                );
                
                // 相机看向玩家
                this.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
            }
        };

        // 修复移动方法
        GameRenderer.prototype.movePlayerForward = function(speed) {
            if (!this.player) return;

            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.player.quaternion);
            
            const newPosition = this.player.position.clone();
            newPosition.add(direction.multiplyScalar(speed));
            newPosition.y = 0; // 确保在地面上
            
            // 边界检查
            newPosition.x = Math.max(-100, Math.min(100, newPosition.x));
            newPosition.z = Math.max(-100, Math.min(100, newPosition.z));
            
            this.player.position.copy(newPosition);
        };

        GameRenderer.prototype.movePlayerRelative = function(strafe, forward) {
            if (!this.player) return;

            const forwardDir = new THREE.Vector3(0, 0, -1);
            const rightDir = new THREE.Vector3(1, 0, 0);
            
            forwardDir.applyQuaternion(this.player.quaternion);
            rightDir.applyQuaternion(this.player.quaternion);

            const movement = new THREE.Vector3();
            movement.add(forwardDir.multiplyScalar(forward));
            movement.add(rightDir.multiplyScalar(strafe));

            const newPosition = this.player.position.clone();
            newPosition.add(movement);
            newPosition.y = 0; // 确保在地面上
            
            // 边界检查
            newPosition.x = Math.max(-100, Math.min(100, newPosition.x));
            newPosition.z = Math.max(-100, Math.min(100, newPosition.z));
            
            this.player.position.copy(newPosition);
        };

        GameRenderer.prototype.rotatePlayer = function(deltaX, deltaY) {
            if (!this.player) return;
            this.player.rotation.y += deltaX;
        };
    }

    // 3. 修复游戏循环
    window.gameLoop = function() {
        if (gameRenderer && document.getElementById('gameScreen').classList.contains('active')) {
            try {
                // 处理移动
                handleMovement();
                
                // 更新渲染器
                gameRenderer.update();
                gameRenderer.render();
                
                requestAnimationFrame(gameLoop);
            } catch (error) {
                console.error('游戏循环错误:', error);
                requestAnimationFrame(gameLoop);
            }
        }
    };

    // 4. 修复游戏初始化
    window.initGame3D = function() {
        console.log('修复版initGame3D开始');
        
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('游戏画布未找到');
            return;
        }
        
        try {
            gameRenderer = new GameRenderer(canvas);
            gameRenderer.init();
            
            // 确保gameState存在
            if (!window.gameState) {
                window.gameState = {
                    players: [{
                        id: currentUser ? currentUser.id : 'player1',
                        username: currentUser ? currentUser.username : '玩家',
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
            
            gameRenderer.setupGame(gameState);
            
            // 同步围栏设置
            if (window.fenceSystem) {
                window.fenceSystem.syncFenceToGame();
            }
            
            console.log('游戏初始化完成');
            gameLoop();
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            showMessage('游戏初始化失败，请刷新页面重试', 'error');
        }
    };

    console.log('完整游戏系统修复完成');
}

// 在DOM加载完成后应用修复
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixCompleteGameSystem);
} else {
    fixCompleteGameSystem();
}

// 导出修复函数
window.fixCompleteGameSystem = fixCompleteGameSystem;