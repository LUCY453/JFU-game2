// 前端数据存储系统

// 从server.js导入数据
import { users, posts, rooms, equipment } from './server.js';

// 本地存储键名
const STORAGE_KEYS = {
  USERS: 'jfu_game_users',
  POSTS: 'jfu_game_posts',
  ROOMS: 'jfu_game_rooms',
  EQUIPMENT: 'jfu_game_equipment'
};

// 初始化数据存储
function initStorage() {
  // 如果本地存储中没有数据，则使用默认数据
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.EQUIPMENT)) {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
  }
}

// 获取数据
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
}

function getPosts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS));
}

function getRooms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS));
}

function getEquipment() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.EQUIPMENT));
}

// 更新数据
function updateUsers(updatedUsers) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
}

function updatePosts(updatedPosts) {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedPosts));
}

function updateRooms(updatedRooms) {
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updatedRooms));
}

function updateEquipment(updatedEquipment) {
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(updatedEquipment));
}

// 初始化存储
initStorage();

// 导出API
export {
  getUsers,
  getPosts,
  getRooms,
  getEquipment,
  updateUsers,
  updatePosts,
  updateRooms,
  updateEquipment
};