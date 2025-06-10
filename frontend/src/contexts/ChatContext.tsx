import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode, useRef } from 'react';
import { ChatRoom, Message } from '../types';
import { chatAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Message[];
  onlineUsers: string[];
  typingUsers: string[];
  loading: boolean;
  connected: boolean;
}

interface ChatContextType extends ChatState {
  joinRoom: (roomId: number) => Promise<void>;
  leaveRoom: (roomId: number) => Promise<void>;
  sendMessage: (message: string) => void;
  loadMessages: (roomId: number) => Promise<void>;
  createRoom: (name: string, description?: string) => Promise<ChatRoom | null>;
  setTyping: (isTyping: boolean) => void;
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'SET_CURRENT_ROOM'; payload: ChatRoom | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_ONLINE_USERS'; payload: string[] }
  | { type: 'ADD_ONLINE_USER'; payload: string }
  | { type: 'REMOVE_ONLINE_USER'; payload: string }
  | { type: 'SET_TYPING_USERS'; payload: string[] }
  | { type: 'ADD_TYPING_USER'; payload: string }
  | { type: 'REMOVE_TYPING_USER'; payload: string };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'ADD_ONLINE_USER':
      return {
        ...state,
        onlineUsers: state.onlineUsers.includes(action.payload)
          ? state.onlineUsers
          : [...state.onlineUsers, action.payload],
      };
    case 'REMOVE_ONLINE_USER':
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter(user => user !== action.payload),
      };
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.includes(action.payload)
          ? state.typingUsers
          : [...state.typingUsers, action.payload],
      };
    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(user => user !== action.payload),
      };
    default:
      return state;
  }
};

const initialState: ChatState = {
  rooms: [],
  currentRoom: null,
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  loading: false,
  connected: false,
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const currentRoomRef = useRef<ChatRoom | null>(null);

  // 更新currentRoomRef
  useEffect(() => {
    currentRoomRef.current = state.currentRoom;
  }, [state.currentRoom]);

  // Socket事件处理
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 清理函数
    return () => {
      socketService.removeAllListeners();
    };
  }, [isAuthenticated, user?.id]);

  const setupSocketListeners = useCallback(() => {
    // 新消息
    socketService.onNewMessage((message: Message) => {
      console.log('Received new message:', message);
      
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
      // 如果不是当前用户发送的消息，显示通知
      if (message.user_id !== user?.id) {
        toast.success(`${message.username}: ${message.content.substring(0, 50)}...`);
      }
    });

    // 用户加入/离开
    socketService.onUserJoined((data) => {
      dispatch({ type: 'ADD_ONLINE_USER', payload: data.username });
      toast.success(`${data.username} 加入了聊天室`);
    });

    socketService.onUserLeft((data) => {
      dispatch({ type: 'REMOVE_ONLINE_USER', payload: data.username });
      toast.success(`${data.username} 离开了聊天室`);
    });

    // 用户状态更新
    socketService.onUserStatusUpdate((data) => {
      if (data.is_online) {
        dispatch({ type: 'ADD_ONLINE_USER', payload: data.username });
      } else {
        dispatch({ type: 'REMOVE_ONLINE_USER', payload: data.username });
      }
    });

    // 输入状态
    socketService.onUserTyping((data) => {
      // 后端现在发送的是用户名数组，已经排除了当前用户
      dispatch({ type: 'SET_TYPING_USERS', payload: data.typing_users });
    });

    // 错误处理
    socketService.onError((data) => {
      toast.error(data.message);
    });

    // 房间加入成功
    socketService.onRoomJoined((data) => {
      console.log('Successfully joined room:', data);
      // 更新在线用户列表
      const onlineUsernames = data.online_members.map(member => member.username);
      dispatch({ type: 'SET_ONLINE_USERS', payload: onlineUsernames });
    });

    // 在线用户更新
    socketService.onOnlineUsersUpdate((data) => {
      const onlineUsernames = data.online_users.map(user => user.username);
      dispatch({ type: 'SET_ONLINE_USERS', payload: onlineUsernames });
    });
  }, [user?.id]);

  const connectSocket = useCallback(async (): Promise<void> => {
    try {
      await socketService.connect();
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // 连接成功后设置监听器
      setupSocketListeners();
    } catch (error) {
      console.error('Socket connection failed:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  }, [setupSocketListeners]);

  const disconnectSocket = useCallback((): void => {
    socketService.disconnect();
    dispatch({ type: 'SET_CONNECTED', payload: false });
  }, []);

  const loadMessages = useCallback(async (roomId: number): Promise<void> => {
    try {
      const messages = await chatAPI.getMessages(roomId);
      dispatch({ type: 'SET_MESSAGES', payload: Array.isArray(messages) ? messages : [] });
    } catch (error) {
      console.error('Load messages error:', error);
      toast.error('加载消息失败');
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  }, []);

  const joinRoom = useCallback(async (roomId: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Joining room:', roomId);
      
      // 获取房间信息
      const room = await chatAPI.getRoom(roomId);
      console.log('Got room info:', room);
      dispatch({ type: 'SET_CURRENT_ROOM', payload: room });
      
      // 加载消息
      await loadMessages(roomId);
      console.log('Loaded messages for room:', roomId);
      
      // 加入Socket房间
      console.log('Joining socket room:', roomId);
      socketService.joinRoom(roomId);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Join room error:', error);
      toast.error('加入房间失败');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadMessages]);

  const leaveRoom = useCallback(async (roomId: number): Promise<void> => {
    try {
      socketService.leaveRoom(roomId);
      dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }, []);

  const sendMessage = useCallback((message: string): void => {
    if (!currentRoomRef.current || !message.trim()) return;
    
    socketService.sendMessage(currentRoomRef.current.id, message.trim());
  }, []);

  const createRoom = useCallback(async (name: string, description?: string): Promise<ChatRoom | null> => {
    try {
      const room = await chatAPI.createRoom(name, description);
      dispatch({ type: 'SET_ROOMS', payload: [...state.rooms, room] });
      toast.success('房间创建成功');
      return room;
    } catch (error) {
      console.error('Create room error:', error);
      toast.error('创建房间失败');
      return null;
    }
  }, [state.rooms]);

  const setTyping = useCallback((isTyping: boolean): void => {
    if (!currentRoomRef.current) return;
    socketService.sendTyping(currentRoomRef.current.id, isTyping);
  }, []);

  const value: ChatContextType = {
    ...state,
    joinRoom,
    leaveRoom,
    sendMessage,
    loadMessages,
    createRoom,
    setTyping,
    connectSocket,
    disconnectSocket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 