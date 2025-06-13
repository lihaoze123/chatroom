import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

// 获取Socket服务器URL
const getSocketURL = (): string => {
  // 优先使用环境变量
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
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

class SocketService {
  private socket: Socket | null = null;
  private readonly url: string;

  constructor() {
    this.url = getSocketURL();
    console.log('Socket URL:', this.url);
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        timeout: 20000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        console.log('Socket transport:', this.socket?.io.engine.transport.name);
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Error details:', error.message);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 房间相关事件
  joinRoom(roomId: number) {
    if (this.socket) {
      console.log('Emitting join_room event for room:', roomId);
      this.socket.emit('join_room', { room_id: roomId });
    } else {
      console.error('Socket not connected when trying to join room:', roomId);
    }
  }

  leaveRoom(roomId: number) {
    if (this.socket) {
      this.socket.emit('leave_room', { room_id: roomId });
    }
  }

  // 消息相关事件
  sendMessage(roomId: number, message: string, messageType?: string, fileInfo?: any) {
    if (this.socket) {
      console.log('Sending message to room:', roomId, 'message:', message, 'type:', messageType);
      const messageData: any = {
        room_id: roomId,
        content: message,
      };
      
      if (messageType) {
        messageData.message_type = messageType;
      }
      
      if (fileInfo) {
        messageData.file_url = fileInfo.url;
        messageData.file_name = fileInfo.name;
        messageData.file_size = fileInfo.size;
      }
      
      this.socket.emit('send_message', messageData);
    } else {
      console.error('Socket not connected when trying to send message');
    }
  }

  // 输入状态
  sendTyping(roomId: number, isTyping: boolean) {
    if (this.socket) {
      const eventName = isTyping ? 'typing_start' : 'typing_stop';
      this.socket.emit(eventName, {
        room_id: roomId,
      });
    }
  }

  // 事件监听器
  onNewMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('new_message', (message: Message) => {
        console.log('Socket received new_message event:', message);
        callback(message);
      });
    }
  }

  onUserJoined(callback: (data: { user_id: string; username: string; room_id: string }) => void) {
    if (this.socket) {
      this.socket.on('user_joined', callback);
    }
  }

  onUserLeft(callback: (data: { user_id: string; username: string; room_id: string }) => void) {
    if (this.socket) {
      this.socket.on('user_left', callback);
    }
  }

  onUserTyping(callback: (data: { room_id: number; typing_users: string[] }) => void) {
    if (this.socket) {
      this.socket.on('typing_update', callback);
    }
  }

  onUserStatusUpdate(callback: (data: { user_id: number; username: string; is_online: boolean }) => void) {
    if (this.socket) {
      this.socket.on('user_status_update', callback);
    }
  }

  onError(callback: (data: { message: string }) => void) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  onRoomJoined(callback: (data: { room_id: number; room_name: string; member_count: number; online_members: any[] }) => void) {
    if (this.socket) {
      this.socket.on('room_joined', callback);
    }
  }

  onOnlineUsersUpdate(callback: (data: { room_id?: number; online_users: any[] }) => void) {
    if (this.socket) {
      this.socket.on('online_users_update', callback);
    }
  }

  onUserAvatarUpdated(callback: (data: { user_id: number; username: string; avatar_url: string }) => void) {
    if (this.socket) {
      this.socket.on('user_avatar_updated', callback);
    }
  }

  emitAvatarUpdated(avatarUrl: string) {
    if (this.socket) {
      this.socket.emit('avatar_updated', { avatar_url: avatarUrl });
    }
  }

  // 移除事件监听器
  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // 移除所有监听器
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
export default socketService;