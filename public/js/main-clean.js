// 全局变量
let currentUser = null;
let gameRenderer = null;
let isFirstPerson = false;
let audioManager = null;
let moveState = {
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false
};
let joystickStates = {
    left: { x: 0, y: 0, active: false },
    right: { x: 0, y: 0, active: false }
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
    checkMobileDevice();
    initAudioManager();
});

// 初始化应用
function initializeApp() {
    const token = localStorage.getItem('token');
    if (token) {
        verifyToken(token);
    } else {
        showLogin();
    }
}

// 初始化音频管理器
function initAudioManager() {
    audioManager = new AudioManager();
}

// 验证Token
async function verifyToken(token) {
    try {
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            showMain();
            initSocket();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showLogin();
        }
    } catch (error) {
        console.error('Token验证失败:', error);
        showLogin();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // 移动端触摸事件
    setupMobileControls();

    // 聊天输入框事件
    setupChatInputEvents();

    // 个人偏好设置事件
    setupPreferencesEvents();

    // 头像上传事件
    setupAvatarUploadEvents();

    // 修改主界面按钮事件
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.onclick = showGameModeSelection;
    }
}

// 设置聊天输入事件
function setupChatInputEvents() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendChatMessageFromInput();
            }
        });
    }
}

// 设置个人偏好事件
function setupPreferencesEvents() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');

    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', function () {
            volumeValue.textContent = this.value + '%';
            if (audioManager) {
                audioManager.setVolume(this.value / 100);
            }
        });
    }
}

// 设置头像上传事件
function setupAvatarUploadEvents() {
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                uploadAvatar(file);
            }
        });
    }
}

// 检测移动设备
function checkMobileDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }
}

// 显示不同界面
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    // 播放界面切换音效
    if (audioManager) {
        audioManager.play('click', 0.3);
    }
}

function showLogin() {
    showScreen('loginScreen');
}

function showRegister() {
    showScreen('registerScreen');
}

function showMain() {
    showScreen('mainScreen');
    updateUserInfo();

    // 检查是否是管理员
    if (currentUser && currentUser.isAdmin) {
        addAdminButton();
    }
}

function showRooms() {
    showScreen('roomsScreen');
    loadRoomsList();
}

function createRoom() {
    showScreen('createRoomScreen');
}

function showGameRoom() {
    showScreen('gameRoomScreen');
}

function showProfile() {
    showScreen('profileScreen');
    loadUserProfile();
}

function showForum() {
    showScreen('forumScreen');
    loadForumPosts();
}

function showCreatePost() {
    showScreen('createPostScreen');
}

function showEquipment() {
    showScreen('equipmentScreen');
    loadEquipment();
}

// 显示游戏模式选择界面
function showGameModeSelection() {
    showScreen('gameModeSelectionScreen');
}

// 开始单人游戏
function startSinglePlayerGame() {
    startGameScreen();
    showMessage('单人游戏已开始！');
}

function showRules() {
    showScreen('rulesScreen');
}

function showAdmin() {
    if (currentUser && currentUser.isAdmin) {
        showScreen('adminScreen');
        loadAdminData();
    } else {
        showMessage('权限不足', 'error');
    }
}

// 添加管理员按钮
function addAdminButton() {
    const functionArea = document.querySelector('.function-area');
    if (functionArea && !document.getElementById('adminBtn')) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'adminBtn';
        adminBtn.className = 'btn-function';
        adminBtn.textContent = '🏛️ 管理员控制台';
        adminBtn.onclick = showAdmin;
        functionArea.appendChild(adminBtn);
    }
}

// 用户认证功能
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showMessage('登录成功');
            showMain();
            initSocket();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('登录失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!username || !password || !confirmPassword) {
        showMessage('请填写所有字段', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('密码不匹配', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('密码至少6位', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showMessage('注册成功');
            showMain();
            initSocket();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('注册失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    disconnectSocket();
    showLogin();
    showMessage('已退出登录');
}

// 更新用户信息显示
function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userWelcome').textContent = `欢迎, ${currentUser.username}`;
        document.getElementById('userCoins').textContent = `金币: ${currentUser.coins || 0}`;

        // 更新用户头像初始字母
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            userInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }
}

// 消息提示功能
function showMessage(message, type = 'info') {
    const popup = document.getElementById('messagePopup');
    const messageText = document.getElementById('messageText');

    if (!popup || !messageText) return;

    messageText.textContent = message;
    popup.classList.add('show');

    // 根据类型添加样式
    popup.className = `message-popup show message-${type}`;

    // 3秒后自动关闭
    setTimeout(() => {
        closeMessage();
    }, 3000);
}

function closeMessage() {
    const popup = document.getElementById('messagePopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
}

// 房间管理功能
async function loadRoomsList() {
    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();

        const roomsList = document.getElementById('roomsList');
        roomsList.innerHTML = '';

        if (rooms.length === 0) {
            roomsList.innerHTML = '<div class="no-rooms">暂无房间，创建一个吧！</div>';
            return;
        }

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            roomElement.innerHTML = `
                <h3>${room.name}</h3>
                <p>游戏模式: ${getGameModeName(room.gameMode)}</p>
                <p>玩家: ${room.players}/${room.maxPlayers}</p>
                <p class="room-status status-${room.status}">${getStatusName(room.status)}</p>
                <button onclick="joinRoom('${room.id}')" 
                    ${room.status !== 'waiting' || room.players >= room.maxPlayers ? 'disabled' : ''} 
                    class="btn-primary">
                    ${room.status === 'waiting' && room.players < room.maxPlayers ? '加入房间' : '无法加入'}
                </button>
            `;
            roomsList.appendChild(roomElement);
        });
    } catch (error) {
        showMessage('加载房间列表失败', 'error');
    }
}

function getGameModeName(mode) {
    const names = {
        'classic': '怀旧局',
        'infection': '感染赛',
        'bodyguard': '保镖局'
    };
    return names[mode] || mode;
}

function getStatusName(status) {
    const names = {
        'waiting': '等待中',
        'playing': '游戏中',
        'finished': '已结束'
    };
    return names[status] || status;
}

function refreshRooms() {
    loadRoomsList();
    showMessage('房间列表已刷新');
}

// 游戏相关功能
function startGameScreen() {
    showScreen('gameScreen');
    
    // 延迟初始化游戏，确保界面已显示
    setTimeout(() => {
        initGame();
    }, 100);
}

function exitGame() {
    if (confirm('确定要退出游戏吗？')) {
        // 清理游戏资源
        if (window.game && window.game.renderer) {
            const canvas = window.game.renderer.domElement;
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
        
        // 重置游戏状态
        window.game = null;
        
        // 返回主界面
        showMain();
        showMessage('已退出游戏');
    }
}

function toggleView() {
    if (window.game && window.game.controls) {
        isFirstPerson = !isFirstPerson;
        showMessage(isFirstPerson ? '切换到第一人称视角' : '切换到第三人称视角');
    }
}

function enterSafeZone() {
    showMessage('进入安全区功能暂未实现');
}

function useEquipment() {
    showMessage('使用装备功能暂未实现');
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (input && input.value.trim()) {
        const message = input.value.trim();
        
        // 添加消息到聊天框
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `<strong>${currentUser.username}:</strong> ${message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // 清空输入框
        input.value = '';
    }
}

function sendChatMessageFromInput() {
    sendChatMessage();
}

// 网络连接检查
function checkConnection() {
    showLoading(true);
    
    // 模拟网络检查
    setTimeout(() => {
        showLoading(false);
        showMessage('网络连接正常', 'success');
    }, 1000);
}

// 键盘事件处理
function handleKeyDown(event) {
    // 游戏中的键盘事件由PlayerControls处理
    if (document.getElementById('gameScreen').classList.contains('active')) {
        return;
    }
    
    // 其他界面的快捷键
    switch(event.key) {
        case 'Escape':
            // ESC键返回主界面
            if (!document.getElementById('mainScreen').classList.contains('active')) {
                showMain();
            }
            break;
    }
}

function handleKeyUp(event) {
    // 键盘释放事件处理
}

// 移动端控制设置
function setupMobileControls() {
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 设置移动端虚拟摇杆
        setupVirtualJoysticks();
    }
}

function setupVirtualJoysticks() {
    // 虚拟摇杆实现
    console.log('设置虚拟摇杆');
}

// Socket.IO 初始化
function initSocket() {
    console.log('Socket初始化');
}

function disconnectSocket() {
    console.log('Socket断开连接');
}

// 房间相关功能
async function joinRoom(roomId) {
    showMessage('加入房间功能需要后端支持');
}

function toggleReady() {
    showMessage('准备状态切换功能需要后端支持');
}

function leaveRoom() {
    if (confirm('确定要离开房间吗？')) {
        showRooms();
        showMessage('已离开房间');
    }
}

// 个人主页功能
function loadUserProfile() {
    if (currentUser) {
        document.getElementById('profileUsername').value = currentUser.username;
        document.getElementById('profileCoins').textContent = currentUser.coins || 0;

        // 生成用户头像
        const avatarInitial = document.getElementById('avatarInitial');
        if (avatarInitial) {
            avatarInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }
}

function changeAvatar() {
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.click();
    }
}

async function uploadAvatar(file) {
    showMessage('头像上传功能需要后端支持');
}

async function updateUsername() {
    showMessage('用户名修改功能需要后端支持');
}

async function updatePassword() {
    showMessage('密码修改功能需要后端支持');
}

async function savePreferences() {
    showMessage('设置保存功能需要后端支持');
}

// 论坛功能
async function loadForumPosts() {
    showMessage('论坛功能需要后端支持');
}

function refreshPosts() {
    loadForumPosts();
}

async function submitPost() {
    showMessage('发布帖子功能需要后端支持');
}

// 装备商店功能
async function loadEquipment() {
    showMessage('装备商店功能需要后端支持');
}

async function purchaseEquipment(equipmentId) {
    showMessage('购买装备功能需要后端支持');
}

// 管理员功能
async function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('权限不足', 'error');
        return;
    }
    
    showMessage('管理员功能加载中...');
}

// 音频管理器类
class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 1.0;
        this.muted = false;
    }
    
    loadSound(name, url) {
        console.log(`加载音效: ${name}`);
    }
    
    play(name, volume = 1.0) {
        console.log(`播放音效: ${name}`);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

// 确保全局函数可用
window.showMessage = showMessage;
window.showLoading = showLoading;
window.closeMessage = closeMessage;