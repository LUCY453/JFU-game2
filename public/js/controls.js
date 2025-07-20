class PlayerControls {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.rotationSpeed = 0.05;  // 增加旋转速度
        this.initControls();
        this.initCamera();
        this.initDebugInfo();
    }

    initControls() {
        // 更可靠的事件监听
        this.activeKeys = new Set();
        
        document.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
                this.activeKeys.add(e.code);
                console.log(`Key pressed: ${e.code}`);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
                this.activeKeys.delete(e.code);
            }
        });
    }

    initCamera() {
        // 设置默认第三人称视角
        if (this.game.camera && this.game.player) {
            this.game.camera.position.set(0, 2, -3); // 在角色后上方
            this.game.camera.lookAt(this.game.player.position);
            console.log('摄像机位置已初始化');
        }
    }

    update() {
        if (!this.game.player) return;

        // 更精确的旋转控制
        if (this.activeKeys.has('ArrowLeft') || this.activeKeys.has('KeyA')) {
            this.game.player.rotation.y += this.rotationSpeed;
        }
        if (this.activeKeys.has('ArrowRight') || this.activeKeys.has('KeyD')) {
            this.game.player.rotation.y -= this.rotationSpeed;
        }

        // 更新摄像机跟随
        if (this.game.camera) {
            const playerPos = this.game.player.position;
            this.game.camera.position.x = playerPos.x;
            this.game.camera.position.z = playerPos.z - 3;
            this.game.camera.lookAt(playerPos);
        }

        this.updateDebugInfo();
    }

    initDebugInfo() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.style.position = 'fixed';
        this.debugPanel.style.top = '10px';
        this.debugPanel.style.left = '10px';
        this.debugPanel.style.background = 'rgba(0,0,0,0.7)';
        this.debugPanel.style.color = 'white';
        this.debugPanel.style.padding = '10px';
        this.debugPanel.style.borderRadius = '5px';
        this.debugPanel.style.zIndex = '1000';
        document.body.appendChild(this.debugPanel);
    }

    updateDebugInfo() {
        this.debugPanel.innerHTML = `
            <h3>控制调试</h3>
            <p>活动按键: ${Array.from(this.activeKeys).join(', ')}</p>
            <p>玩家旋转: ${this.game.player?.rotation.y.toFixed(2)}</p>
            <p>摄像机位置: ${this.game.camera?.position.x.toFixed(1)}, 
                          ${this.game.camera?.position.y.toFixed(1)}, 
                          ${this.game.camera?.position.z.toFixed(1)}</p>
        `;
    }
}