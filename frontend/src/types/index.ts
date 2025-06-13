export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  real_name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  occupation?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  is_online?: boolean;
  last_seen?: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  created_by: number;
  is_private: boolean;
  member_count: number;
  online_count: number;
  users?: User[];
}

export interface Message {
  id: number;
  content: string;
  message_type: string;
  user_id: number;
  username: string;
  avatar_url: string;
  room_id: number;
  timestamp: string;
  edited_at?: string;
  is_deleted: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginData {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

export interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  user_connected: (data: { user_id: string; username: string }) => void;
  user_disconnected: (data: { user_id: string; username: string }) => void;
  user_joined: (data: { user_id: string; username: string; room_id: string }) => void;
  user_left: (data: { user_id: string; username: string; room_id: string }) => void;
  new_message: (data: Message) => void;
  user_typing: (data: { user_id: string; username: string; room_id: string; is_typing: boolean }) => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}