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
    // 改为FastAPI默认端口8000
    return `${protocol}//${hostname}:8000`;
  }
  
  // 开发环境默认使用localhost:8000
  return 'http://localhost:8000';
};

const API_BASE_URL = getBaseURL();

console.log('API Base URL:', API_BASE_URL);

// Token管理函数
const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('access_token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  // 移除withCredentials，使用JWT token认证
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加Authorization头
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除token并重定向到登录页
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginData) => {
    // FastAPI使用form-data格式登录
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // 保存token
    if (response.data.access_token) {
      setToken(response.data.access_token);
    }
    
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/api/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
      // FastAPI不需要password2，在前端验证即可
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      // 无论API调用是否成功，都清除本地token
      removeToken();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
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
    return response.data;
  },
  
  // 上传头像
  uploadAvatar: async (file: File): Promise<{avatar_url: string, user: User}> => {
    const formData = new FormData();
    formData.append('file', file);
    
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
  getRooms: async (): Promise<{user_rooms: ChatRoom[], available_rooms: ChatRoom[]} | ChatRoom[]> => {
    const response = await api.get('/api/rooms/');
    // 返回原始数据结构，让前端组件处理
    if (response.data.user_rooms !== undefined && response.data.available_rooms !== undefined) {
      return {
        user_rooms: response.data.user_rooms || [],
        available_rooms: response.data.available_rooms || []
      };
    }
    return response.data.rooms || response.data;
  },

  getRoom: async (roomId: number): Promise<ChatRoom> => {
    const response = await api.get(`/api/rooms/${roomId}`);
    return response.data.room || response.data;
  },

  createRoom: async (
    name: string,
    description?: string,
    is_private: boolean = false,
    password?: string
  ): Promise<ChatRoom> => {
    const response = await api.post('/api/rooms/', {
      name,
      description,
      is_private,
      password
    });
    return response.data.room || response.data;
  },
  

  joinRoom: async (roomId: number, password?: string) => {
    const requestBody: { password?: string } = {};
    if (password !== undefined && password !== null) {
      requestBody.password = password;
    }
    const response = await api.post(`/api/rooms/${roomId}/join`, requestBody);
    return response.data;
  },
  

  leaveRoom: async (roomId: number) => {
    const response = await api.post(`/api/rooms/${roomId}/leave`);
    return response.data;
  },

  getMessages: async (roomId: number, page: number = 1, limit: number = 50): Promise<Message[]> => {
    const response = await api.get(`/api/messages/${roomId}`, {
      params: { page, limit }
    });
    return response.data.messages || response.data;
  },

  // 添加文件上传方法
  uploadChatFile: async (file: File, type: 'image' | 'file'): Promise<{file_url: string, file_name: string, file_size: number, file_type: string}> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
};

// 导出token管理函数供其他模块使用
export { getToken, setToken, removeToken };

export default api;