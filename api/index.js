const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 文件上传配置
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 数据存储（生产环境应使用数据库）
let users = [
  { id: '继父大逃亡官方', username: '继父大逃亡官方', password: bcrypt.hashSync('JFU-game-20250127', 10), coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '陆辰蹊', username: '陆辰蹊', password: bcrypt.hashSync('6422', 10), coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '黄彦钦', username: '黄彦钦', password: bcrypt.hashSync('6410', 10), coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '李毅成', username: '李毅成', password: bcrypt.hashSync('6447', 10), coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '杜孝乾', username: '杜孝乾', password: bcrypt.hashSync('6408', 10), coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '陈禹睿', username: '陈禹睿', password: bcrypt.hashSync('6446', 10), coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '林瀚锜', username: '林瀚锜', password: bcrypt.hashSync('6417', 10), coins: Infinity, isAdmin: true, equipment: [], avatar: null }
];

let posts = [];
let rooms = {};
let equipment = [
  { id: 'speed_boost', name: '速度提升器', price: 50, effect: 'speed+20%' },
  { id: 'invisibility', name: '隐身斗篷', price: 100, effect: '隐身5秒' },
  { id: 'extra_life', name: '额外生命', price: 80, effect: '+1生命' },
  { id: 'shield', name: '防护盾', price: 120, effect: '免疫一次抓捕' }
];

const JWT_SECRET = 'stepfather_game_secret_key_2024';

// 获取本机IP地址
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要登录' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '无效token' });
    req.user = user;
    next();
  });
};

// API路由

// 用户注册
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    coins: 100,
    isAdmin: false,
    equipment: [],
    avatar: null
  };

  users.push(user);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  
  res.json({ token, user: { id: user.id, username: user.username, coins: user.coins, isAdmin: user.isAdmin } });
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, coins: user.coins, isAdmin: user.isAdmin } });
});

// 获取用户信息
app.get('/api/user', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  
  res.json({ 
    id: user.id, 
    username: user.username, 
    coins: user.coins, 
    isAdmin: user.isAdmin,
    equipment: user.equipment || []
  });
});

// 更新用户信息
app.put('/api/user', authenticateToken, async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) return res.status(404).json({ error: '用户不存在' });

  if (username && username !== user.username) {
    if (users.find(u => u.username === username && u.id !== user.id)) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    user.username = username;
  }

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  res.json({ success: true });
});

// 论坛相关API
app.get('/api/posts', (req, res) => {
  res.json(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/posts', authenticateToken, upload.single('image'), (req, res) => {
  const { title, content } = req.body;
  const user = users.find(u => u.id === req.user.id);
  
  const post = {
    id: uuidv4(),
    title,
    content,
    author: user.username,
    authorId: user.id,
    isOfficial: user.isAdmin,
    createdAt: new Date().toISOString(),
    image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null
  };

  posts.push(post);
  res.json(post);
});

// 装备商店API
app.get('/api/equipment', (req, res) => {
  res.json(equipment);
});

app.post('/api/equipment', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user.isAdmin) return res.status(403).json({ error: '权限不足' });

  const { name, price, effect } = req.body;
  const newEquipment = {
    id: uuidv4(),
    name,
    price,
    effect
  };

  equipment.push(newEquipment);
  res.json(newEquipment);
});

app.post('/api/purchase', authenticateToken, (req, res) => {
  const { equipmentId } = req.body;
  const user = users.find(u => u.id === req.user.id);
  const item = equipment.find(e => e.id === equipmentId);

  if (!item) return res.status(404).json({ error: '装备不存在' });
  if (user.coins < item.price) return res.status(400).json({ error: '金币不足' });

  user.coins -= item.price;
  if (!user.equipment) user.equipment = [];
  user.equipment.push(item);

  res.json({ success: true, coins: user.coins });
});

// 获取房间列表
app.get('/api/rooms', (req, res) => {
  const roomList = Object.values(rooms).map(room => ({
    id: room.id,
    name: room.name,
    players: room.players.length,
    maxPlayers: room.maxPlayers,
    gameMode: room.gameMode,
    status: room.status
  }));
  res.json(roomList);
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 创建房间
  socket.on('createRoom', (data, callback) => {
    try {
      // 多途径获取用户信息
      const user = data.user || 
                  socket.auth || 
                  socket.handshake.auth || 
                  { id: socket.id, username: '玩家' };
      
      // 解构并设置默认值
      const userId = user.id || socket.id;
      const username = user.username || '玩家';
      
      if (!userId) {
        console.error('用户信息获取失败:', {
          dataUser: data.user,
          socketAuth: socket.auth,
          handshakeAuth: socket.handshake.auth
        });
        throw new Error('无法确定用户身份，请检查登录状态');
      }

      // 设置默认值
      const roomName = data.roomName || `${username}的房间`;
      const gameMode = data.gameMode || 'classic';
      const maxPlayers = Math.min(Math.max(data.maxPlayers || 4, 2), 8); // 限制2-8人

      const roomId = uuidv4();
      
      rooms[roomId] = {
        id: roomId,
        name: roomName,
        gameMode,
        maxPlayers,
        players: [{ 
          id: userId, 
          username: username,
          socketId: socket.id, 
          ready: false 
        }],
        status: 'waiting',
        gameState: null
      };

      socket.join(roomId);
      
      if (typeof callback === 'function') {
        callback({
          success: true,
          room: rooms[roomId],
          message: '房间创建成功'
        });
      }

      io.emit('roomsUpdated', Object.values(rooms));

      socket.join(roomId);
      
      if (typeof callback === 'function') {
        callback({
          success: true,
          room: rooms[roomId],
          message: '房间创建成功'
        });
      }

      io.emit('roomsUpdated', Object.values(rooms));
    } catch (error) {
      console.error('创建房间错误:', error);
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: error.message,
          requiredParams: {
            userId: 'string (必填)',
            roomName: 'string (可选，默认自动生成)',
            gameMode: "string (可选，默认'classic')",
            maxPlayers: "number (可选，默认4，范围2-8)"
          }
        });
      }
    }
  });

  // 加入房间
  socket.on('joinRoom', (data) => {
    const { roomId, userId } = data;
    const room = rooms[roomId];

    if (!room) {
      socket.emit('error', '房间不存在');
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', '房间已满');
      return;
    }

    if (room.players.find(p => p.id === userId)) {
      socket.emit('error', '已在房间中');
      return;
    }

    room.players.push({ id: userId, socketId: socket.id, ready: false });
    socket.join(roomId);
    
    io.to(roomId).emit('playerJoined', { room });
  });

  // 准备游戏
  socket.on('playerReady', (data) => {
    const { roomId, userId } = data;
    const room = rooms[roomId];

    if (!room) return;

    const player = room.players.find(p => p.id === userId);
    if (player) {
      player.ready = !player.ready;
      io.to(roomId).emit('playerReadyUpdate', { room });

      // 检查是否所有人都准备好且人数>=2
      if (room.players.length >= 2 && room.players.every(p => p.ready)) {
        startGame(roomId);
      }
    }
  });

  // 游戏移动
  socket.on('playerMove', (data) => {
    const { roomId, position, rotation } = data;
    socket.to(roomId).emit('playerMoved', {
      playerId: socket.id,
      position,
      rotation
    });
  });

  // 抓捕事件
  socket.on('playerCaught', (data) => {
    const { roomId, caughtPlayerId } = data;
    const room = rooms[roomId];
    
    if (room && room.gameState) {
      handlePlayerCaught(roomId, caughtPlayerId);
    }
  });

  // 进入安全区
  socket.on('enterSafeZone', (data) => {
    const { roomId, playerId } = data;
    const room = rooms[roomId];
    
    if (room && room.gameState) {
      handleSafeZoneEntry(roomId, playerId);
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    // 从所有房间中移除玩家
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('playerLeft', { room });
        }
      }
    });
  });
});

// 游戏逻辑函数
function startGame(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.status = 'playing';
  
  // 根据游戏模式初始化游戏状态
  switch (room.gameMode) {
    case 'classic':
      initClassicGame(room);
      break;
    case 'infection':
      initInfectionGame(room);
      break;
    case 'bodyguard':
      initBodyguardGame(room);
      break;
  }

  io.to(roomId).emit('gameStarted', { gameState: room.gameState });
  
  // 10分钟游戏计时器
  setTimeout(() => {
    endGame(roomId);
  }, 10 * 60 * 1000);
}

function initClassicGame(room) {
  const catcherIndex = Math.floor(Math.random() * room.players.length);
  
  room.gameState = {
    mode: 'classic',
    timeLeft: 600, // 10分钟
    players: room.players.map((player, index) => ({
      ...player,
      role: index === catcherIndex ? 'catcher' : 'runner',
      lives: index === catcherIndex ? 0 : 3,
      safeZoneUses: 2,
      position: getRandomSpawnPosition(),
      caught: false
    }))
  };
}

function initInfectionGame(room) {
  const catcherIndex = Math.floor(Math.random() * room.players.length);
  const medicIndex = Math.floor(Math.random() * room.players.length);
  
  room.gameState = {
    mode: 'infection',
    timeLeft: 600,
    medicSerums: 3,
    players: room.players.map((player, index) => ({
      ...player,
      role: index === catcherIndex ? 'catcher' : 
            index === medicIndex ? 'medic' : 'runner',
      lives: 3,
      safeZoneUses: 2,
      position: getRandomSpawnPosition(),
      caught: false,
      wasOriginalCatcher: index === catcherIndex
    }))
  };
}

function initBodyguardGame(room) {
  const catcherIndex = Math.floor(Math.random() * room.players.length);
  const vipIndex = Math.floor(Math.random() * room.players.length);
  
  room.gameState = {
    mode: 'bodyguard',
    timeLeft: 600,
    players: room.players.map((player, index) => ({
      ...player,
      role: index === catcherIndex ? 'catcher' : 
            index === vipIndex ? 'vip' : 'bodyguard',
      lives: 3,
      safeZoneUses: 0, // 保镖局没有安全区
      position: getRandomSpawnPosition(),
      caught: false
    }))
  };
}

function handlePlayerCaught(roomId, caughtPlayerId) {
  const room = rooms[roomId];
  const gameState = room.gameState;
  const caughtPlayer = gameState.players.find(p => p.id === caughtPlayerId);
  
  if (!caughtPlayer || caughtPlayer.role === 'catcher') return;

  switch (gameState.mode) {
    case 'classic':
      caughtPlayer.lives--;
      if (caughtPlayer.lives <= 0) {
        caughtPlayer.role = 'catcher';
      }
      break;
      
    case 'infection':
      if (caughtPlayer.role === 'runner') {
        caughtPlayer.role = 'catcher';
        caughtPlayer.caught = true;
      }
      break;
      
    case 'bodyguard':
      if (caughtPlayer.role === 'vip') {
        endGame(roomId, 'catcher_wins');
        return;
      }
      break;
  }

  io.to(roomId).emit('playerCaughtUpdate', { gameState });
  checkGameEnd(roomId);
}

function handleSafeZoneEntry(roomId, playerId) {
  const room = rooms[roomId];
  const gameState = room.gameState;
  const player = gameState.players.find(p => p.id === playerId);
  
  if (!player || player.safeZoneUses <= 0 || player.role === 'catcher') return;

  player.safeZoneUses--;
  io.to(roomId).emit('playerEnteredSafeZone', { playerId, usesLeft: player.safeZoneUses });
  
  // 20秒后自动离开安全区
  setTimeout(() => {
    io.to(roomId).emit('playerLeftSafeZone', { playerId });
  }, 20000);
}

function checkGameEnd(roomId) {
  const room = rooms[roomId];
  const gameState = room.gameState;
  
  const runners = gameState.players.filter(p => p.role === 'runner');
  const catchers = gameState.players.filter(p => p.role === 'catcher');
  
  if (gameState.mode === 'classic' || gameState.mode === 'infection') {
    if (runners.length === 0) {
      endGame(roomId, 'catchers_win');
    }
  }
}

function endGame(roomId, result = 'time_up') {
  const room = rooms[roomId];
  if (!room) return;

  room.status = 'finished';
  
  // 计算奖励
  const winners = calculateWinners(room.gameState, result);
  winners.forEach(playerId => {
    const user = users.find(u => u.id === playerId);
    if (user && !user.isAdmin) {
      user.coins += 10;
    }
  });

  io.to(roomId).emit('gameEnded', { result, winners });
  
  // 5秒后重置房间
  setTimeout(() => {
    room.status = 'waiting';
    room.gameState = null;
    room.players.forEach(p => p.ready = false);
    io.to(roomId).emit('roomReset', { room });
  }, 5000);
}

function calculateWinners(gameState, result) {
  switch (gameState.mode) {
    case 'classic':
      if (result === 'time_up') {
        return gameState.players.filter(p => p.role === 'runner').map(p => p.id);
      }
      break;
    case 'infection':
      if (result === 'time_up') {
        return gameState.players.filter(p => p.role === 'runner' || p.role === 'medic').map(p => p.id);
      }
      break;
    case 'bodyguard':
      if (result === 'time_up') {
        return gameState.players.filter(p => p.role === 'vip' || p.role === 'bodyguard').map(p => p.id);
      } else if (result === 'catcher_wins') {
        return gameState.players.filter(p => p.role === 'catcher').map(p => p.id);
      }
      break;
  }
  return [];
}

function getRandomSpawnPosition() {
  return {
    x: Math.random() * 100 - 50,
    y: 0,
    z: Math.random() * 100 - 50
  };
}

function startServer(port) {
  server.listen(port, () => {
    const localIP = getLocalIPAddress();
    console.log(`服务器运行在端口 ${port}`);
    console.log(`本地访问: http://localhost:${port}`);
    console.log(`局域网访问: http://${localIP}:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 被占用，尝试端口 ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('服务器启动失败:', err);
    }
  });
}

// 启动服务器
const initialPort = process.env.PORT || 3001;
startServer(initialPort);

module.exports = app;