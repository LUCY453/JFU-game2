// 游戏服务器模拟 - 前端实现

// 数据存储
let users = [
  { id: '继父大逃亡官方', username: '继父大逃亡官方', password: 'JFU-game', coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '陆辰蹊', username: '陆辰蹊', password: 'lcx20120928', coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '黄彦钦', username: '黄彦钦', password: '6410', coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '李毅成', username: '李毅成', password: '6447', coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '杜孝乾', username: '杜孝乾', password: '6408', coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '陈禹睿', username: '陈禹睿', password: '6446', coins: Infinity, isAdmin: true, equipment: [], avatar: null },
  { id: '林瀚锜', username: '林瀚锜', password: '6417', coins: Infinity, isAdmin: true, equipment: [], avatar: null }
];

let posts = [];
let rooms = {};
let equipment = [
  { id: 'speed_boost', name: '速度提升器', price: 50, effect: 'speed+20%' },
  { id: 'invisibility', name: '隐身斗篷', price: 100, effect: '隐身5秒' },
  { id: 'extra_life', name: '额外生命', price: 80, effect: '+1生命' },
  { id: 'shield', name: '防护盾', price: 120, effect: '免疫一次抓捕' }
];

// 游戏状态管理
class GameServer {
  constructor() {
    this.connectedPlayers = new Map();
    this.eventListeners = {};
  }
  
  // 模拟Socket.IO事件系统
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  emit(event, data) {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  // 房间管理
  createRoom(roomName, gameMode, maxPlayers, userId) {
    const roomId = this.generateId();
    rooms[roomId] = {
      id: roomId,
      name: roomName,
      gameMode,
      maxPlayers,
      players: [{ id: userId, ready: false }],
      status: 'waiting',
      gameState: null
    };
    
    this.emit('roomCreated', { roomId, room: rooms[roomId] });
    return roomId;
  }
  
  joinRoom(roomId, userId) {
    const room = rooms[roomId];
    if (!room) throw new Error('房间不存在');
    if (room.players.length >= room.maxPlayers) throw new Error('房间已满');
    if (room.players.some(p => p.id === userId)) throw new Error('已在房间中');
    
    room.players.push({ id: userId, ready: false });
    this.emit('playerJoined', { room });
  }
  
  // 游戏逻辑
  startGame(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    room.status = 'playing';
    
    switch (room.gameMode) {
      case 'classic':
        this.initClassicGame(room);
        break;
      case 'infection':
        this.initInfectionGame(room);
        break;
      case 'bodyguard':
        this.initBodyguardGame(room);
        break;
    }
    
    this.emit('gameStarted', { gameState: room.gameState });
    
    // 10分钟游戏计时器
    setTimeout(() => {
      this.endGame(roomId);
    }, 10 * 60 * 1000);
  }
  
  initClassicGame(room) {
    const catcherIndex = Math.floor(Math.random() * room.players.length);
    
    room.gameState = {
      mode: 'classic',
      timeLeft: 600,
      players: room.players.map((player, index) => ({
        ...player,
        role: index === catcherIndex ? 'catcher' : 'runner',
        lives: index === catcherIndex ? 0 : 3,
        safeZoneUses: 2,
        position: this.getRandomSpawnPosition(),
        caught: false
      }))
    };
  }
  
  // ...其他游戏模式初始化方法
  
  // 辅助方法
  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
  
  getRandomSpawnPosition() {
    return {
      x: Math.random() * 100 - 50,
      y: 0,
      z: Math.random() * 100 - 50
    };
  }
}

// 创建全局游戏服务器实例
const gameServer = new GameServer();

// 导出API
export {
  users,
  posts,
  rooms,
  equipment,
  gameServer
};