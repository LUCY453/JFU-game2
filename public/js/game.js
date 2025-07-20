// 游戏房间状态
const gameState = {
    isHost: false,
    isReady: false,
    players: []
};

// 初始化游戏房间
function initGameRoom() {
    const startBtns = document.querySelectorAll('#startGameBtn, #roomControls #startGameBtn');
    
    startBtns.forEach(btn => {
        // 只有房主能看到开始按钮
        btn.style.display = gameState.isHost ? 'block' : 'none';
    // 移除人数限制条件
    if (gameState.isHost) btn.disabled = false;
    });
}

// 开始游戏
function startGame() {
    // 检查登录状态
    if (!authModule || !authModule.isLoggedIn()) {
        alert('请先登录');
        return;
    }
    
    // 检查人机验证
    if (!authModule.validateCaptcha()) {
        alert('请先完成人机验证');
        return;
    }

    console.log('游戏开始');
    // 隐藏所有开始游戏按钮
    document.querySelectorAll('#startGameBtn, #roomControls #startGameBtn').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // 显示游戏界面
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('gameRoomScreen').classList.remove('active');
    
    // 初始化游戏逻辑
    initGame();
}

// 初始化游戏
function initGame() {
    try {
        // 初始化Three.js场景
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // 设置渲染器
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x87CEEB);
        document.getElementById('gameContainer').appendChild(renderer.domElement);
    
        // 资源预加载
        const loader = new THREE.TextureLoader();
        const loadPromise = new Promise((resolve) => {
          loader.load('/textures/loading.jpg', (texture) => {
            showLoadingScreen(texture);
            resolve();
          });
        });
    
        // 主循环
        loadPromise.then(() => {
          initGameObjects();
          // 确保player对象已创建后再初始化控制器
          if (game.player) {
            game.controls = new PlayerControls(game);
            console.log('控制器初始化完成');
          }
          animate();
        });

        // 游戏主循环
        function animate() {
          requestAnimationFrame(animate);
          if (game.controls) {
            game.controls.update();
          }
          renderer.render(scene, camera);
        }
    
        // 窗口尺寸适配
        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
    
    } catch (error) {
        console.error('初始化失败:', error);
        showErrorScreen('游戏初始化失败，请刷新重试');
    }
}

// 当房间创建成功时调用
function onRoomCreated() {
    gameState.isHost = true;
    initGameRoom();
}

// 当加入房间时调用
function onRoomJoined() {
    gameState.isHost = false;
    initGameRoom();
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否在游戏房间中
    if (document.getElementById('gameRoomScreen')) {
        initGameRoom();
    }
});