// 调试工具初始化
class GameDebugger {
    constructor() {
        this.initDebugTools();
        this.checkGameLoad();
    }

    initDebugTools() {
        // 创建强制显示设置按钮
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '显示设置面板';
        debugBtn.style.position = 'fixed';
        debugBtn.style.top = '10px';
        debugBtn.style.right = '10px';
        debugBtn.style.zIndex = '9999';
        debugBtn.style.padding = '10px';
        debugBtn.style.background = '#f00';
        debugBtn.style.color = '#fff';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '5px';
        
        debugBtn.addEventListener('click', () => {
            if (window.gameInstance) {
                new GameSettings(window.gameInstance);
                console.log('强制初始化设置面板完成');
            } else {
                console.error('游戏实例未找到');
            }
        });

        document.body.appendChild(debugBtn);
    }

    checkGameLoad() {
        // 检查游戏加载状态
        const checkInterval = setInterval(() => {
            if (window.gameInstance) {
                console.log('游戏实例已加载:', window.gameInstance);
                clearInterval(checkInterval);
                
                // 初始化控制
                new PlayerControls(window.gameInstance);
                console.log('控制模块初始化完成');
            }
        }, 500);
    }
}

// 立即执行调试
new GameDebugger();