// 网络通信模块
import io from 'socket.io-client';

export default class Network {
  constructor() {
    this.socket = io('http://localhost:3001');
    this.initEventHandlers();
  }

  initEventHandlers() {
    // 玩家状态同步
    this.socket.on('playerUpdate', (players) => {
      window.dispatchEvent(new CustomEvent('playerStateUpdate', { detail: players }));
    });

    // 房间状态更新
    this.socket.on('roomUpdate', (room) => {
      window.dispatchEvent(new CustomEvent('roomStateUpdate', { detail: room }));
    });

    // 错误处理
    this.socket.on('connect_error', (err) => {
      console.error('连接服务器失败:', err);
      window.dispatchEvent(new Event('serverConnectionError'));
    });
  }

  // 发送准备状态
  sendReadyState(isReady) {
    this.socket.emit('playerReady', { isReady });
  }

  // 加入房间
  joinRoom(roomId) {
    this.socket.emit('joinRoom', { roomId });
  }
}