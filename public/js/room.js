// 房间管理功能
const roomManager = {
    currentRoom: null,
    isHost: false
};

// 创建房间
function createRoom(roomName) {
    // 检查登录状态
    if (!authModule || !authModule.isLoggedIn()) {
        alert('请先登录');
        return;
    }

    // 这里添加人机验证检查
    if (!validateCaptcha()) {
        alert('请先完成人机验证');
        return;
    }

    // 模拟创建房间
    const currentUser = authModule.getCurrentUser();
    roomManager.currentRoom = {
        id: Date.now().toString(),
        name: roomName,
        host: currentUser,
        players: [currentUser]
    };
    roomManager.isHost = true;

    // 显示房间界面
    showRoomScreen();
    
    // 通知游戏初始化
    if (typeof onRoomCreated === 'function') {
        onRoomCreated();
    }
}

// 加入房间
function joinRoom(roomId) {
    // 模拟加入房间
    roomManager.currentRoom = {
        id: roomId,
        name: '测试房间',
        players: [getCurrentUser(), {id: 'host', name: '房主'}]
    };
    roomManager.isHost = false;

    // 显示房间界面
    showRoomScreen();
    
    // 通知游戏初始化
    if (typeof onRoomJoined === 'function') {
        onRoomJoined();
    }
}

// 显示房间界面
function showRoomScreen() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('roomScreen').style.display = 'block';
    
    // 更新房间标题
    const roomTitle = document.getElementById('room-title');
    if (roomTitle && roomManager.currentRoom) {
        const hostName = roomManager.currentRoom.host?.name || '玩家';
        roomTitle.textContent = `${hostName}的房间`;
    }
    
    // 更新玩家列表
    const playerList = document.getElementById('player-list');
    if (playerList && roomManager.currentRoom?.players) {
        playerList.innerHTML = '';
        roomManager.currentRoom.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name || '未知玩家';
            if (player.id === roomManager.currentRoom.host?.id) {
                li.textContent += ' (房主)';
                li.style.fontWeight = 'bold';
            }
            playerList.appendChild(li);
        });
    }
    
    // 显示开始游戏按钮(仅对房主)
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.style.display = roomManager.isHost ? 'block' : 'none';
    }
}

// 获取当前用户
function getCurrentUser() {
    return {
        id: 'user_' + Date.now(),
        name: '玩家'
    };
}

// 人机验证检查
function validateCaptcha() {
    // 这里实现人机验证逻辑
    // 返回true表示验证通过
    return true; // 暂时总是返回true，实际应实现验证逻辑
}

// 导出函数供HTML调用
window.confirmCreateRoom = function() {
    const roomName = document.getElementById('roomName').value || '未命名房间';
    createRoom(roomName);
};

window.showRooms = function() {
    document.getElementById('createRoomScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'block';
};