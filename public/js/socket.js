// Socket.IO 连接管理
let socket = null;
let currentRoom = null;
let gameState = null;

// 初始化Socket连接
function initSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io('/', {
        auth: {
            token: token
        }
    });

    // Socket事件监听
    socket.on('connect', () => {
        console.log('Socket连接成功');
        showMessage('网络连接正常');
    });

    socket.on('disconnect', () => {
        console.log('Socket连接断开');
        showMessage('网络连接断开，请检查网络', 'error');
    });

    socket.on('roomCreated', (data) => {
        currentRoom = data.room;
        showGameRoom();
        updateRoomDisplay();
    });

    socket.on('playerJoined', (data) => {
        currentRoom = data.room;
        updateRoomDisplay();
        showMessage('玩家加入房间');
    });

    socket.on('playerLeft', (data) => {
        currentRoom = data.room;
        updateRoomDisplay();
        showMessage('玩家离开房间');
    });

    socket.on('playerReadyUpdate', (data) => {
        currentRoom = data.room;
        updateRoomDisplay();
    });

    socket.on('gameStarted', (data) => {
        gameState = data.gameState;
        startGameScreen();
        showMessage('游戏开始！');
    });

    socket.on('playerMoved', (data) => {
        if (gameState && gameRenderer) {
            gameRenderer.updatePlayerPosition(data.playerId, data.position, data.rotation);
        }
    });

    socket.on('playerCaughtUpdate', (data) => {
        gameState = data.gameState;
        updateGameUI();
        showMessage('玩家被抓住！');
    });

    socket.on('playerEnteredSafeZone', (data) => {
        showMessage(`玩家进入安全区，剩余${data.usesLeft}次使用机会`);
    });

    socket.on('playerLeftSafeZone', (data) => {
        showMessage('玩家离开安全区');
    });

    socket.on('gameEnded', (data) => {
        handleGameEnd(data.result, data.winners);
    });

    socket.on('roomReset', (data) => {
        currentRoom = data.room;
        updateRoomDisplay();
        showMessage('房间已重置');
    });

    socket.on('roomsUpdate', () => {
        console.log('收到房间更新事件，刷新房间列表');
        // 无论当前屏幕是否为房间列表，都尝试刷新房间数据
        // 对官方账号特别处理，始终更新房间状态
        const user = JSON.parse(localStorage.getItem('user'));
        const isOfficialAccount = user && user.role === 'official';
        
        if (document.getElementById('roomsScreen').classList.contains('active') || isOfficialAccount) {
            loadRoomsList();
        }
    });

    socket.on('timeUpdate', (data) => {
        if (gameState) {
            gameState.timeLeft = data.timeLeft;
            updateGameTimer();
        }
    });

    socket.on('medicHealUpdate', (data) => {
        gameState = data.gameState;
        updateGameUI();
        showMessage(`医护人员治疗成功！剩余血清：${data.serumsLeft}`);
    });

    socket.on('error', (error) => {
        showMessage(error, 'error');
    });

    socket.on('chatMessage', (data) => {
        addChatMessage(data.username, data.message);
    });
}

// 创建房间
function createRoom(roomName, gameMode, maxPlayers) {
    console.log('createRoom called with:', {roomName, gameMode, maxPlayers});
    
    if (!socket) {
        console.error('Socket连接不存在，无法创建房间');
        showMessage('网络连接错误', 'error');
        return;
    }

    if (!socket.connected) {
        console.error('Socket未连接，无法创建房间');
        showMessage('网络连接未就绪，请稍候重试', 'error');
        return;
    }

    // 验证输入参数
    if (!roomName || !gameMode || !maxPlayers) {
        console.error('房间参数不完整:', {
            roomName: typeof roomName,
            gameMode: typeof gameMode,
            maxPlayers: typeof maxPlayers,
            actualValues: {roomName, gameMode, maxPlayers}
        });
        showMessage(`参数错误: 名称需字符串(${typeof roomName})，模式需字符串(${typeof gameMode})，人数需数字(${typeof maxPlayers})`, 'error');
        return;
    }
    
    // 添加触摸事件支持
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if(isTouchDevice) {
        document.getElementById('createRoomBtn').addEventListener('touchstart', handleCreateRoom, {passive: true});
    }

    // 显示创建中提示
    showMessage('正在创建房间...');

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        console.error('用户信息获取失败', localStorage.getItem('user'));
        showMessage('用户信息获取失败', 'error');
        return;
    }

    console.log('发送创建房间请求:', {
        roomName,
        gameMode,
        maxPlayers: parseInt(maxPlayers),
        userId: user.id
    });

    socket.emit('createRoom', {
        roomName: roomName.trim(),
        gameMode,
        maxPlayers: parseInt(maxPlayers),
        userId: user.id
    }, (response) => {
        showLoading(false);
        
        if (!response) {
            console.error('服务器无响应');
            showMessage('服务器无响应，请检查网络连接', 'error');
            return;
        }

        if (response.success) {
            console.log('房间创建成功:', response);
            currentRoom = response.room;
            
            // 确保房间数据有效
            if (currentRoom && currentRoom.id) {
                showMessage(response.message || '房间创建成功');
                showGameRoom();
                
                // 更新房间列表
                loadRoomsList();
            } else {
                console.error('无效的房间数据:', response);
                showMessage('房间数据无效，请重试', 'error');
            }
        } else {
            console.error('创建房间失败:', response.error);
            showMessage(response.error || '创建房间失败', 'error');
        }
        
        cleanupListener();
    });

    // 添加临时监听器处理此创建请求的结果
    const cleanupListener = () => {
        console.log('清理房间创建监听器');
        socket.off('roomCreated', onSuccess);
        socket.off('error', onError);
    };

    const onSuccess = (data) => {
        console.log('房间创建成功:', data);
        cleanupListener();
        showMessage('房间创建成功！');
    };

    const onError = (error) => {
        console.error('房间创建错误:', error);
        // 处理所有错误，不仅仅是包含'房间'的错误
        cleanupListener();
        showMessage(`房间创建失败: ${error.message || error}`, 'error');
    };

    socket.once('roomCreated', onSuccess);
    socket.once('error', onError);

    // 5秒后如果没有响应，提示超时
    setTimeout(() => {
        console.log('房间创建超时');
        cleanupListener();
        showMessage('房间创建超时，请重试', 'error');
    }, 5000);
}

// 加入房间
function joinRoom(roomId) {
    if (!socket) {
        showMessage('网络连接错误', 'error');
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit('joinRoom', {
        roomId,
        userId: user.id
    });
}

// 玩家准备
function toggleReady() {
    if (!socket || !currentRoom) return;

    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit('playerReady', {
        roomId: currentRoom.id,
        userId: user.id
    });
}

// 离开房间
function leaveRoom() {
    if (socket && currentRoom) {
        socket.disconnect();
        socket = null;
        currentRoom = null;
        gameState = null;
        initSocket();
        showRooms();
    }
}

// 游戏移动
function sendPlayerMove(position, rotation) {
    if (socket && currentRoom) {
        socket.emit('playerMove', {
            roomId: currentRoom.id,
            position: position,
            rotation: rotation
        });
    }
}

// 抓捕玩家
function sendPlayerCaught(caughtPlayerId) {
    if (socket && currentRoom) {
        socket.emit('playerCaught', {
            roomId: currentRoom.id,
            caughtPlayerId: caughtPlayerId
        });
    }
}

// 进入安全区
function sendEnterSafeZone() {
    if (socket && currentRoom) {
        const user = JSON.parse(localStorage.getItem('user'));
        socket.emit('enterSafeZone', {
            roomId: currentRoom.id,
            playerId: user.id
        });
    }
}

// 发送聊天消息
function sendChatMessage(message) {
    if (socket && currentRoom) {
        const user = JSON.parse(localStorage.getItem('user'));
        socket.emit('chatMessage', {
            roomId: currentRoom.id,
            username: user.username,
            message: message
        });
    }
}

// 医护治疗
function sendMedicHeal(targetPlayerId) {
    if (socket && currentRoom) {
        const user = JSON.parse(localStorage.getItem('user'));
        socket.emit('medicHeal', {
            roomId: currentRoom.id,
            medicId: user.id,
            targetId: targetPlayerId
        });
    }
}

// 断开Socket连接
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentRoom = null;
        gameState = null;
    }
}