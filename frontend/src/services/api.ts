import axios from 'axios';
import { LoginData, RegisterData, User, ChatRoom, Message } from '../types';

// 动态获取API基础URL的函数
const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 如果没有设置环境变量，则根据当前页面的host动态构建
  const { protocol, hostname } = window.location;
  
  // 如果是localhost或127.0.0.1，保持原样
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // 否则使用当前页面的hostname，端口5000
  return `${protocol}//${hostname}:5000`;
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 专门用于身份验证检查的axios实例，不跟随重定向
const authCheckApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 0, // 不自动跟随重定向
  validateStatus: function (status) {
    // 只有200状态码才被认为是成功，其他都会抛出错误
    return status === 200;
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 只在非身份验证检查的情况下重定向
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/profile')) {
      // 未授权，重定向到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginData) => {
    const response = await api.post('/api/auth/login', {
      username: data.username,
      password: data.password,
      remember_me: data.remember_me || false,
    });
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/api/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
      password2: data.password2,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/check');
    if (response.data.authenticated) {
      return response.data.user;
    } else {
      const error = new Error('User not authenticated');
      (error as any).response = { status: 401 };
      throw error;
    }
  },

  updateProfile: async (data: FormData) => {
    const response = await api.post('/auth/profile/edit', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const chatAPI = {
  getRooms: async (): Promise<ChatRoom[]> => {
    const response = await api.get('/api/rooms');
    // 合并用户房间和公共房间
    const { user_rooms = [], public_rooms = [] } = response.data;
    // 去重，优先显示用户房间
    const userRoomIds = new Set(user_rooms.map((room: ChatRoom) => room.id));
    const uniquePublicRooms = public_rooms.filter((room: ChatRoom) => !userRoomIds.has(room.id));
    return [...user_rooms, ...uniquePublicRooms];
  },

  getRoom: async (roomId: number): Promise<ChatRoom> => {
    const response = await api.get(`/api/rooms/${roomId}`);
    return response.data.room;
  },

  createRoom: async (
    name: string,
    description?: string,
    is_private: boolean = false,
    password?: string
  ): Promise<ChatRoom> => {
    const response = await api.post('/api/rooms', {
      name,
      description,
      is_private,
      password
    });
    return response.data.room;
  },
  

  joinRoom: async (roomId: number, password?: string) => {
    const response = await api.post(`/api/rooms/${roomId}/join`, { password });
    return response.data;
  },
  

  leaveRoom: async (roomId: number) => {
    const response = await api.post(`/api/rooms/${roomId}/leave`);
    return response.data;
  },

  getMessages: async (roomId: number, page: number = 1, limit: number = 50): Promise<Message[]> => {
    const response = await api.get(`/api/rooms/${roomId}/messages`, {
      params: { page, per_page: limit }
    });
    return response.data.messages || [];
  },
};

export default api; 