// 基础系统核心
class GameSystem {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        window.onerror = (msg, url, line, col, error) => {
            console.error('全局错误:', error);
            this.showError('系统错误，请刷新页面');
            return true;
        };
    }

    async loadModule(name) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `js/${name}.js?t=${Date.now()}`;
            
            // 双重检查机制
            const checkModule = () => {
                const module = window[name + 'Module'] || 
                              (window.gameSystem && window.gameSystem.modules[name]);
                if (module) {
                    this.modules[name] = module;
                    console.log(`[系统] ${name}模块加载成功`);
                    resolve();
                    return true;
                }
                return false;
            };

            // 立即检查是否已加载
            if (checkModule()) return;

            script.onload = () => {
                if (!checkModule()) {
                    reject(new Error(`${name}模块未正确导出`));
                }
            };

            script.onerror = () => {
                reject(new Error(`${name}脚本加载失败`));
            };

            // 添加超时检查
            setTimeout(() => {
                if (!this.modules[name]) {
                    reject(new Error(`${name}模块加载超时`));
                }
            }, 5000);

            document.body.appendChild(script);
        });
    }

    async init() {
        try {
            // 加载必要模块
            await this.loadModule('auth');
            await this.loadModule('socket');
            await this.loadModule('ui');

            // 初始化模块
            await this.modules.auth.init();
            await this.modules.socket.connect();
            await this.modules.ui.setup();

            this.initialized = true;
            console.log('系统初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError(error.message);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

// 启动系统
document.addEventListener('DOMContentLoaded', () => {
    const system = new GameSystem();
    system.init();
});