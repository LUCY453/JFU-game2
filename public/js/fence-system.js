// 电子围栏系统 - 独立文件
class ElectronicFenceSystem {
    constructor() {
        this.fenceDrawingPoints = [];
        this.isDrawingMode = false;
        this.fenceMapCanvas = null;
        this.fenceMapCtx = null;
        this.globalFenceSettings = {
            enabled: false,
            boundaries: []
        };
    }

    // 初始化围栏管理界面
    loadAdminFence() {
        setTimeout(() => {
            this.initFenceMapCanvas();
            this.updateFenceStatus();
        }, 100);
        console.log('电子围栏管理界面已加载');
    }

    // 初始化地图画布
    initFenceMapCanvas() {
        this.fenceMapCanvas = document.getElementById('fenceMapCanvas');
        if (!this.fenceMapCanvas) return;
        
        this.fenceMapCtx = this.fenceMapCanvas.getContext('2d');
        
        // 绘制基础地图
        this.drawBaseMap();
        
        // 添加点击事件监听
        this.fenceMapCanvas.addEventListener('click', (event) => this.handleMapClick(event));
        
        // 绘制现有围栏（如果有）
        if (this.globalFenceSettings.boundaries.length > 0) {
            this.drawFenceOnMap(this.globalFenceSettings.boundaries);
        }
    }

    // 绘制基础地图
    drawBaseMap() {
        if (!this.fenceMapCtx) return;
        
        const canvas = this.fenceMapCanvas;
        const ctx = this.fenceMapCtx;
        
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

    // 处理地图点击
    handleMapClick(event) {
        if (!this.isDrawingMode) return;
        
        const rect = this.fenceMapCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 转换为游戏坐标 (-100 到 100)
        const gameX = Math.round((x / this.fenceMapCanvas.width) * 200 - 100);
        const gameZ = Math.round((y / this.fenceMapCanvas.height) * 200 - 100);
        
        // 添加点到绘制数组
        this.fenceDrawingPoints.push({ x: gameX, z: gameZ });
        
        // 重绘地图
        this.drawBaseMap();
        this.drawFenceOnMap(this.fenceDrawingPoints);
        
        showMessage(`已添加围栏点 (${gameX}, ${gameZ})`, 'info');
    }

    // 在地图上绘制围栏
    drawFenceOnMap(points) {
        if (!this.fenceMapCtx || points.length === 0) return;
        
        const ctx = this.fenceMapCtx;
        const canvas = this.fenceMapCanvas;
        
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
            ctx.lineWidth = 3;
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

    // 更新围栏状态显示
    updateFenceStatus() {
        const fenceToggleBtn = document.getElementById('fenceToggleBtn');
        const fenceStatus = document.getElementById('fenceStatus');
        
        if (!fenceToggleBtn || !fenceStatus) return;
        
        if (this.globalFenceSettings.enabled) {
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

    // 切换围栏启用状态
    toggleElectronicFence() {
        this.globalFenceSettings.enabled = !this.globalFenceSettings.enabled;
        
        // 同步到游戏渲染器
        this.syncFenceToGame();
        
        // 广播给所有玩家
        this.broadcastFenceSettings();
        
        // 强制更新状态显示
        setTimeout(() => {
            this.updateFenceStatus();
        }, 100);
        
        if (this.globalFenceSettings.enabled) {
            showMessage('电子围栏已启用并同步给所有玩家！', 'success');
        } else {
            showMessage('电子围栏已禁用', 'info');
        }
    }

    // 开始/停止绘制模式
    startDrawingFence() {
        this.isDrawingMode = !this.isDrawingMode;
        const drawBtn = document.getElementById('drawFenceBtn');
        
        if (this.isDrawingMode) {
            drawBtn.textContent = '停止绘制';
            drawBtn.className = 'btn-danger';
            this.fenceMapCanvas.classList.add('drawing');
            showMessage('绘制模式已激活，点击地图添加围栏点', 'info');
        } else {
            drawBtn.textContent = '开始绘制';
            drawBtn.className = 'btn-primary';
            this.fenceMapCanvas.classList.remove('drawing');
            showMessage('绘制模式已关闭', 'info');
        }
    }

    // 清空围栏绘制
    clearFenceDrawing() {
        this.fenceDrawingPoints = [];
        this.drawBaseMap();
        showMessage('围栏绘制已清空', 'info');
    }

    // 应用绘制的围栏
    applyDrawnFence() {
        if (this.fenceDrawingPoints.length < 3) {
            showMessage('至少需要3个点才能形成有效围栏', 'error');
            return;
        }
        
        // 保存围栏设置
        this.globalFenceSettings.boundaries = [...this.fenceDrawingPoints];
        this.globalFenceSettings.enabled = true;
        
        // 同步到游戏
        this.syncFenceToGame();
        
        // 广播给所有玩家
        this.broadcastFenceSettings();
        
        this.updateFenceStatus();
        showMessage(`围栏已应用并同步给所有玩家！包含 ${this.fenceDrawingPoints.length} 个边界点`, 'success');
        
        // 停止绘制模式
        if (this.isDrawingMode) {
            this.startDrawingFence();
        }
    }

    // 设置预设围栏
    setPresetFence(type) {
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
        this.fenceDrawingPoints = [...boundaries];
        this.globalFenceSettings.boundaries = [...boundaries];
        this.globalFenceSettings.enabled = true;
        
        // 重绘地图
        this.drawBaseMap();
        this.drawFenceOnMap(this.fenceDrawingPoints);
        
        // 同步到游戏
        this.syncFenceToGame();
        
        // 广播给所有玩家
        this.broadcastFenceSettings();
        
        this.updateFenceStatus();
    }

    // 同步围栏设置到游戏
    syncFenceToGame() {
        if (window.gameRenderer && this.globalFenceSettings.boundaries.length > 0) {
            console.log('同步围栏到游戏:', this.globalFenceSettings);
            window.gameRenderer.setElectronicFence(
                this.globalFenceSettings.boundaries, 
                this.globalFenceSettings.enabled
            );
            
            // 强制更新状态显示
            setTimeout(() => {
                this.updateFenceStatus();
            }, 200);
        }
    }

    // 广播围栏设置给所有玩家
    broadcastFenceSettings() {
        // 如果有socket连接，广播围栏设置给所有玩家
        if (typeof socket !== 'undefined' && socket) {
            socket.emit('fenceUpdate', {
                enabled: this.globalFenceSettings.enabled,
                boundaries: this.globalFenceSettings.boundaries
            });
            console.log('围栏设置已广播给所有玩家');
        } else {
            console.warn('Socket连接不可用，无法广播围栏设置');
        }
    }

    // 接收其他玩家的围栏设置
    receiveFenceUpdate(fenceData) {
        console.log('接收到围栏更新:', fenceData);
        this.globalFenceSettings.enabled = fenceData.enabled;
        this.globalFenceSettings.boundaries = fenceData.boundaries;
        
        // 如果游戏正在运行，立即应用围栏
        if (window.gameRenderer) {
            window.gameRenderer.setElectronicFence(fenceData.boundaries, fenceData.enabled);
        }
        
        // 更新管理员控制台显示
        if (document.getElementById('adminScreen').classList.contains('active')) {
            this.updateFenceStatus();
            if (this.fenceMapCanvas) {
                this.fenceDrawingPoints = [...fenceData.boundaries];
                this.drawBaseMap();
                this.drawFenceOnMap(this.fenceDrawingPoints);
            }
        }
        
        showMessage('围栏设置已更新', 'info');
    }

    // 获取围栏设置（供游戏使用）
    getFenceSettings() {
        return this.globalFenceSettings;
    }
}

// 创建全局围栏系统实例
window.fenceSystem = new ElectronicFenceSystem();

// 全局函数（供HTML调用）
function loadAdminFence() {
    window.fenceSystem.loadAdminFence();
}

function toggleElectronicFence() {
    window.fenceSystem.toggleElectronicFence();
}

function startDrawingFence() {
    window.fenceSystem.startDrawingFence();
}

function clearFenceDrawing() {
    window.fenceSystem.clearFenceDrawing();
}

function applyDrawnFence() {
    window.fenceSystem.applyDrawnFence();
}

function setPresetFence(type) {
    window.fenceSystem.setPresetFence(type);
}

function syncFenceToGame() {
    window.fenceSystem.syncFenceToGame();
}// Socket事
件监听初始化
function initSocketFenceEvents() {
    if (typeof socket !== 'undefined' && socket) {
        socket.on('fenceUpdate', (fenceData) => {
            if (window.fenceSystem) {
                window.fenceSystem.receiveFenceUpdate(fenceData);
            }
        });
        console.log('围栏Socket事件监听已初始化');
    } else {
        console.warn('Socket不可用，围栏同步功能受限');
    }
}

// 在页面加载完成后初始化Socket事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initSocketFenceEvents, 1000);
    });
} else {
    setTimeout(initSocketFenceEvents, 1000);
}

// 导出函数供其他模块使用
window.initSocketFenceEvents = initSocketFenceEvents;