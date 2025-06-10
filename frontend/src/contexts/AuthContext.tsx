import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
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
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Starting auth check...');
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log('Calling getCurrentUser...');
        const user = await authAPI.getCurrentUser();
        console.log('Got user:', user);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error: any) {
        console.log('Auth check failed:', error.response?.status, error.message);
        // 如果是401或302，说明用户未登录，这是正常情况
        if (error.response?.status === 401 || error.response?.status === 302) {
          console.log('User not authenticated, setting user to null');
          dispatch({ type: 'SET_USER', payload: null });
        } else {
          // 其他错误也设置为未登录状态
          console.error('Auth check error:', error);
          dispatch({ type: 'SET_USER', payload: null });
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await authAPI.login(data);
      
      // 登录成功后获取用户信息
      const user = await authAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
      
      toast.success('登录成功！');
      return true;
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
      toast.error(error.response?.data?.message || '注册失败，请重试');
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