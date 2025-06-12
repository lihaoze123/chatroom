import { PrivateChat, UserListResponse, UserWithChatInfo } from '../types';
import { apiRequest } from './api';

export class PrivateChatService {
  /**
   * 获取私聊列表
   */
  static async getPrivateChats(): Promise<PrivateChat[]> {
    try {
      const response = await apiRequest('/api/private-chats', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.private_chats || [];
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取私聊列表失败');
      }
    } catch (error) {
      console.error('获取私聊列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建私聊
   */
  static async createPrivateChat(targetUserId: number): Promise<{
    private_chat: PrivateChat;
    room: any;
  }> {
    try {
      const response = await apiRequest('/api/private-chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: targetUserId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建私聊失败');
      }
    } catch (error) {
      console.error('创建私聊失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表（用于创建私聊）
   */
  static async getUsers(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<UserListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.search) {
        searchParams.append('search', params.search);
      }
      if (params?.page) {
        searchParams.append('page', params.page.toString());
      }
      if (params?.per_page) {
        searchParams.append('per_page', params.per_page.toString());
      }
      
      const url = `/api/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      
      const response = await apiRequest(url, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 搜索用户
   */
  static async searchUsers(query: string): Promise<UserWithChatInfo[]> {
    try {
      const response = await this.getUsers({
        search: query,
        per_page: 10,
      });
      return response.users;
    } catch (error) {
      console.error('搜索用户失败:', error);
      throw error;
    }
  }
}

export default PrivateChatService;