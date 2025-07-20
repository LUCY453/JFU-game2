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
    // 预加载游戏音效
    audioManager.loadSound('join', 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXLHpuoA2Sg==');
    audioManager.loadSound('click', 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXLHpuoA2Sg==');
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

    // 确保有当前房间数据
    if (!currentRoom) {
        showMessage('房间数据加载失败', 'error');
        showRooms();
        return;
    }

    // 更新房间显示
    updateRoomDisplay();

    // 初始化聊天区域
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }

    // 添加房间事件监听
    setupRoomEventListeners();

    // 清除加载状态
    showLoading(false);

    // 播放加入房间音效
    if (audioManager) {
        audioManager.play('join', 0.5);
    }
}

function setupRoomEventListeners() {
    // 准备按钮
    const readyBtn = document.getElementById('readyBtn');
    if (readyBtn) {
        readyBtn.onclick = toggleReady;
    }

    // 开始游戏按钮
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.onclick = forceStartGame;
    }

    // 离开房间按钮
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    if (leaveRoomBtn) {
        leaveRoomBtn.onclick = leaveRoom;
    }

    // 聊天发送按钮
    const chatSendBtn = document.getElementById('chatSendBtn');
    if (chatSendBtn) {
        chatSendBtn.onclick = sendChatMessageFromInput;
    }
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
    // 初始化单人游戏状态
    gameState = {
        players: [{
            id: currentUser.id,
            username: currentUser.username,
            role: 'runner',
            lives: 3,
            safeZoneUses: 2,
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler()
        }],
        timeLeft: 300, // 5分钟
        status: 'playing'
    };

    // 开始游戏
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
        document.getElementById('userCoins').textContent = `金币: ${currentUser.coins}`;

        // 更新用户头像初始字母
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            userInitial.textContent = currentUser.username.charAt(0).toUpperCase();
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

function confirmCreateRoom() {
    const roomName = document.getElementById('roomName').value.trim();
    const gameMode = document.getElementById('gameMode').value;
    const maxPlayersInput = document.getElementById('maxPlayers');
    const maxPlayers = parseInt(maxPlayersInput.value);

    // 增强表单验证
    if (!roomName) {
        showMessage('请输入房间名称', 'error');
        return;
    }

    if (roomName.length > 20) {
        showMessage('房间名称不能超过20个字符', 'error');
        return;
    }

    if (isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 10) {
        showMessage('请输入有效的最大玩家数 (2-10)', 'error');
        return;
    }

    showLoading(true);

    try {
        // 调用Socket.IO创建房间
        if (socket) {
            socket.emit('createRoom', {
                name: roomName,
                gameMode: gameMode,
                maxPlayers: maxPlayers
            }, (response) => {
                showLoading(false);
                if (response.success) {
                    showMessage('房间创建成功');
                    currentRoom = response.room;
                    showGameRoom();
                } else {
                    showMessage(response.error || '创建房间失败', 'error');
                }
            });
        } else {
            showMessage('网络连接异常，请刷新页面重试', 'error');
        }
    } catch (error) {
        showLoading(false);
        showMessage('创建房间时发生错误: ' + error.message, 'error');
    }
}

// 游戏房间显示
function updateRoomDisplay() {
    if (!currentRoom) return;

    document.getElementById('roomTitle').textContent = `房间: ${currentRoom.name}`;

    const playersContainer = document.getElementById('roomPlayers');
    playersContainer.innerHTML = '';

    currentRoom.players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = `player-item ${player.ready ? 'player-ready' : ''}`;

        // 显示房主标识
        const hostIndicator = player.id === currentRoom.host ? ' 👑' : '';
        const playerName = player.id === currentUser.id ? '你' : player.username || `玩家${player.id.slice(0, 8)}`;

        playerElement.innerHTML = `
            <span>${playerName}${hostIndicator}</span>
            <span class="player-status">${player.ready ? '已准备' : '未准备'}</span>
        `;
        playersContainer.appendChild(playerElement);
    });

    // 更新准备按钮
    const readyBtn = document.getElementById('readyBtn');
    const myPlayer = currentRoom.players.find(p => p.id === currentUser.id);
    if (myPlayer) {
        readyBtn.textContent = myPlayer.ready ? '取消准备' : '准备';
        readyBtn.className = myPlayer.ready ? 'btn-warning' : 'btn-primary';
    }

    // 显示/隐藏强制开始按钮（仅房主可见）
    const startGameBtn = document.getElementById('startGameBtn');
    if (currentRoom.host === currentUser.id && currentRoom.players.length >= 2) {
        startGameBtn.style.display = 'block';
    } else {
        startGameBtn.style.display = 'none';
    }
}

// 强制开始游戏（仅房主）
function forceStartGame() {
    if (currentRoom && currentRoom.host === currentUser.id) {
        if (socket) {
            socket.emit('forceStartGame', {
                roomId: currentRoom.id
            });
        }
    }
}

// 个人主页功能
function loadUserProfile() {
    if (currentUser) {
        document.getElementById('profileUsername').value = currentUser.username;
        document.getElementById('profileCoins').textContent = currentUser.coins;

        // 生成用户头像
        const avatarInitial = document.getElementById('avatarInitial');
        if (avatarInitial) {
            avatarInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        }

        // 显示用户头像
        if (currentUser.avatar) {
            const avatarImage = document.getElementById('avatarImage');
            if (avatarImage) {
                avatarImage.src = currentUser.avatar;
                avatarImage.style.display = 'block';
                avatarInitial.style.display = 'none';
            }
        }

        // 加载用户偏好设置
        if (currentUser.preferences) {
            const volumeSlider = document.getElementById('volumeSlider');
            const volumeValue = document.getElementById('volumeValue');
            const graphicsSelect = document.getElementById('graphicsSelect');

            if (volumeSlider && currentUser.preferences.volume !== undefined) {
                volumeSlider.value = currentUser.preferences.volume * 100;
                volumeValue.textContent = Math.round(currentUser.preferences.volume * 100) + '%';
            }

            if (graphicsSelect && currentUser.preferences.graphics) {
                graphicsSelect.value = currentUser.preferences.graphics;
            }
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
    const formData = new FormData();
    formData.append('avatar', file);

    showLoading(true);

    try {
        const response = await fetch('/api/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentUser.avatar = data.avatar;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('头像上传成功');
            loadUserProfile();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('上传失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 继续main.js文件的剩余部分

async function updateUsername() {
    const newUsername = document.getElementById('profileUsername').value;
    if (!newUsername.trim()) {
        showMessage('用户名不能为空', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username: newUsername })
        });

        if (response.ok) {
            const data = await response.json();
            currentUser.username = newUsername;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('用户名修改成功');
            updateUserInfo();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('修改失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    if (!newPassword || newPassword.length < 6) {
        showMessage('密码至少6位', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ password: newPassword })
        });

        if (response.ok) {
            document.getElementById('newPassword').value = '';
            showMessage('密码修改成功');
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('修改失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function savePreferences() {
    const volumeSlider = document.getElementById('volumeSlider');
    const graphicsSelect = document.getElementById('graphicsSelect');

    const preferences = {
        volume: volumeSlider.value / 100,
        graphics: graphicsSelect.value
    };

    showLoading(true);

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ preferences })
        });

        if (response.ok) {
            currentUser.preferences = preferences;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('设置保存成功');
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('保存失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 论坛功能
async function loadForumPosts() {
    showLoading(true);

    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();

        const postsList = document.getElementById('postsList');
        const officialAnnouncements = document.getElementById('officialAnnouncements');

        postsList.innerHTML = '';
        officialAnnouncements.innerHTML = '';

        if (posts.length === 0) {
            postsList.innerHTML = '<div class="no-posts">暂无帖子</div>';
            return;
        }

        // 分离官方公告和普通帖子
        const announcements = posts.filter(post => post.isOfficial);
        const regularPosts = posts.filter(post => !post.isOfficial);

        // 显示官方公告
        if (announcements.length > 0) {
            announcements.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-item post-official';
                postElement.innerHTML = `
                    <h3>${post.title} 🏛️ 官方</h3>
                    <div class="post-meta">
                        发布时间: ${new Date(post.createdAt).toLocaleString()}
                    </div>
                    <p>${post.content}</p>
                    ${post.image ? `<img src="${post.image}" alt="帖子图片" class="post-image">` : ''}
                `;
                officialAnnouncements.appendChild(postElement);
            });
        } else {
            officialAnnouncements.innerHTML = '<div class="no-posts">暂无官方公告</div>';
        }

        // 显示普通帖子
        if (regularPosts.length > 0) {
            regularPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-item';
                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                        作者: ${post.author} | 发布时间: ${new Date(post.createdAt).toLocaleString()}
                    </div>
                    <p>${post.content}</p>
                    ${post.image ? `<img src="${post.image}" alt="帖子图片" class="post-image">` : ''}
                    <div class="post-actions">
                        ${currentUser && currentUser.isAdmin ? `<button onclick="deletePost('${post.id}')" class="btn-warning">删除</button>` : ''}
                    </div>
                `;
                postsList.appendChild(postElement);
            });
        } else {
            postsList.innerHTML = '<div class="no-posts">暂无用户帖子</div>';
        }
    } catch (error) {
        showMessage('加载帖子失败', 'error');
    } finally {
        showLoading(false);
    }
}

function refreshPosts() {
    loadForumPosts();
    showMessage('帖子列表已刷新');
}

async function submitPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const imageFile = document.getElementById('postImage').files[0];

    if (!title.trim() || !content.trim()) {
        showMessage('请填写标题和内容', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    showLoading(true);

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (response.ok) {
            showMessage('帖子发布成功');
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            document.getElementById('postImage').value = '';
            showForum();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('发布失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function deletePost(postId) {
    if (!confirm('确定要删除这个帖子吗？')) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showMessage('帖子删除成功');
            loadForumPosts();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('删除失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 装备商店功能
async function loadEquipment() {
    showLoading(true);

    try {
        const response = await fetch('/api/equipment');
        const equipment = await response.json();

        const equipmentList = document.getElementById('equipmentList');
        const ownedEquipmentList = document.getElementById('ownedEquipmentList');

        equipmentList.innerHTML = '';
        ownedEquipmentList.innerHTML = '';

        // 更新金币显示
        document.getElementById('equipmentCoins').textContent = currentUser.coins;

        // 显示商店装备
        equipment.forEach(item => {
            const isOwned = currentUser.equipment && currentUser.equipment.some(e => e.id === item.id);

            if (!isOwned) {
                const itemElement = document.createElement('div');
                itemElement.className = 'equipment-item';
                itemElement.innerHTML = `
                    <h3>${item.icon} ${item.name}</h3>
                    <p class="equipment-effect">${item.effect}</p>
                    <p class="equipment-price">💰 ${item.price} 金币</p>
                    <button onclick="purchaseEquipment('${item.id}')" 
                        ${currentUser.coins < item.price ? 'disabled' : ''} 
                        class="btn-primary">
                        ${currentUser.coins >= item.price ? '购买' : '金币不足'}
                    </button>
                `;
                equipmentList.appendChild(itemElement);
            }
        });

        // 显示已拥有装备
        if (currentUser.equipment && currentUser.equipment.length > 0) {
            currentUser.equipment.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'equipment-item';
                itemElement.innerHTML = `
                    <h3>${item.icon} ${item.name}</h3>
                    <p class="equipment-effect">${item.effect}</p>
                    <p style="color: #4caf50; font-weight: bold;">已拥有</p>
                `;
                ownedEquipmentList.appendChild(itemElement);
            });
        } else {
            ownedEquipmentList.innerHTML = '<div class="no-posts">暂无装备</div>';
        }

        if (equipmentList.children.length === 0) {
            equipmentList.innerHTML = '<div class="no-posts">所有装备已拥有</div>';
        }
    } catch (error) {
        showMessage('加载装备失败', 'error');
    } finally {
        showLoading(false);
    }
}

async function purchaseEquipment(equipmentId) {
    showLoading(true);

    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ equipmentId })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser.coins = data.coins;
            currentUser.equipment = data.equipment;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('购买成功');
            updateUserInfo();
            loadEquipment();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('购买失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 管理员功能
async function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('权限不足', 'error');
        return;
    }

    showAdminTab('rooms');
    loadAdminRooms();
    
    // 添加调试按钮
    setTimeout(() => {
        addDebugButtons();
    }, 500);
}

function showAdminTab(tabName) {
    // 切换标签
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');

    // 加载对应数据
    switch (tabName) {
        case 'rooms':
            loadAdminRooms();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'equipment':
            loadAdminEquipment();
            break;
        case 'fence':
            loadAdminFence();
            break;
    }
}

async function loadAdminRooms() {
    try {
        const response = await fetch('/api/admin/rooms-status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const rooms = await response.json();
            const roomsList = document.getElementById('adminRoomsList');

            roomsList.innerHTML = '';

            if (rooms.length === 0) {
                roomsList.innerHTML = '<div class="no-rooms">暂无活动房间</div>';
                return;
            }

            rooms.forEach(room => {
                const roomElement = document.createElement('div');
                roomElement.className = 'room-item';
                roomElement.innerHTML = `
                    <h3>房间: ${room.name}</h3>
                    <p>ID: ${room.id}</p>
                    <p>模式: ${getGameModeName(room.gameMode)}</p>
                    <p>状态: ${getStatusName(room.status)}</p>
                    <p>玩家数量: ${room.players.length}/${room.maxPlayers}</p>
                    <div class="players-list">
                        ${room.players.map(p => `
                            <div class="player-item">
                                <span>${p.username} (${p.id.slice(0, 8)})</span>
                                <span>状态: ${p.ready ? '已准备' : '未准备'}</span>
                                ${p.role ? `<span>角色: ${getRoleName(p.role)}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
                roomsList.appendChild(roomElement);
            });
        } else {
            showMessage('加载房间状态失败', 'error');
        }
    } catch (error) {
        showMessage('加载失败，请检查网络连接', 'error');
    }
}

function loadAdminUsers() {
    // 用户管理界面已预设，暂不需要特殊加载
    console.log('用户管理界面已加载');
}

function loadAdminEquipment() {
    // 装备管理界面已预设，暂不需要特殊加载
    console.log('装备管理界面已加载');
}

async function banUser() {
    const userId = document.getElementById('banUserId').value;

    if (!userId.trim()) {
        showMessage('请输入用户ID', 'error');
        return;
    }

    if (!confirm('确定要封禁这个用户吗？')) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/admin/ban-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            showMessage('用户封禁成功');
            document.getElementById('banUserId').value = '';
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('封禁失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function addEquipment() {
    const name = document.getElementById('equipmentName').value;
    const price = document.getElementById('equipmentPrice').value;
    const effect = document.getElementById('equipmentEffect').value;
    const icon = document.getElementById('equipmentIcon').value;

    if (!name.trim() || !price || !effect.trim()) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/equipment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, price, effect, icon })
        });

        if (response.ok) {
            showMessage('装备添加成功');
            document.getElementById('equipmentName').value = '';
            document.getElementById('equipmentPrice').value = '';
            document.getElementById('equipmentEffect').value = '';
            document.getElementById('equipmentIcon').value = '';
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('添加失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 游戏功能
function startGameScreen() {
    showScreen('gameScreen');
    initGame3D();
    updateGameUI();
    updateEquipmentPanel();
    // 显示虚拟摇杆
    if (typeof initControls === 'function') {
        initControls(true);
    }
}

function initGame3D() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('游戏画布未找到');
        return;
    }
    
    gameRenderer = new GameRenderer(canvas);
    gameRenderer.init();

    if (gameState) {
        gameRenderer.setupGame(gameState);
    }

    // 同步围栏设置到游戏
    if (window.fenceSystem) {
        window.fenceSystem.syncFenceToGame();
    }

    // 开始游戏循环
    gameLoop();
}

function gameLoop() {
    if (gameRenderer && document.getElementById('gameScreen').classList.contains('active')) {
        // 处理移动
        handleMovement();

        // 检查围栏边界（如果需要的话）
        if (gameRenderer.player && gameRenderer.electronicFence.enabled) {
            gameRenderer.checkPlayerBoundaries();
        }

        // 更新渲染器
        gameRenderer.update();
        gameRenderer.render();

        requestAnimationFrame(gameLoop);
    }
}

function handleMovement() {
    if (!gameRenderer) return;

    // 使用游戏设置中的移动速度
    const settings = getGameSettings();
    const speed = settings.moveSpeed;
    const rotationSpeed = 0.08;
    let moved = false;
    let isMoving = false;

    // 键盘控制 - 基于玩家朝向的移动
    if (moveState.forward) {
        gameRenderer.movePlayerForward(speed);
        moved = true;
        isMoving = true;
    }
    if (moveState.backward) {
        gameRenderer.movePlayerForward(-speed);
        moved = true;
        isMoving = true;
    }
    if (moveState.rotateLeft) {
        gameRenderer.rotatePlayer(-rotationSpeed, 0);
        moved = true;
    }
    if (moveState.rotateRight) {
        gameRenderer.rotatePlayer(rotationSpeed, 0);
        moved = true;
    }

    // 移动端虚拟摇杆控制
    if (joystickStates.left.active) {
        const moveForward = -joystickStates.left.y * speed;
        const strafe = joystickStates.left.x * speed;
        gameRenderer.movePlayerRelative(strafe, moveForward);
        moved = true;
        isMoving = Math.abs(moveForward) > 0.1 || Math.abs(strafe) > 0.1;
    }

    if (joystickStates.right.active) {
        gameRenderer.rotatePlayer(joystickStates.right.x * 0.05, 0);
        moved = true;
    }

    // 更新跑步动画
    gameRenderer.setPlayerMoving(isMoving);

    // 发送移动数据到服务器
    if (moved) {
        const playerPos = gameRenderer.getPlayerPosition();
        const playerRot = gameRenderer.getPlayerRotation();
        sendPlayerMove(playerPos, playerRot);
    }
}

function updateGameUI() {
    if (!gameState) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const myPlayer = gameState.players.find(p => p.id === user.id);

    if (myPlayer) {
        document.getElementById('gameRole').textContent = `角色: ${getRoleName(myPlayer.role)}`;
        document.getElementById('playerLives').textContent = `生命: ${myPlayer.lives}`;
        document.getElementById('safeZoneUses').textContent = `安全区: ${myPlayer.safeZoneUses}次`;

        // 更新安全区按钮
        const safeZoneBtn = document.getElementById('safeZoneBtn');
        if (myPlayer.role === 'catcher' || myPlayer.safeZoneUses <= 0) {
            safeZoneBtn.style.display = 'none';
        } else {
            safeZoneBtn.style.display = 'block';
        }
    }

    // 更新倒计时
    updateGameTimer();
}

function updateEquipmentPanel() {
    const equipmentList = document.getElementById('equipmentList');
    if (!equipmentList) return;

    equipmentList.innerHTML = '';

    if (currentUser.equipment && currentUser.equipment.length > 0) {
        currentUser.equipment.forEach(item => {
            const equipmentElement = document.createElement('div');
            equipmentElement.className = 'equipment-item';
            equipmentElement.innerHTML = `
                <span>${item.icon}</span>
                <span>${item.name}</span>
            `;
            equipmentList.appendChild(equipmentElement);
        });
    } else {
        equipmentList.innerHTML = '<div style="color: #999; text-align: center;">无装备</div>';
    }
}

function getRoleName(role) {
    const names = {
        'catcher': '抓捕者',
        'runner': '逃亡者',
        'medic': '医护人员',
        'vip': '被保护者',
        'bodyguard': '保镖'
    };
    return names[role] || role;
}

function updateGameTimer() {
    if (!gameState) return;

    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('gameTimer').textContent =
        `时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function toggleView() {
    isFirstPerson = !isFirstPerson;
    if (gameRenderer) {
        gameRenderer.setFirstPerson(isFirstPerson);
    }
    showMessage(isFirstPerson ? '切换到第一人称' : '切换到第三人称');
}

function enterSafeZone() {
    sendEnterSafeZone();
}

function useEquipment() {
    // 装备使用逻辑
    if (currentUser.equipment && currentUser.equipment.length > 0) {
        showMessage('装备功能开发中...', 'info');
    } else {
        showMessage('没有可用装备', 'warning');
    }
}

function handleGameEnd(result, winners) {
    const user = JSON.parse(localStorage.getItem('user'));
    const isWinner = winners.includes(user.id);

    showMessage(
        isWinner ? '恭喜！你获得了胜利！' : '游戏结束！',
        isWinner ? 'success' : 'info'
    );

    if (isWinner) {
        currentUser.coins += 10;
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUserInfo();
    }
}

// 聊天功能
function sendChatMessageFromInput() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (message && socket && currentRoom) {
        sendChatMessage(message);
        input.value = '';
    }
}

function addChatMessage(username, message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 键盘事件处理
function handleKeyDown(event) {
    if (!gameRenderer || !document.getElementById('gameScreen').classList.contains('active')) return;

    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveState.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveState.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveState.rotateLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveState.rotateRight = true;
            break;
        case 'KeyV':
            toggleView();
            break;
        case 'KeyE':
            enterSafeZone();
            break;
        case 'KeyQ':
            useEquipment();
            break;
    }
}

function handleKeyUp(event) {
    if (!gameRenderer || !document.getElementById('gameScreen').classList.contains('active')) return;

    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveState.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveState.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveState.rotateLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveState.rotateRight = false;
            break;
    }
}

// 添加移动端控制逻辑
function setupMobileControls() {
    const controls = document.createElement('div');
    controls.id = 'mobile-controls';
    controls.innerHTML = `
        <div class="joystick" id="leftJoystick"></div>
        <div class="joystick" id="rightJoystick"></div>
    `;
    document.body.appendChild(controls);

    // 初始化虚拟摇杆
    initJoystick('leftJoystick', 'left');
    initJoystick('rightJoystick', 'right');

    // 添加房间创建按钮的双事件绑定
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('touchstart', handleCreateRoom, { passive: true });
        createRoomBtn.addEventListener('click', handleCreateRoom);
    }
}

function initJoystick(elementId, type) {
    const joystick = document.getElementById(elementId);
    let touchId = null;

    joystick.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        updateJoystickPosition(touch, type);
        joystickStates[type].active = true;
    }, { passive: false });

    document.addEventListener('touchmove', e => {
        Array.from(e.changedTouches).forEach(touch => {
            if (touch.identifier === touchId) {
                e.preventDefault();
                updateJoystickPosition(touch, type);
            }
        });
    }, { passive: false });

    document.addEventListener('touchend', e => {
        Array.from(e.changedTouches).forEach(touch => {
            if (touch.identifier === touchId) {
                joystickStates[type] = { x: 0, y: 0, active: false };
                joystick.style.transform = 'translate(-50%, -50%)';
            }
        });
    });
}

function updateJoystickPosition(touch, type) {
    const joystick = document.getElementById(`${type}Joystick`);
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 40);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    joystick.style.transform = `translate(${x}px, ${y}px)`;
    joystickStates[type].x = x / 40;
    joystickStates[type].y = y / 40;
}

// 更新CSS样式增强触控体验
const mobileControlsCSS = `
#mobile-controls {
    position: fixed;
    bottom: 20px;
    width: 100%;
    height: 150px;
    pointer-events: none;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    touch-action: none;
}

.joystick {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    position: relative;
    pointer-events: auto;
    touch-action: none;
}
`;
const style = document.createElement('style');
style.textContent = mobileControlsCSS;
document.head.appendChild(style);

function checkConnection() {
    if (socket && socket.connected) {
        showMessage('网络连接正常', 'success');
    } else {
        showMessage('网络连接断开，正在重连...', 'warning');
        initSocket();
    }
}

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

// 音频管理器类
class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 1.0;
        this.muted = false;
    }

    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = audio;
                resolve(audio);
            });
            audio.addEventListener('error', reject);
        });
    }

    play(name, volume = 1.0) {
        if (this.muted) return;

        const sound = this.sounds[name];
        if (sound) {
            sound.volume = volume * this.volume;
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.error('播放音频失败:', error);
            });
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    mute() {
        this.muted = true;
    }

    unmute() {
        this.muted = false;
    }

    toggleMute() {
        this.muted = !this.muted;
    }
}

// 3D游戏渲染器类
class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.players = new Map();
        this.isFirstPerson = false;
        this.obstacles = [];
        this.safeZones = [];
        this.buildings = [];
        this.electronicFence = {
            enabled: false,
            boundaries: [],
            visualElements: []
        };
    }

    init() {
        // 初始化Three.js场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // 设置相机
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 10);

        // 设置渲染器
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 添加光照
        this.addLighting();

        // 添加地面
        this.addGround();

        // 窗口大小变化事件
        window.addEventListener('resize', () => this.onWindowResize());
    }

    addLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    addGround() {
        // 主要草地区域 - 扩大到200x200
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 添加道路
        this.addRoads();
        
        // 初始化电子围栏系统
        this.initElectronicFence();
    }

    addRoads() {
        // 主干道 - 横向（扩大到200）
        const mainRoadH = new THREE.PlaneGeometry(200, 4);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const road1 = new THREE.Mesh(mainRoadH, roadMaterial);
        road1.rotation.x = -Math.PI / 2;
        road1.position.set(0, 0.01, 0);
        road1.receiveShadow = true;
        this.scene.add(road1);
        
        // 主干道 - 纵向（扩大到200）
        const mainRoadV = new THREE.PlaneGeometry(4, 200);
        const road2 = new THREE.Mesh(mainRoadV, roadMaterial);
        road2.rotation.x = -Math.PI / 2;
        road2.position.set(0, 0.01, 0);
        road2.receiveShadow = true;
        this.scene.add(road2);
        
        // 添加更多道路网络
        this.addExtendedRoadNetwork();
        
        // 人行道
        const sidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        
        // 横向人行道（扩大到200）
        for (let i = -1; i <= 1; i += 2) {
            const sidewalk = new THREE.PlaneGeometry(200, 1);
            const walk = new THREE.Mesh(sidewalk, sidewalkMaterial);
            walk.rotation.x = -Math.PI / 2;
            walk.position.set(0, 0.005, i * 2.5);
            walk.receiveShadow = true;
            this.scene.add(walk);
        }
        
        // 纵向人行道（扩大到200）
        for (let i = -1; i <= 1; i += 2) {
            const sidewalk = new THREE.PlaneGeometry(1, 200);
            const walk = new THREE.Mesh(sidewalk, sidewalkMaterial);
            walk.rotation.x = -Math.PI / 2;
            walk.position.set(i * 2.5, 0.005, 0);
            walk.receiveShadow = true;
            this.scene.add(walk);
        }
    }

    addExtendedRoadNetwork() {
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        // 添加更多横向道路
        const horizontalRoads = [-60, -30, 30, 60];
        horizontalRoads.forEach(z => {
            const road = new THREE.PlaneGeometry(200, 3);
            const roadMesh = new THREE.Mesh(road, roadMaterial);
            roadMesh.rotation.x = -Math.PI / 2;
            roadMesh.position.set(0, 0.01, z);
            roadMesh.receiveShadow = true;
            this.scene.add(roadMesh);
        });
        
        // 添加更多纵向道路
        const verticalRoads = [-60, -30, 30, 60];
        verticalRoads.forEach(x => {
            const road = new THREE.PlaneGeometry(3, 200);
            const roadMesh = new THREE.Mesh(road, roadMaterial);
            roadMesh.rotation.x = -Math.PI / 2;
            roadMesh.position.set(x, 0.01, 0);
            roadMesh.receiveShadow = true;
            this.scene.add(roadMesh);
        });
    }

    setupGame(gameState) {
        // 清除现有玩家
        this.players.forEach(player => {
            this.scene.remove(player);
        });
        this.players.clear();

        // 创建玩家
        gameState.players.forEach(playerData => {
            const player = this.createStickFigure(playerData.role);
            
            // 确保玩家在地面上
            if (playerData.position && playerData.position.x !== undefined) {
                player.position.set(playerData.position.x, 0, playerData.position.z);
            } else {
                player.position.set(0, 0, 0);
            }
            
            player.userData = playerData;
            this.scene.add(player);
            this.players.set(playerData.id, player);

            // 如果是当前用户，设置为主玩家
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (playerData.id === currentUser.id) {
                this.player = player;
                console.log('主玩家创建完成，位置:', player.position);
            }
        });

        // 添加学校建筑
        this.addSchoolBuildings();

        // 添加安全区
        this.addSafeZones();
    }

    createStickFigure(role) {
        const group = new THREE.Group();

        // 根据角色选择颜色和服装
        let skinColor = 0xFFDBB3; // 肤色
        let clothColor = 0x4169E1; // 默认蓝色衣服
        let pantsColor = 0x2F4F4F; // 深灰色裤子
        
        switch (role) {
            case 'catcher':
                clothColor = 0xFF4500; // 橙红色制服
                pantsColor = 0x000000; // 黑色裤子
                break;
            case 'runner':
                clothColor = 0x4169E1; // 蓝色运动服
                pantsColor = 0x191970; // 深蓝色运动裤
                break;
            case 'medic':
                clothColor = 0xFFFFFF; // 白色医护服
                pantsColor = 0xFFFFFF; // 白色裤子
                break;
            case 'vip':
                clothColor = 0xFFD700; // 金色正装
                pantsColor = 0x2F4F4F; // 深灰色西裤
                break;
            case 'bodyguard':
                clothColor = 0x000000; // 黑色西装
                pantsColor = 0x000000; // 黑色西裤
                break;
        }

        // 材质
        const skinMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        const clothMaterial = new THREE.MeshLambertMaterial({ color: clothColor });
        const pantsMaterial = new THREE.MeshLambertMaterial({ color: pantsColor });
        const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        // 头部 - 更真实的形状
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 12);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.y = 1.65;
        head.scale.set(1, 1.1, 0.9); // 稍微拉长
        head.castShadow = true;
        head.name = 'head';
        group.add(head);

        // 头发
        const hairGeometry = new THREE.SphereGeometry(0.26, 16, 8);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 1.75;
        hair.scale.set(1, 0.6, 0.9);
        hair.castShadow = true;
        group.add(hair);

        // 颈部
        const neckGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
        const neck = new THREE.Mesh(neckGeometry, skinMaterial);
        neck.position.y = 1.45;
        neck.castShadow = true;
        group.add(neck);

        // 躯干 - 更真实的形状
        const torsoGeometry = new THREE.BoxGeometry(0.4, 0.7, 0.2);
        const torso = new THREE.Mesh(torsoGeometry, clothMaterial);
        torso.position.y = 1.05;
        torso.castShadow = true;
        torso.name = 'torso';
        group.add(torso);

        // 上臂
        const upperArmGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8);
        
        const leftUpperArm = new THREE.Mesh(upperArmGeometry, clothMaterial);
        leftUpperArm.position.set(-0.25, 1.25, 0);
        leftUpperArm.castShadow = true;
        leftUpperArm.name = 'leftUpperArm';
        group.add(leftUpperArm);

        const rightUpperArm = new THREE.Mesh(upperArmGeometry, clothMaterial);
        rightUpperArm.position.set(0.25, 1.25, 0);
        rightUpperArm.castShadow = true;
        rightUpperArm.name = 'rightUpperArm';
        group.add(rightUpperArm);

        // 前臂
        const forearmGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.3, 8);
        
        const leftForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
        leftForearm.position.set(-0.25, 0.9, 0);
        leftForearm.castShadow = true;
        leftForearm.name = 'leftForearm';
        group.add(leftForearm);

        const rightForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
        rightForearm.position.set(0.25, 0.9, 0);
        rightForearm.castShadow = true;
        rightForearm.name = 'rightForearm';
        group.add(rightForearm);

        // 手
        const handGeometry = new THREE.SphereGeometry(0.05, 8, 6);
        
        const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
        leftHand.position.set(-0.25, 0.72, 0);
        leftHand.castShadow = true;
        group.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
        rightHand.position.set(0.25, 0.72, 0);
        rightHand.castShadow = true;
        group.add(rightHand);

        // 大腿
        const thighGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8);
        
        const leftThigh = new THREE.Mesh(thighGeometry, pantsMaterial);
        leftThigh.position.set(-0.1, 0.5, 0);
        leftThigh.castShadow = true;
        leftThigh.name = 'leftThigh';
        group.add(leftThigh);

        const rightThigh = new THREE.Mesh(thighGeometry, pantsMaterial);
        rightThigh.position.set(0.1, 0.5, 0);
        rightThigh.castShadow = true;
        rightThigh.name = 'rightThigh';
        group.add(rightThigh);

        // 小腿
        const calfGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8);
        
        const leftCalf = new THREE.Mesh(calfGeometry, pantsMaterial);
        leftCalf.position.set(-0.1, 0.125, 0);
        leftCalf.castShadow = true;
        leftCalf.name = 'leftCalf';
        group.add(leftCalf);

        const rightCalf = new THREE.Mesh(calfGeometry, pantsMaterial);
        rightCalf.position.set(0.1, 0.125, 0);
        rightCalf.castShadow = true;
        rightCalf.name = 'rightCalf';
        group.add(rightCalf);

        // 脚
        const footGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.2);
        const footMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.1, -0.05, 0.05);
        leftFoot.castShadow = true;
        leftFoot.name = 'leftFoot';
        group.add(leftFoot);

        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.1, -0.05, 0.05);
        rightFoot.castShadow = true;
        rightFoot.name = 'rightFoot';
        group.add(rightFoot);

        // 添加角色标识
        this.addRoleIndicator(group, role);

        return group;
    }

    addRoleIndicator(group, role) {
        // 在头顶添加角色标识
        let indicatorColor = 0xFFFFFF;
        let indicatorText = '';
        
        switch (role) {
            case 'catcher':
                indicatorColor = 0xFF0000;
                indicatorText = '抓';
                break;
            case 'runner':
                indicatorColor = 0x0000FF;
                indicatorText = '逃';
                break;
            case 'medic':
                indicatorColor = 0x00FF00;
                indicatorText = '医';
                break;
            case 'vip':
                indicatorColor = 0xFFD700;
                indicatorText = 'VIP';
                break;
            case 'bodyguard':
                indicatorColor = 0x800080;
                indicatorText = '保';
                break;
        }

        // 创建标识牌
        const indicatorGeometry = new THREE.PlaneGeometry(0.3, 0.15);
        const indicatorMaterial = new THREE.MeshLambertMaterial({ 
            color: indicatorColor,
            transparent: true,
            opacity: 0.8
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(0, 2.1, 0);
        indicator.lookAt(0, 2.1, 1); // 始终面向相机方向
        group.add(indicator);
    }

    addSchoolBuildings() {
        this.buildings = [];
        
        // 主教学楼
        const mainBuilding = this.createBuilding(20, 8, 15, 0xFF6B6B, 0, 4, -20);
        this.buildings.push(mainBuilding);
        
        // 图书馆
        const library = this.createBuilding(12, 6, 10, 0x4ECDC4, -25, 3, 0);
        this.buildings.push(library);
        
        // 体育馆
        const gym = this.createBuilding(15, 10, 20, 0x45B7D1, 25, 5, 10);
        this.buildings.push(gym);
        
        // 食堂
        const cafeteria = this.createBuilding(18, 5, 12, 0xF9CA24, -15, 2.5, 25);
        this.buildings.push(cafeteria);
        
        // 实验楼
        const labBuilding = this.createBuilding(10, 12, 8, 0x6C5CE7, 30, 6, -15);
        this.buildings.push(labBuilding);
        
        // 添加走廊连接
        this.addCorridors();
        
        // 添加学校设施
        this.addSchoolFacilities();
    }

    createBuilding(width, height, depth, color, x, y, z) {
        const group = new THREE.Group();
        
        // 建筑主体
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: color });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(0, 0, 0);
        building.castShadow = true;
        building.receiveShadow = true;
        
        // 添加碰撞检测属性
        building.userData = {
            isBuilding: true,
            width: width,
            height: height,
            depth: depth,
            doorPosition: { x: 0, z: depth/2 }, // 门的位置
            doorWidth: 3 // 门的宽度
        };
        
        group.add(building);
        
        // 屋顶
        const roofGeometry = new THREE.BoxGeometry(width + 1, 0.5, depth + 1);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height/2 + 0.25, 0);
        roof.castShadow = true;
        group.add(roof);
        
        // 只在正面中央创建一个门
        const doorGeometry = new THREE.BoxGeometry(3, 3, 0.2);
        const doorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x654321,
            transparent: true,
            opacity: 0 // 门是敞开的，完全透明
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, -height/2 + 1.5, depth/2 + 0.1);
        door.userData = { isDoor: true };
        group.add(door);
        
        // 门框
        const doorFrameGeometry = new THREE.BoxGeometry(3.2, 3.2, 0.3);
        const doorFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
        doorFrame.position.set(0, -height/2 + 1.6, depth/2 + 0.05);
        group.add(doorFrame);
        
        // 在门的两侧和其他墙面添加窗户
        const windowPositions = [
            { x: -width/3, z: depth/2 + 0.05 }, // 门左侧窗户
            { x: width/3, z: depth/2 + 0.05 },  // 门右侧窗户
            { x: -width/2 - 0.05, z: 0 },       // 左侧墙窗户
            { x: width/2 + 0.05, z: 0 }         // 右侧墙窗户
        ];
        
        windowPositions.forEach(pos => {
            const windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
            const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(pos.x, height/4, pos.z);
            group.add(window);
        });
        
        group.position.set(x, y, z);
        group.userData = {
            isBuilding: true,
            width: width,
            height: height,
            depth: depth,
            doorPosition: { x: x, z: z + depth/2 }, // 世界坐标中的门位置
            doorWidth: 3
        };
        
        this.scene.add(group);
        this.obstacles.push(group); // 添加到障碍物列表
        return group;
    }

    addCorridors() {
        // 连接主要建筑的走廊
        const corridorMaterial = new THREE.MeshLambertMaterial({ color: 0xDDD });
        
        // 主走廊 - 连接主教学楼和图书馆
        const mainCorridor = new THREE.BoxGeometry(30, 0.2, 3);
        const corridor1 = new THREE.Mesh(mainCorridor, corridorMaterial);
        corridor1.position.set(-12, 0.1, -10);
        corridor1.receiveShadow = true;
        this.scene.add(corridor1);
        
        // 侧走廊 - 连接体育馆
        const sideCorridor = new THREE.BoxGeometry(3, 0.2, 25);
        const corridor2 = new THREE.Mesh(sideCorridor, corridorMaterial);
        corridor2.position.set(15, 0.1, 0);
        corridor2.receiveShadow = true;
        this.scene.add(corridor2);
    }

    addSchoolFacilities() {
        // 篮球场
        const courtGeometry = new THREE.BoxGeometry(15, 0.1, 28);
        const courtMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8C42 });
        const court = new THREE.Mesh(courtGeometry, courtMaterial);
        court.position.set(-35, 0.05, -25);
        court.receiveShadow = true;
        this.scene.add(court);
        
        // 篮球架
        for (let i = 0; i < 2; i++) {
            const hoopGroup = new THREE.Group();
            
            // 支柱
            const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(0, 2, 0);
            pole.castShadow = true;
            hoopGroup.add(pole);
            
            // 篮板
            const backboardGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
            const backboardMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF });
            const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
            backboard.position.set(0, 3.5, 0);
            hoopGroup.add(backboard);
            
            hoopGroup.position.set(-35, 0, -25 + (i * 28));
            this.scene.add(hoopGroup);
        }
        
        // 花园区域
        this.addGarden();
        
        // 停车场
        this.addParkingLot();
        
        // 树木
        this.addTrees();
    }

    addGarden() {
        // 花园中心区域
        const gardenGeometry = new THREE.CircleGeometry(8, 16);
        const gardenMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        const garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
        garden.rotation.x = -Math.PI / 2;
        garden.position.set(0, 0.01, 0);
        garden.receiveShadow = true;
        this.scene.add(garden);
        
        // 花坛
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const flowerBedGeometry = new THREE.CylinderGeometry(1, 1, 0.3);
            const flowerBedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const flowerBed = new THREE.Mesh(flowerBedGeometry, flowerBedMaterial);
            flowerBed.position.set(
                Math.cos(angle) * 5,
                0.15,
                Math.sin(angle) * 5
            );
            this.scene.add(flowerBed);
            
            // 花朵
            const flowerGeometry = new THREE.SphereGeometry(0.2, 8, 6);
            const flowerColors = [0xFF69B4, 0xFF1493, 0xFFB6C1, 0xFFA500];
            const flowerMaterial = new THREE.MeshLambertMaterial({ 
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)] 
            });
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.set(
                Math.cos(angle) * 5,
                0.5,
                Math.sin(angle) * 5
            );
            this.scene.add(flower);
        }
    }

    addParkingLot() {
        // 停车场地面
        const parkingGeometry = new THREE.BoxGeometry(20, 0.1, 15);
        const parkingMaterial = new THREE.MeshLambertMaterial({ color: 0x555 });
        const parking = new THREE.Mesh(parkingGeometry, parkingMaterial);
        parking.position.set(35, 0.05, 30);
        parking.receiveShadow = true;
        this.scene.add(parking);
        
        // 停车位线条
        for (let i = 0; i < 4; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.1, 0.02, 15);
            const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(35 - 8 + i * 4, 0.11, 30);
            this.scene.add(line);
        }
    }

    addTrees() {
        const treePositions = [
            [-40, 0, -40], [40, 0, -40], [-40, 0, 40], [40, 0, 40],
            [-20, 0, -45], [20, 0, -45], [-45, 0, -20], [45, 0, -20],
            [-45, 0, 20], [45, 0, 20], [-20, 0, 45], [20, 0, 45]
        ];
        
        treePositions.forEach(pos => {
            const treeGroup = new THREE.Group();
            
            // 树干
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(0, 1.5, 0);
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // 树冠
            const crownGeometry = new THREE.SphereGeometry(2, 8, 6);
            const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.set(0, 4, 0);
            crown.castShadow = true;
            treeGroup.add(crown);
            
            treeGroup.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(treeGroup);
            this.obstacles.push(treeGroup);
        });
    }

    addObstacles() {
        // 现在obstacles主要是树木，在addTrees中添加
        // 添加一些额外的小障碍物
        const benchPositions = [
            [10, 0, 15], [-10, 0, 15], [15, 0, -5], [-15, 0, -5]
        ];
        
        benchPositions.forEach(pos => {
            const benchGroup = new THREE.Group();
            
            // 长椅座位
            const seatGeometry = new THREE.BoxGeometry(2, 0.2, 0.5);
            const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const seat = new THREE.Mesh(seatGeometry, seatMaterial);
            seat.position.set(0, 0.5, 0);
            benchGroup.add(seat);
            
            // 长椅靠背
            const backGeometry = new THREE.BoxGeometry(2, 0.8, 0.1);
            const back = new THREE.Mesh(backGeometry, seatMaterial);
            back.position.set(0, 0.9, -0.2);
            benchGroup.add(back);
            
            // 支腿
            for (let i = 0; i < 2; i++) {
                const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
                const leg = new THREE.Mesh(legGeometry, seatMaterial);
                leg.position.set((i - 0.5) * 1.5, 0.25, 0);
                benchGroup.add(leg);
            }
            
            benchGroup.position.set(pos[0], pos[1], pos[2]);
            benchGroup.castShadow = true;
            this.scene.add(benchGroup);
            this.obstacles.push(benchGroup);
        });
    }

    addSafeZones() {
        // 添加初始区（出生点）
        this.addSpawnZone();
        
        // 在学校的特定位置添加安全区
        const safeZonePositions = [
            [-25, 0.05, 0],    // 图书馆前
            [25, 0.05, 10],    // 体育馆旁
            [-15, 0.05, 25],   // 食堂附近
            [30, 0.05, -15],   // 实验楼旁
        ];

        safeZonePositions.forEach((pos, index) => {
            const safeZoneGroup = new THREE.Group();
            
            // 主安全区圆盘
            const safeZoneGeometry = new THREE.CylinderGeometry(3, 3, 0.1, 32);
            const safeZoneMaterial = new THREE.MeshLambertMaterial({
                color: 0x00FF00,
                transparent: true,
                opacity: 0.6
            });
            const safeZone = new THREE.Mesh(safeZoneGeometry, safeZoneMaterial);
            safeZone.position.set(0, 0, 0);
            safeZoneGroup.add(safeZone);
            
            // 外圈发光效果
            const glowGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.05, 32);
            const glowMaterial = new THREE.MeshLambertMaterial({
                color: 0x00FF00,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.set(0, 0.05, 0);
            safeZoneGroup.add(glow);
            
            // 边界指示器
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const indicatorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
                const indicatorMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
                const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
                indicator.position.set(
                    Math.cos(angle) * 3.2,
                    0.5,
                    Math.sin(angle) * 3.2
                );
                safeZoneGroup.add(indicator);
            }
            
            // 安全区标识牌
            const signGeometry = new THREE.BoxGeometry(1, 0.6, 0.1);
            const signMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(0, 1.5, 3.5);
            safeZoneGroup.add(sign);
            
            // 添加文字标识（简化版）
            const textGeometry = new THREE.PlaneGeometry(0.8, 0.3);
            const textMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.9
            });
            const textPlane = new THREE.Mesh(textGeometry, textMaterial);
            textPlane.position.set(0, 1.5, 3.55);
            safeZoneGroup.add(textPlane);
            
            safeZoneGroup.position.set(pos[0], pos[1], pos[2]);
            safeZoneGroup.userData = { type: 'safeZone', index: index };
            this.scene.add(safeZoneGroup);
            this.safeZones.push(safeZone);
        });
    }

    addSpawnZone() {
        // 初始区（出生点）
        const spawnZoneGroup = new THREE.Group();
        
        // 主圆盘 - 蓝色
        const spawnGeometry = new THREE.CylinderGeometry(5, 5, 0.15, 32);
        const spawnMaterial = new THREE.MeshLambertMaterial({
            color: 0x4169E1,
            transparent: true,
            opacity: 0.7
        });
        const spawnZone = new THREE.Mesh(spawnGeometry, spawnMaterial);
        spawnZone.position.set(0, 0, 0);
        spawnZoneGroup.add(spawnZone);
        
        // 外圈装饰
        const outerRingGeometry = new THREE.RingGeometry(4.5, 5.5, 32);
        const outerRingMaterial = new THREE.MeshLambertMaterial({
            color: 0x1E90FF,
            transparent: true,
            opacity: 0.5
        });
        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.set(0, 0.08, 0);
        spawnZoneGroup.add(outerRing);
        
        // 中心标识
        const centerGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
        const centerMaterial = new THREE.MeshLambertMaterial({ color: 0x0000FF });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.set(0, 0.1, 0);
        spawnZoneGroup.add(center);
        
        // 边界柱子
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
            const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(
                Math.cos(angle) * 5.2,
                0.75,
                Math.sin(angle) * 5.2
            );
            spawnZoneGroup.add(pillar);
        }
        
        // 初始区标识牌
        const spawnSignGeometry = new THREE.BoxGeometry(2, 1, 0.1);
        const spawnSignMaterial = new THREE.MeshLambertMaterial({ color: 0x191970 });
        const spawnSign = new THREE.Mesh(spawnSignGeometry, spawnSignMaterial);
        spawnSign.position.set(0, 2, 6);
        spawnZoneGroup.add(spawnSign);
        
        spawnZoneGroup.position.set(0, 0.05, 0);
        spawnZoneGroup.userData = { type: 'spawnZone' };
        this.scene.add(spawnZoneGroup);
        this.spawnZone = spawnZone;
    }

    movePlayer(deltaX, deltaY, deltaZ) {
        if (!this.player) return;

        const newPosition = this.player.position.clone();
        newPosition.x += deltaX;
        newPosition.y += deltaY;
        newPosition.z += deltaZ;

        // 电子围栏检测
        if (globalFenceSystem) {
            const constrainedPos = globalFenceSystem.constrainMovement(
                newPosition.x, newPosition.z, 
                this.player.position.x, this.player.position.z
            );
            newPosition.x = constrainedPos.x;
            newPosition.z = constrainedPos.z;
        }

        // 碰撞检测
        if (!this.checkCollision(newPosition)) {
            this.player.position.copy(newPosition);
        }

        // 扩大地图边界限制（从50x50扩大到100x100）
        this.player.position.x = Math.max(-100, Math.min(100, this.player.position.x));
        this.player.position.z = Math.max(-100, Math.min(100, this.player.position.z));
    }

    // 基于玩家朝向的前进移动
    movePlayerForward(speed) {
        if (!this.player) return;

        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.player.quaternion);
        
        const newPosition = this.player.position.clone();
        newPosition.add(direction.multiplyScalar(speed));

        // 电子围栏检测
        if (globalFenceSystem) {
            const constrainedPos = globalFenceSystem.constrainMovement(
                newPosition.x, newPosition.z, 
                this.player.position.x, this.player.position.z
            );
            newPosition.x = constrainedPos.x;
            newPosition.z = constrainedPos.z;
        }

        // 碰撞检测
        if (!this.checkCollision(newPosition)) {
            this.player.position.copy(newPosition);
        }

        // 扩大地图边界限制（从50x50扩大到100x100）
        this.player.position.x = Math.max(-100, Math.min(100, this.player.position.x));
        this.player.position.z = Math.max(-100, Math.min(100, this.player.position.z));
    }

    // 相对于玩家朝向的移动（前后左右）
    movePlayerRelative(strafe, forward) {
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

        // 电子围栏检测
        const constrainedPos = this.constrainPlayerMovement(newPosition.x, newPosition.z);
        newPosition.x = constrainedPos.x;
        newPosition.z = constrainedPos.z;

        // 碰撞检测
        if (!this.checkCollision(newPosition)) {
            this.player.position.copy(newPosition);
        }

        // 扩大地图边界限制（从50x50扩大到100x100）
        this.player.position.x = Math.max(-100, Math.min(100, this.player.position.x));
        this.player.position.z = Math.max(-100, Math.min(100, this.player.position.z));
    }

    rotatePlayer(deltaX, deltaY) {
        if (!this.player) return;
        this.player.rotation.y += deltaX;
    }

    // 碰撞检测
    checkCollision(position) {
        const playerRadius = 0.4;
        
        // 建筑物不再阻挡玩家移动，玩家可以自由进入建筑物
        // （删除了门的检测，玩家可以从任何方向进入建筑物）

        // 检查与障碍物的碰撞
        for (let obstacle of this.obstacles) {
            const box = new THREE.Box3().setFromObject(obstacle);
            const playerBox = new THREE.Box3(
                new THREE.Vector3(position.x - playerRadius, position.y - 1, position.z - playerRadius),
                new THREE.Vector3(position.x + playerRadius, position.y + 1, position.z + playerRadius)
            );
            
            if (box.intersectsBox(playerBox)) {
                return true; // 发生碰撞
            }
        }

        return false; // 无碰撞
    }

    // 检查玩家是否在安全区内
    checkSafeZone(position) {
        for (let i = 0; i < this.safeZones.length; i++) {
            const safeZone = this.safeZones[i];
            const distance = position.distanceTo(safeZone.position);
            if (distance <= 3) { // 安全区半径为3
                return i; // 返回安全区索引
            }
        }
        return -1; // 不在任何安全区内
    }

    // 检查玩家是否在初始区内
    checkSpawnZone(position) {
        const spawnCenter = new THREE.Vector3(0, 0, 0);
        const distance = position.distanceTo(spawnCenter);
        return distance <= 5; // 初始区半径为5
    }

    // 设置玩家移动状态（用于动画）
    setPlayerMoving(isMoving) {
        if (!this.player) return;
        
        const time = Date.now() * 0.008;
        
        if (isMoving) {
            // 更真实的跑步动画
            const bobAmount = 0.08;
            const baseY = 0;
            this.player.position.y = baseY + Math.abs(Math.sin(time * 2)) * bobAmount;
            
            // 获取身体部位
            const leftUpperArm = this.player.getObjectByName('leftUpperArm');
            const rightUpperArm = this.player.getObjectByName('rightUpperArm');
            const leftForearm = this.player.getObjectByName('leftForearm');
            const rightForearm = this.player.getObjectByName('rightForearm');
            const leftThigh = this.player.getObjectByName('leftThigh');
            const rightThigh = this.player.getObjectByName('rightThigh');
            const leftCalf = this.player.getObjectByName('leftCalf');
            const rightCalf = this.player.getObjectByName('rightCalf');
            const leftFoot = this.player.getObjectByName('leftFoot');
            const rightFoot = this.player.getObjectByName('rightFoot');
            const torso = this.player.getObjectByName('torso');
            
            // 躯干轻微前倾
            if (torso) {
                torso.rotation.x = Math.sin(time) * 0.05;
            }
            
            // 手臂摆动 - 交替摆动
            const armSwing = Math.sin(time * 2) * 0.6;
            if (leftUpperArm && rightUpperArm) {
                leftUpperArm.rotation.x = armSwing;
                rightUpperArm.rotation.x = -armSwing;
            }
            
            // 前臂跟随摆动
            if (leftForearm && rightForearm) {
                leftForearm.rotation.x = Math.max(0, armSwing * 0.5);
                rightForearm.rotation.x = Math.max(0, -armSwing * 0.5);
            }
            
            // 腿部跑步动画 - 交替抬腿
            const legSwing = Math.sin(time * 2) * 0.8;
            if (leftThigh && rightThigh) {
                leftThigh.rotation.x = legSwing;
                rightThigh.rotation.x = -legSwing;
            }
            
            // 小腿跟随摆动
            if (leftCalf && rightCalf) {
                leftCalf.rotation.x = Math.max(-0.3, legSwing * 0.7);
                rightCalf.rotation.x = Math.max(-0.3, -legSwing * 0.7);
            }
            
            // 脚部动画
            if (leftFoot && rightFoot) {
                leftFoot.rotation.x = Math.sin(time * 2) * 0.2;
                rightFoot.rotation.x = Math.sin(time * 2 + Math.PI) * 0.2;
            }
            
        } else {
            // 静止状态 - 重置所有动画
            this.player.position.y = 0;
            
            const parts = [
                'leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm',
                'leftThigh', 'rightThigh', 'leftCalf', 'rightCalf',
                'leftFoot', 'rightFoot', 'torso'
            ];
            
            parts.forEach(partName => {
                const part = this.player.getObjectByName(partName);
                if (part) {
                    part.rotation.x = 0;
                    part.rotation.z = 0;
                }
            });
        }
    }

    updatePlayerPosition(playerId, position, rotation) {
        const player = this.players.get(playerId);
        if (player && player !== this.player) {
            player.position.copy(position);
            player.rotation.copy(rotation);
        }
    }

    setFirstPerson(firstPerson) {
        this.isFirstPerson = firstPerson;
    }

    getPlayerPosition() {
        return this.player ? this.player.position.clone() : new THREE.Vector3();
    }

    getPlayerRotation() {
        return this.player ? this.player.rotation.clone() : new THREE.Euler();
    }

    update() {
        if (!this.player) return;

        // 取消红墙显示功能
        // this.checkFenceProximity(); // 已禁用

        // 更新相机位置
        if (this.isFirstPerson) {
            // 第一人称视角
            this.camera.position.copy(this.player.position);
            this.camera.position.y += 1.6; // 眼部高度
            this.camera.rotation.copy(this.player.rotation);
        } else {
            // 第三人称视角 - 距离更近，跟随更自然
            const offset = new THREE.Vector3(0, 1.5, 2.5);
            offset.applyQuaternion(this.player.quaternion);
            this.camera.position.copy(this.player.position).add(offset);

            // 相机看向玩家头部位置
            const lookAtTarget = this.player.position.clone();
            lookAtTarget.y += 1.2;
            this.camera.lookAt(lookAtTarget);
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // 电子围栏系统
    initElectronicFence() {
        // 初始化围栏系统，但不设置默认边界
        this.electronicFence.visualElements = []; // 存储所有可视化元素
        
        // 如果有全局围栏设置，应用它们
        if (typeof globalFenceSettings !== 'undefined' && globalFenceSettings.boundaries.length > 0) {
            this.electronicFence.boundaries = [...globalFenceSettings.boundaries];
            this.electronicFence.enabled = globalFenceSettings.enabled;
            this.createFenceVisualization();
        }
    }

    createFenceVisualization() {
        // 清除现有的围栏可视化元素
        this.clearFenceVisualization();

        if (!this.electronicFence.enabled || this.electronicFence.boundaries.length < 3) {
            return;
        }

        console.log('创建围栏可视化，边界点数量:', this.electronicFence.boundaries.length);

        // 创建围栏墙体（红色半透明墙）
        this.createFenceWalls();
        
        // 创建围栏边界线（地面红线）
        this.createFenceBoundaryLines();
        
        // 添加围栏柱子和警告灯
        this.addFencePosts();
        
        console.log('围栏可视化创建完成，元素数量:', this.electronicFence.visualElements.length);
    }

    clearFenceVisualization() {
        // 移除所有围栏可视化元素
        this.electronicFence.visualElements.forEach(element => {
            this.scene.remove(element);
        });
        this.electronicFence.visualElements = [];
    }

    createFenceWalls() {
        const boundaries = this.electronicFence.boundaries;
        
        for (let i = 0; i < boundaries.length; i++) {
            const currentPoint = boundaries[i];
            const nextPoint = boundaries[(i + 1) % boundaries.length];
            
            // 计算墙体的位置和方向
            const wallLength = Math.sqrt(
                Math.pow(nextPoint.x - currentPoint.x, 2) + 
                Math.pow(nextPoint.z - currentPoint.z, 2)
            );
            
            const centerX = (currentPoint.x + nextPoint.x) / 2;
            const centerZ = (currentPoint.z + nextPoint.z) / 2;
            
            // 创建墙体几何体
            const wallGeometry = new THREE.PlaneGeometry(wallLength, 3);
            const wallMaterial = new THREE.MeshLambertMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(centerX, 1.5, centerZ);
            
            // 计算墙体旋转角度
            const angle = Math.atan2(nextPoint.z - currentPoint.z, nextPoint.x - currentPoint.x);
            wall.rotation.y = angle + Math.PI / 2;
            
            this.scene.add(wall);
            this.electronicFence.visualElements.push(wall);
        }
    }

    createFenceBoundaryLines() {
        // 创建围栏边界线
        const points = [];
        this.electronicFence.boundaries.forEach(point => {
            points.push(new THREE.Vector3(point.x, 0.1, point.z));
        });
        // 闭合围栏
        points.push(new THREE.Vector3(this.electronicFence.boundaries[0].x, 0.1, this.electronicFence.boundaries[0].z));

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff0000, 
            linewidth: 5,
            transparent: true,
            opacity: 1.0
        });

        const boundaryLine = new THREE.Line(geometry, material);
        this.scene.add(boundaryLine);
        this.electronicFence.visualElements.push(boundaryLine);
    }

    addFencePosts() {
        this.electronicFence.boundaries.forEach(point => {
            // 围栏柱子
            const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
            const postMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(point.x, 1.5, point.z);
            post.castShadow = true;
            this.scene.add(post);
            this.electronicFence.visualElements.push(post);

            // 警告灯
            const lightGeometry = new THREE.SphereGeometry(0.2, 8, 6);
            const lightMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xff0000,
                emissive: 0x440000
            });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(point.x, 3.2, point.z);
            this.scene.add(light);
            this.electronicFence.visualElements.push(light);

            // 闪烁效果
            let blinkInterval = setInterval(() => {
                if (this.electronicFence.enabled && this.scene.children.includes(light)) {
                    light.material.emissive.setHex(
                        light.material.emissive.getHex() === 0x440000 ? 0xff0000 : 0x440000
                    );
                } else {
                    clearInterval(blinkInterval);
                }
            }, 1000);
        });
    }

    setElectronicFence(boundaries, enabled = true) {
        this.electronicFence.boundaries = boundaries;
        this.electronicFence.enabled = enabled;
        this.createFenceVisualization();
    }

    isPointInsideFence(x, z) {
        if (!this.electronicFence.enabled || this.electronicFence.boundaries.length < 3) {
            return true; // 如果围栏未启用，允许所有位置
        }

        // 使用射线投射算法检测点是否在多边形内
        let inside = false;
        const boundaries = this.electronicFence.boundaries;
        
        for (let i = 0, j = boundaries.length - 1; i < boundaries.length; j = i++) {
            if (((boundaries[i].z > z) !== (boundaries[j].z > z)) &&
                (x < (boundaries[j].x - boundaries[i].x) * (z - boundaries[i].z) / (boundaries[j].z - boundaries[i].z) + boundaries[i].x)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    checkPlayerBoundaries() {
        if (!this.player || !currentUser) return true;

        // 管理员不受围栏限制
        if (currentUser.isAdmin) {
            return true;
        }

        const playerPos = this.player.position;
        return this.isPointInsideFence(playerPos.x, playerPos.z);
    }

    constrainPlayerMovement(newX, newZ) {
        if (!this.electronicFence.enabled) {
            return { x: newX, z: newZ };
        }

        // 移除管理员特权，所有人都受围栏限制
        // 检查新位置是否在围栏内
        if (this.isPointInsideFence(newX, newZ)) {
            return { x: newX, z: newZ };
        }

        // 如果新位置在围栏外，阻止移动
        const currentPos = this.player.position;
        showMessage('⚠️ 您已到达电子围栏边界！', 'warning');
        return { x: currentPos.x, z: currentPos.z };
    }

    // 检查玩家是否接近围栏边界
    checkFenceProximity() {
        if (!this.player || !this.electronicFence.enabled || this.electronicFence.boundaries.length < 3) {
            this.clearWarningWalls();
            return;
        }

        const playerPos = this.player.position;
        const proximityDistance = 5; // 5个单位距离内显示红墙
        let nearFence = false;

        // 检查玩家是否接近围栏边界
        for (let i = 0; i < this.electronicFence.boundaries.length; i++) {
            const current = this.electronicFence.boundaries[i];
            const next = this.electronicFence.boundaries[(i + 1) % this.electronicFence.boundaries.length];
            
            const distance = this.distanceToLineSegment(playerPos.x, playerPos.z, current.x, current.z, next.x, next.z);
            
            if (distance < proximityDistance) {
                nearFence = true;
                break;
            }
        }

        if (nearFence) {
            this.showWarningWalls();
        } else {
            this.clearWarningWalls();
        }
    }

    // 计算点到线段的距离
    distanceToLineSegment(px, pz, x1, z1, x2, z2) {
        const A = px - x1;
        const B = pz - z1;
        const C = x2 - x1;
        const D = z2 - z1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, zz;
        if (param < 0) {
            xx = x1;
            zz = z1;
        } else if (param > 1) {
            xx = x2;
            zz = z2;
        } else {
            xx = x1 + param * C;
            zz = z1 + param * D;
        }

        const dx = px - xx;
        const dz = pz - zz;
        return Math.sqrt(dx * dx + dz * dz);
    }

    // 显示红色警告墙
    showWarningWalls() {
        if (this.electronicFence.warningWalls.length > 0) return; // 已经显示了

        const wallHeight = 3;
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.6,
            emissive: 0x220000
        });

        // 为每个围栏边界创建红墙
        for (let i = 0; i < this.electronicFence.boundaries.length; i++) {
            const current = this.electronicFence.boundaries[i];
            const next = this.electronicFence.boundaries[(i + 1) % this.electronicFence.boundaries.length];
            
            const distance = Math.sqrt(
                Math.pow(next.x - current.x, 2) + Math.pow(next.z - current.z, 2)
            );
            
            const wallGeometry = new THREE.BoxGeometry(distance, wallHeight, 0.2);
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            // 计算墙的位置和旋转
            const centerX = (current.x + next.x) / 2;
            const centerZ = (current.z + next.z) / 2;
            wall.position.set(centerX, wallHeight / 2, centerZ);
            
            const angle = Math.atan2(next.z - current.z, next.x - current.x);
            wall.rotation.y = angle;
            
            this.scene.add(wall);
            this.electronicFence.warningWalls.push(wall);
        }
    }

    // 清除红色警告墙
    clearWarningWalls() {
        this.electronicFence.warningWalls.forEach(wall => {
            this.scene.remove(wall);
        });
        this.electronicFence.warningWalls = [];
    }
}
// 电子围栏管理功能
let fenceDrawingPoints = [];
let isDrawingMode = false;
let fenceMapCanvas = null;
let fenceMapCtx = null;
let globalFenceSettings = {
    enabled: false,
    boundaries: []
};

function loadAdminFence() {
    // 初始化围栏地图画布
    setTimeout(() => {
        initFenceMapCanvas();
        updateFenceStatus();
    }, 100);
    console.log('电子围栏管理界面已加载');
}

function initFenceMapCanvas() {
    fenceMapCanvas = document.getElementById('fenceMapCanvas');
    if (!fenceMapCanvas) return;
    
    fenceMapCtx = fenceMapCanvas.getContext('2d');
    
    // 绘制基础地图
    drawBaseMap();
    
    // 添加点击事件监听
    fenceMapCanvas.addEventListener('click', handleMapClick);
    
    // 绘制现有围栏（如果有）
    if (globalFenceSettings.boundaries.length > 0) {
        drawFenceOnMap(globalFenceSettings.boundaries);
    }
}

function drawBaseMap() {
    if (!fenceMapCtx) return;
    
    const canvas = fenceMapCanvas;
    const ctx = fenceMapCtx;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制草地背景
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制道路网格
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    
    // 主要道路
    ctx.beginPath();
    // 横向主干道
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    // 纵向主干道
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // 次要道路
    ctx.lineWidth = 1;
    const roadSpacing = canvas.width / 6;
    for (let i = 1; i < 6; i++) {
        if (i !== 3) { // 跳过中心线
            // 横向道路
            ctx.beginPath();
            ctx.moveTo(0, i * roadSpacing);
            ctx.lineTo(canvas.width, i * roadSpacing);
            ctx.stroke();
            
            // 纵向道路
            ctx.beginPath();
            ctx.moveTo(i * roadSpacing, 0);
            ctx.lineTo(i * roadSpacing, canvas.height);
            ctx.stroke();
        }
    }
    
    // 绘制边界
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // 添加坐标标记
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('-100', 5, 15);
    ctx.fillText('100', canvas.width - 25, 15);
    ctx.fillText('-100', 5, canvas.height - 5);
    ctx.fillText('100', canvas.width - 25, canvas.height - 5);
}

function handleMapClick(event) {
    if (!isDrawingMode) return;
    
    const rect = fenceMapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 转换为游戏坐标 (-100 到 100)
    const gameX = Math.round((x / fenceMapCanvas.width) * 200 - 100);
    const gameZ = Math.round((y / fenceMapCanvas.height) * 200 - 100);
    
    // 添加点到绘制数组
    fenceDrawingPoints.push({ x: gameX, z: gameZ });
    
    // 重绘地图
    drawBaseMap();
    drawFenceOnMap(fenceDrawingPoints);
    
    showMessage(`已添加围栏点 (${gameX}, ${gameZ})`, 'info');
}

function drawFenceOnMap(points) {
    if (!fenceMapCtx || points.length === 0) return;
    
    const ctx = fenceMapCtx;
    const canvas = fenceMapCanvas;
    
    // 绘制围栏点
    ctx.fillStyle = '#0066ff';
    points.forEach(point => {
        const canvasX = ((point.x + 100) / 200) * canvas.width;
        const canvasY = ((point.z + 100) / 200) * canvas.height;
        
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // 绘制围栏线
    if (points.length > 1) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const firstPoint = points[0];
        const firstX = ((firstPoint.x + 100) / 200) * canvas.width;
        const firstY = ((firstPoint.z + 100) / 200) * canvas.height;
        ctx.moveTo(firstX, firstY);
        
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            const canvasX = ((point.x + 100) / 200) * canvas.width;
            const canvasY = ((point.z + 100) / 200) * canvas.height;
            ctx.lineTo(canvasX, canvasY);
        }
        
        // 如果有3个或更多点，闭合围栏
        if (points.length >= 3) {
            ctx.lineTo(firstX, firstY);
        }
        
        ctx.stroke();
    }
}

function updateFenceStatus() {
    const fenceToggleBtn = document.getElementById('fenceToggleBtn');
    const fenceStatus = document.getElementById('fenceStatus');
    
    if (!fenceToggleBtn || !fenceStatus) return;
    
    if (globalFenceSettings.enabled) {
        fenceToggleBtn.textContent = '禁用围栏';
        fenceToggleBtn.className = 'btn-danger';
        fenceStatus.textContent = '已启用';
        fenceStatus.style.color = '#ff4444';
    } else {
        fenceToggleBtn.textContent = '启用围栏';
        fenceToggleBtn.className = 'btn-success';
        fenceStatus.textContent = '未启用';
        fenceStatus.style.color = '#888';
    }
}

function toggleElectronicFence() {
    globalFenceSettings.enabled = !globalFenceSettings.enabled;
    
    // 如果游戏正在运行，同步到围栏系统
    if (globalFenceSystem) {
        globalFenceSystem.enabled = globalFenceSettings.enabled;
        if (globalFenceSettings.enabled && globalFenceSettings.boundaries.length > 0) {
            globalFenceSystem.setBoundaries(globalFenceSettings.boundaries, true);
            globalFenceSystem.createVisualization();
        } else {
            globalFenceSystem.clearWarningWalls();
        }
    }
    
    updateFenceStatus();
    
    if (globalFenceSettings.enabled) {
        showMessage('电子围栏已启用！普通玩家将被限制在围栏内', 'success');
    } else {
        showMessage('电子围栏已禁用', 'info');
    }
}

function startDrawingFence() {
    isDrawingMode = !isDrawingMode;
    const drawBtn = document.getElementById('drawFenceBtn');
    
    if (isDrawingMode) {
        drawBtn.textContent = '停止绘制';
        drawBtn.className = 'btn-danger';
        fenceMapCanvas.classList.add('drawing');
        showMessage('绘制模式已激活，点击地图添加围栏点', 'info');
    } else {
        drawBtn.textContent = '开始绘制';
        drawBtn.className = 'btn-primary';
        fenceMapCanvas.classList.remove('drawing');
        showMessage('绘制模式已关闭', 'info');
    }
}

function clearFenceDrawing() {
    fenceDrawingPoints = [];
    drawBaseMap();
    showMessage('围栏绘制已清空', 'info');
}

function applyDrawnFence() {
    if (fenceDrawingPoints.length < 3) {
        showMessage('至少需要3个点才能形成有效围栏', 'error');
        return;
    }
    
    // 保存围栏设置
    globalFenceSettings.boundaries = [...fenceDrawingPoints];
    globalFenceSettings.enabled = true;
    
    // 如果游戏正在运行，同步到围栏系统
    if (globalFenceSystem) {
        globalFenceSystem.setBoundaries(globalFenceSettings.boundaries, true);
        globalFenceSystem.createVisualization();
    }
    
    updateFenceStatus();
    showMessage(`围栏已应用！包含 ${fenceDrawingPoints.length} 个边界点`, 'success');
    
    // 停止绘制模式
    if (isDrawingMode) {
        startDrawingFence();
    }
}

function setPresetFence(type) {
    let boundaries = [];
    
    switch (type) {
        case 'small':
            boundaries = [
                { x: -20, z: -20 },
                { x: 20, z: -20 },
                { x: 20, z: 20 },
                { x: -20, z: 20 }
            ];
            showMessage('已设置小范围围栏 (40x40)', 'success');
            break;
            
        case 'medium':
            boundaries = [
                { x: -40, z: -40 },
                { x: 40, z: -40 },
                { x: 40, z: 40 },
                { x: -40, z: 40 }
            ];
            showMessage('已设置默认围栏 (80x80)', 'success');
            break;
            
        case 'large':
            boundaries = [
                { x: -80, z: -80 },
                { x: 80, z: -80 },
                { x: 80, z: 80 },
                { x: -80, z: 80 }
            ];
            showMessage('已设置大范围围栏 (160x160)', 'success');
            break;
    }
    
    // 更新绘制点和全局设置
    fenceDrawingPoints = [...boundaries];
    globalFenceSettings.boundaries = [...boundaries];
    globalFenceSettings.enabled = true;
    
    // 重绘地图
    drawBaseMap();
    drawFenceOnMap(fenceDrawingPoints);
    
    // 如果游戏正在运行，同步到游戏渲染器
    if (gameRenderer) {
        gameRenderer.setElectronicFence(boundaries, true);
    }
    
    updateFenceStatus();
}

// 游戏启动时同步围栏设置
function syncFenceToGame() {
    if (globalFenceSystem) {
        // 如果有全局围栏设置，使用全局设置
        if (globalFenceSettings.boundaries.length > 0) {
            globalFenceSystem.setBoundaries(globalFenceSettings.boundaries, globalFenceSettings.enabled);
            globalFenceSystem.createVisualization();
            console.log('已同步围栏设置到游戏:', globalFenceSettings);
        } else {
            // 否则设置一个默认的中等围栏用于测试
            const defaultBoundaries = [
                { x: -40, z: -40 },
                { x: 40, z: -40 },
                { x: 40, z: 40 },
                { x: -40, z: 40 }
            ];
            globalFenceSystem.setBoundaries(defaultBoundaries, false);
            console.log('已设置默认围栏');
        }
    }
}//
 调试和测试围栏功能
function testFenceFunction() {
    console.log('测试围栏功能');
    console.log('当前用户:', currentUser);
    console.log('游戏渲染器:', gameRenderer);
    
    if (gameRenderer) {
        console.log('围栏设置:', gameRenderer.electronicFence);
        
        // 测试围栏检测
        if (gameRenderer.player) {
            const pos = gameRenderer.player.position;
            console.log('玩家位置:', pos.x, pos.z);
            console.log('是否在围栏内:', gameRenderer.isPointInsideFence(pos.x, pos.z));
        }
    }
    
    console.log('全局围栏设置:', globalFenceSettings);
}

// 强制应用围栏设置（用于调试）
function forceApplyFence() {
    if (!gameRenderer) {
        showMessage('请先进入游戏', 'error');
        return;
    }
    
    // 设置一个测试围栏
    const testBoundaries = [
        { x: -30, z: -30 },
        { x: 30, z: -30 },
        { x: 30, z: 30 },
        { x: -30, z: 30 }
    ];
    
    gameRenderer.setElectronicFence(testBoundaries, true);
    globalFenceSettings.boundaries = testBoundaries;
    globalFenceSettings.enabled = true;
    
    showMessage('已强制应用测试围栏 (60x60)', 'success');
    console.log('强制应用围栏:', testBoundaries);
}

// 在控制台添加调试按钮
function addDebugButtons() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer && !document.getElementById('debugButtons')) {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debugButtons';
        debugDiv.innerHTML = `
            <h3>🔧 调试工具</h3>
            <button onclick="testFenceFunction()" class="btn-secondary">测试围栏功能</button>
            <button onclick="forceApplyFence()" class="btn-warning">强制应用测试围栏</button>
        `;
        adminContainer.appendChild(debugDiv);
    }
}// 退出游戏
功能
function exitGame() {
    if (confirm('确定要退出游戏吗？')) {
        // 停止游戏循环
        if (window.gameRenderer) {
            // 清理游戏资源
            const canvas = window.gameRenderer.canvas;
            if (canvas && canvas.parentNode) {
                // 清空画布
                const ctx = canvas.getContext('webgl') || canvas.getContext('2d');
                if (ctx && ctx.clear) {
                    ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
                }
            }
        }
        
        // 重置游戏状态
        window.gameRenderer = null;
        window.gameState = null;
        
        // 返回主界面
        showMain();
        showMessage('已退出游戏');
    }
}// 建筑物碰
撞检测
function checkBuildingCollision(newPosition) {
    if (!gameRenderer || !gameRenderer.buildings) return false;
    
    for (let building of gameRenderer.buildings) {
        const buildingData = building.userData;
        if (!buildingData || !buildingData.isBuilding) continue;
        
        const buildingPos = building.position;
        const halfWidth = buildingData.width / 2;
        const halfDepth = buildingData.depth / 2;
        
        // 检查玩家是否在建筑物内
        const inBuilding = (
            newPosition.x >= buildingPos.x - halfWidth &&
            newPosition.x <= buildingPos.x + halfWidth &&
            newPosition.z >= buildingPos.z - halfDepth &&
            newPosition.z <= buildingPos.z + halfDepth
        );
        
        if (inBuilding) {
            // 检查是否通过门进入
            const doorPos = buildingData.doorPosition;
            const doorWidth = buildingData.doorWidth / 2;
            
            const nearDoor = (
                newPosition.x >= doorPos.x - doorWidth &&
                newPosition.x <= doorPos.x + doorWidth &&
                Math.abs(newPosition.z - doorPos.z) <= 1.5
            );
            
            // 如果不在门附近，则发生碰撞
            if (!nearDoor) {
                return true;
            }
        }
    }
    
    return false;
}

// 修复GameRenderer的checkCollision方法
if (typeof GameRenderer !== 'undefined') {
    GameRenderer.prototype.checkCollision = function(newPosition) {
        // 检查建筑物碰撞
        if (checkBuildingCollision(newPosition)) {
            return true;
        }
        
        // 检查其他障碍物碰撞
        if (this.obstacles) {
            for (let obstacle of this.obstacles) {
                if (obstacle.userData && obstacle.userData.isBuilding) continue; // 建筑物已经检查过了
                
                const distance = newPosition.distanceTo(obstacle.position);
                if (distance < 2) { // 2米碰撞距离
                    return true;
                }
            }
        }
        
        return false;
    };
}