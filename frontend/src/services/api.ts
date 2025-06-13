import axios from 'axios';
import { LoginData, RegisterData, User, ChatRoom, Message } from '../types';

// 获取API基础URL
const getBaseURL = (): string => {
  // 优先使用环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 在生产环境或局域网环境下，使用当前页面的host
  if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5000`;
  }
  
  // 开发环境默认使用localhost
  return 'http://localhost:5000';
};

const API_BASE_URL = getBaseURL();

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 专门用于身份验证检查的axios实例，不跟随重定向
// const authCheckApi = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   maxRedirects: 0, // 不自动跟随重定向
//   validateStatus: function (status) {
//     // 只有200状态码才被认为是成功，其他都会抛出错误
//     return status === 200;
//   },
// });

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
    const response = await api.post('/api/auth/profile/edit', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 更新用户信息
  updateUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put('/api/auth/profile', userData);
    return response.data.user;
  },
  
  // 上传头像
  uploadAvatar: async (file: File): Promise<{avatar_url: string, user: User}> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/api/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserProfile: async (userId: number): Promise<User> => {
    const response = await api.get(`/api/users/${userId}/profile`);
    return response.data.user;
  },
};

export const chatAPI = {
  getRooms: async (): Promise<ChatRoom[]> => {
    const response = await api.get('/api/rooms');
    // 合并用户房间和可用房间
    const { user_rooms = [], available_rooms = [] } = response.data;
    // 用户房间优先显示，然后是可用房间（包括公共和私密房间）
    return [...user_rooms, ...available_rooms];
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

  // 添加文件上传方法
  uploadChatFile: async (file: File, type: 'image' | 'file'): Promise<{file_url: string, file_name: string, file_size: number, file_type: string}> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.post('/api/upload/chat-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
};

export default api;