import React, { useState, useEffect, useRef } from 'react';
import { X, Search, User, MessageCircle, Loader2 } from 'lucide-react';
import { UserWithChatInfo, PrivateChat } from '../../types';
import PrivateChatService from '../../services/privateChatService';
import toast from 'react-hot-toast';

interface CreatePrivateChatModalProps {
  onClose: () => void;
  onChatCreated: (chat: PrivateChat) => void;
}

const CreatePrivateChatModal: React.FC<CreatePrivateChatModalProps> = ({
  onClose,
  onChatCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWithChatInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 搜索用户
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const searchResults = await PrivateChatService.searchUsers(query);
      setUsers(searchResults);
    } catch (error) {
      console.error('搜索用户失败:', error);
      toast.error('搜索用户失败');
    } finally {
      setLoading(false);
    }
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 创建私聊
  const handleCreateChat = async (userId: number) => {
    try {
      setCreating(true);
      setSelectedUserId(userId);
      
      const result = await PrivateChatService.createPrivateChat(userId);
      
      // 构造PrivateChat对象
      const privateChat: PrivateChat = {
        id: result.private_chat.id,
        room_id: result.private_chat.room_id,
        other_user: result.private_chat.other_user,
        created_at: result.private_chat.created_at,
        last_message_at: result.private_chat.last_message_at,
      };
      
      onChatCreated(privateChat);
    } catch (error: any) {
      console.error('创建私聊失败:', error);
      toast.error(error.message || '创建私聊失败');
    } finally {
      setCreating(false);
      setSelectedUserId(null);
    }
  };

  // 处理点击外部关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 自动聚焦搜索框
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
            新建私聊
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 用户列表 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">搜索中...</span>
            </div>
          ) : !searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Search className="w-12 h-12 mb-3 text-gray-300" />
              <p>请输入用户名或邮箱搜索用户</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <User className="w-12 h-12 mb-3 text-gray-300" />
              <p>未找到匹配的用户</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* 头像 */}
                      <div className="flex-shrink-0 relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        {/* 在线状态 */}
                        {user.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* 用户信息 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.username}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex-shrink-0">
                      {user.has_private_chat ? (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          已有私聊
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateChat(user.id)}
                          disabled={creating && selectedUserId === user.id}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {creating && selectedUserId === user.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              创建中...
                            </>
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4 mr-1" />
                              私聊
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            选择用户开始私聊对话
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePrivateChatModal;