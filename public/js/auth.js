// 认证模块 v2
(function() {
    // 模块私有变量
    const authState = {
        isAuthenticated: false,
        user: null
    };

    // 公共接口
    const authModule = {
        // 初始化认证系统
        init: async function() {
            try {
                console.log('[认证] 初始化开始');
                // 检查本地存储的token
                const token = localStorage.getItem('authToken');
                if (token) {
                    await this.validateToken(token);
                }
                console.log('[认证] 初始化完成');
                return true;
            } catch (error) {
                console.error('[认证] 初始化失败:', error);
                throw error;
            }
        },

        // 验证token有效性
        validateToken: async function(token) {
            return new Promise((resolve) => {
                // 模拟API验证
                setTimeout(() => {
                    authState.isAuthenticated = true;
                    authState.user = { name: '测试用户' };
                    console.log('[认证] Token验证成功');
                    resolve(true);
                }, 500);
            });
        },

        // 用户登录
        login: async function(credentials) {
            try {
                console.log('[认证] 登录尝试:', credentials.username);
                // 模拟API调用
                await new Promise(resolve => setTimeout(resolve, 800));
                
                if (credentials.username && credentials.password) {
                    authState.isAuthenticated = true;
                    authState.user = { name: credentials.username };
                    localStorage.setItem('authToken', 'demo-token');
                    console.log('[认证] 登录成功');
                    return true;
                }
                throw new Error('无效的凭证');
            } catch (error) {
                console.error('[认证] 登录失败:', error);
                throw error;
            }
        },

        // 获取当前用户
        getCurrentUser: function() {
            return authState.user;
        },

        // 检查登录状态
        isLoggedIn: function() {
            return authState.isAuthenticated;
        }
    };

    // 导出模块
    if (typeof defineModule === 'function') {
        defineModule('auth', () => authModule);
    } else {
        window.authModule = authModule;
    }
})();