import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState, LoginData, RegisterData } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        loading: false,
      };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 检查用户认证状态
  const checkAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
    } catch (error: any) {
      console.error('Auth check failed:', error.response?.status, error.message);
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_AUTHENTICATED', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login(data);
      
      // 登录接口返回用户信息，直接使用，避免额外的 API 调用
      if (response && response.user) {
        dispatch({ type: 'SET_USER', payload: response.user });
        toast.success('登录成功！');
        return true;
      } else {
        // 如果登录接口没有返回用户信息（不太可能），则调用 getCurrentUser
        console.warn('登录接口未返回用户信息，正在获取用户信息...');
        const user = await authAPI.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });
        toast.success('登录成功！');
        return true;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await authAPI.register(data);
      toast.success('注册成功！请登录');
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } catch (error: any) {
      console.error('Register error:', error);
      const errorData = error.response?.data;
      let errorMessage = '注册失败，请重试';
      
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      toast.error(errorMessage);
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
      dispatch({ type: 'SET_USER', payload: null });
      toast.success('已退出登录');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使API调用失败，也要清除本地状态
      dispatch({ type: 'SET_USER', payload: null });
    }
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};