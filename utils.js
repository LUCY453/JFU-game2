/**
 * 继父大逃亡游戏 - 工具函数库
 * 包含各种辅助功能和实用工具
 */

/**
 * 生成随机ID
 */
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 格式化时间
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 验证输入数据
 */
function validateInput(data, rules) {
    const errors = [];
    
    for (const field in rules) {
        const value = data[field];
        const rule = rules[field];
        
        if (rule.required && (!value || value.toString().trim() === '')) {
            errors.push(`${field} 是必填项`);
            continue;
        }
        
        if (value && rule.minLength && value.toString().length < rule.minLength) {
            errors.push(`${field} 至少需要 ${rule.minLength} 个字符`);
        }
        
        if (value && rule.maxLength && value.toString().length > rule.maxLength) {
            errors.push(`${field} 不能超过 ${rule.maxLength} 个字符`);
        }
        
        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${field} 格式不正确`);
        }
    }
    
    return errors;
}

/**
 * 深拷贝对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

/**
 * 防抖函数
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 节流函数
 */
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

/**
 * 计算两点之间的距离
 */
function calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 检查两个3D对象是否碰撞
 */
function checkCollision(obj1, obj2, threshold = 1) {
    const distance = calculateDistance(obj1.position, obj2.position);
    return distance < threshold;
}

/**
 * 生成随机位置
 */
function getRandomPosition(minX = -50, maxX = 50, minZ = -50, maxZ = 50) {
    return {
        x: Math.random() * (maxX - minX) + minX,
        y: 0,
        z: Math.random() * (maxZ - minZ) + minZ
    };
}

/**
 * 角度转弧度
 */
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * 弧度转角度
 */
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * 限制数值在指定范围内
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 线性插值
 */
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

/**
 * 检查点是否在圆形区域内
 */
function isPointInCircle(point, center, radius) {
    const distance = calculateDistance(point, center);
    return distance <= radius;
}

/**
 * 获取随机数组元素
 */
function getRandomArrayElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 打乱数组
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 创建事件发射器
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    
    off(event, listener) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(listener);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }
    
    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(listener => {
            listener.apply(this, args);
        });
    }
}

/**
 * 游戏状态管理器
 */
class GameStateManager {
    constructor() {
        this.state = {};
        this.listeners = {};
    }
    
    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => {
                callback(value, oldValue);
            });
        }
    }
    
    getState(key) {
        return this.state[key];
    }
    
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
        
        // 返回取消订阅函数
        return () => {
            const index = this.listeners[key].indexOf(callback);
            if (index > -1) {
                this.listeners[key].splice(index, 1);
            }
        };
    }
}

/**
 * 本地存储管理器
 */
class StorageManager {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('存储失败:', error);
            return false;
        }
    }
    
    static get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('读取存储失败:', error);
            return defaultValue;
        }
    }
    
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除存储失败:', error);
            return false;
        }
    }
    
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空存储失败:', error);
            return false;
        }
    }
}

/**
 * 网络请求管理器
 */
class NetworkManager {
    static async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const token = StorageManager.get('token');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        if (mergedOptions.body && typeof mergedOptions.body === 'object') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }
        
        try {
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('网络请求失败:', error);
            throw error;
        }
    }
    
    static get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    static post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', body: data });
    }
    
    static put(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PUT', body: data });
    }
    
    static delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
    constructor() {
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.updateInterval = 1000; // 1秒更新一次
    }
    
    update() {
        this.frames++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= this.updateInterval) {
            this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
            this.frames = 0;
            this.lastTime = currentTime;
        }
    }
    
    getFPS() {
        return this.fps;
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
            };
        }
        return null;
    }
}

/**
 * 游戏音效管理器
 */
class SoundEffects {
    static createBeep(frequency = 800, duration = 200) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    }
    
    static playJoinSound() {
        this.createBeep(600, 300);
    }
    
    static playLeaveSound() {
        this.createBeep(400, 300);
    }
    
    static playStartSound() {
        this.createBeep(800, 500);
    }
    
    static playEndSound() {
        this.createBeep(300, 1000);
    }
}

/**
 * 颜色工具
 */
class ColorUtils {
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    static randomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }
    
    static lightenColor(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = (num >> 8 & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;
        
        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16);
    }
}

/**
 * 输入验证工具
 */
class ValidationUtils {
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static isValidUsername(username) {
        // 用户名只能包含字母、数字、下划线，长度3-20
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    }
    
    static isValidPassword(password) {
        // 密码至少6位
        return password && password.length >= 6;
    }
    
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
    
    static truncateText(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
}

/**
 * 游戏统计工具
 */
class GameStats {
    constructor() {
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalPlayTime: 0,
            coinsEarned: 0,
            equipmentPurchased: 0,
            postsCreated: 0
        };
        this.loadStats();
    }
    
    loadStats() {
        const saved = StorageManager.get('gameStats');
        if (saved) {
            this.stats = { ...this.stats, ...saved };
        }
    }
    
    saveStats() {
        StorageManager.set('gameStats', this.stats);
    }
    
    incrementStat(statName, amount = 1) {
        if (this.stats.hasOwnProperty(statName)) {
            this.stats[statName] += amount;
            this.saveStats();
        }
    }
    
    getStat(statName) {
        return this.stats[statName] || 0;
    }
    
    getWinRate() {
        if (this.stats.gamesPlayed === 0) return 0;
        return Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
    }
    
    getAveragePlayTime() {
        if (this.stats.gamesPlayed === 0) return 0;
        return Math.round(this.stats.totalPlayTime / this.stats.gamesPlayed);
    }
    
    resetStats() {
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalPlayTime: 0,
            coinsEarned: 0,
            equipmentPurchased: 0,
            postsCreated: 0
        };
        this.saveStats();
    }
}

/**
 * 动画工具
 */
class AnimationUtils {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    static fadeOut(element, duration = 300) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    static slideIn(element, direction = 'right', duration = 300) {
        const originalDisplay = element.style.display || 'block';
        element.style.display = originalDisplay;
        
        // 设置初始位置
        let startPos;
        switch (direction) {
            case 'left':
                startPos = 'translateX(-100%)';
                break;
            case 'right':
                startPos = 'translateX(100%)';
                break;
            case 'top':
                startPos = 'translateY(-100%)';
                break;
            case 'bottom':
                startPos = 'translateY(100%)';
                break;
        }
        
        element.style.transform = startPos;
        element.style.transition = `transform ${duration}ms ease-out`;
        
        // 触发回流，确保过渡效果生效
        void element.offsetWidth;
        
        // 设置目标位置
        element.style.transform = 'translate(0, 0)';
    }
    
    static slideOut(element, direction = 'right', duration = 300) {
        // 设置目标位置
        let endPos;
        switch (direction) {
            case 'left':
                endPos = 'translateX(-100%)';
                break;
            case 'right':
                endPos = 'translateX(100%)';
                break;
            case 'top':
                endPos = 'translateY(-100%)';
                break;
            case 'bottom':
                endPos = 'translateY(100%)';
                break;
        }
        
        element.style.transition = `transform ${duration}ms ease-in`;
        element.style.transform = endPos;
        
        setTimeout(() => {
            element.style.display = 'none';
            element.style.transform = 'translate(0, 0)';
        }, duration);
    }
    
    static pulse(element, scale = 1.1, duration = 300) {
        element.style.transition = `transform ${duration / 2}ms ease-in-out`;
        element.style.transform = `scale(${scale})`;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, duration / 2);
    }
    
    static shake(element, intensity = 5, duration = 500) {
        const originalPosition = element.style.position || 'static';
        const originalLeft = element.style.left;
        const originalTop = element.style.top;
        
        if (originalPosition === 'static') {
            element.style.position = 'relative';
        }
        
        const startTime = performance.now();
        const shakeCount = 6;
        const intervalTime = duration / shakeCount;
        
        let currentShake = 0;
        
        function doShake() {
            if (currentShake >= shakeCount) {
                element.style.position = originalPosition;
                element.style.left = originalLeft;
                element.style.top = originalTop;
                return;
            }
            
            const xOffset = (Math.random() - 0.5) * 2 * intensity;
            const yOffset = (Math.random() - 0.5) * 2 * intensity;
            
            element.style.left = `${xOffset}px`;
            element.style.top = `${yOffset}px`;
            
            currentShake++;
            setTimeout(doShake, intervalTime);
        }
        
        doShake();
    }
}

/**
 * 日期时间工具
 */
class DateTimeUtils {
    static formatDate(date, format = 'YYYY-MM-DD') {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }
    
    static getTimeAgo(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // 差值（秒）
        
        if (diff < 60) {
            return `${diff}秒前`;
        } else if (diff < 3600) {
            return `${Math.floor(diff / 60)}分钟前`;
        } else if (diff < 86400) {
            return `${Math.floor(diff / 3600)}小时前`;
        } else if (diff < 2592000) {
            return `${Math.floor(diff / 86400)}天前`;
        } else if (diff < 31536000) {
            return `${Math.floor(diff / 2592000)}个月前`;
        } else {
            return `${Math.floor(diff / 31536000)}年前`;
        }
    }
    
    static getDaysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
        const diffTime = Math.abs(date2 - date1);
        return Math.round(diffTime / oneDay);
    }
    
    static isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

/**
 * URL参数工具
 */
class UrlUtils {
    static getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    static setQueryParam(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }
    
    static removeQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete(name);
        
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }
    
    static createShareUrl(params = {}) {
        const baseUrl = `${window.location.origin}${window.location.pathname}`;
        const urlParams = new URLSearchParams();
        
        for (const key in params) {
            urlParams.set(key, params[key]);
        }
        
        return `${baseUrl}?${urlParams.toString()}`;
    }
}

/**
 * 设备检测工具
 */
class DeviceUtils {
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    static isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    
    static isAndroid() {
        return /Android/i.test(navigator.userAgent);
    }
    
    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    
    static isChrome() {
        return /chrome/i.test(navigator.userAgent) && !/edge|opr/i.test(navigator.userAgent);
    }
    
    static isFirefox() {
        return /firefox/i.test(navigator.userAgent);
    }
    
    static getBrowserName() {
        if (this.isChrome()) return 'Chrome';
        if (this.isFirefox()) return 'Firefox';
        if (this.isSafari()) return 'Safari';
        
        return 'Unknown';
    }
    
    static getScreenSize() {
        return {
            width: window.screen.width,
            height: window.screen.height
        };
    }
}

/**
 * 数学工具
 */
class MathUtils {
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
    
    static distance2D(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    static angleBetweenPoints(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    static polarToCartesian(radius, angle) {
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        };
    }
    
    static cartesianToPolar(x, y) {
        return {
            radius: Math.sqrt(x * x + y * y),
            angle: Math.atan2(y, x)
        };
    }
}

/**
 * 数组工具
 */
class ArrayUtils {
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    static unique(array) {
        return [...new Set(array)];
    }
    
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    }
    
    static sortBy(array, key, order = 'asc') {
        const sortedArray = [...array];
        
        sortedArray.sort((a, b) => {
            const valueA = typeof key === 'function' ? key(a) : a[key];
            const valueB = typeof key === 'function' ? key(b) : b[key];
            
            if (valueA < valueB) return order === 'asc' ? -1 : 1;
            if (valueA > valueB) return order === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sortedArray;
    }
    
    static findLast(array, predicate) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (predicate(array[i], i, array)) {
                return array[i];
            }
        }
        return undefined;
    }
}

/**
 * 错误处理工具
 */
class ErrorUtils {
    static handleError(error, fallback = null) {
        console.error('Error occurred:', error);
        
        // 记录错误到本地存储
        this.logError(error);
        
        return fallback;
    }
    
    static logError(error) {
        const errorLog = StorageManager.get('errorLog', []);
        
        errorLog.push({
            timestamp: new Date().toISOString(),
            message: error.message || String(error),
            stack: error.stack,
            url: window.location.href
        });
        
        // 限制日志大小
        if (errorLog.length > 50) {
            errorLog.shift();
        }
        
        StorageManager.set('errorLog', errorLog);
    }
    
    static clearErrorLog() {
        StorageManager.remove('errorLog');
    }
    
    static getErrorLog() {
        return StorageManager.get('errorLog', []);
    }
}

/**
 * 导出所有工具函数和类
 */
const Utils = {
    // 函数
    generateId,
    formatTime,
    validateInput,
    deepClone,
    debounce,
    throttle,
    calculateDistance,
    checkCollision,
    getRandomPosition,
    degToRad,
    radToDeg,
    clamp,
    lerp,
    isPointInCircle,
    getRandomArrayElement,
    shuffleArray,
    formatFileSize,
    
    // 类
    EventEmitter,
    GameStateManager,
    StorageManager,
    NetworkManager,
    PerformanceMonitor,
    SoundEffects,
    ColorUtils,
    ValidationUtils,
    GameStats,
    AnimationUtils,
    DateTimeUtils,
    UrlUtils,
    DeviceUtils,
    MathUtils,
    ArrayUtils,
    ErrorUtils
};

// 导出工具库
window.Utils = Utils;