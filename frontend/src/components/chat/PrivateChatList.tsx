import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Plus, User, Clock, Shield } from 'lucide-react';
import { PrivateChat } from '../../types';
import PrivateChatService from '../../services/privateChatService';
import CreatePrivateChatModal from './CreatePrivateChatModal';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getPrivateChatSecurityTip } from '../../utils/encryption';
import toast from 'react-hot-toast';

interface PrivateChatListProps {
  onSelectChat: (chat: PrivateChat) => void;
  selectedChatId?: number;
}

const PrivateChatList: React.FC<PrivateChatListProps> = ({
  onSelectChat,
  selectedChatId,
}) => {
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filteredChats, setFilteredChats] = useState<PrivateChat[]>([]);
  const [securityTip] = useState(getPrivateChatSecurityTip());

  // 加载私聊列表
  const loadPrivateChats = async () => {
    try {
      setLoading(true);
      const chats = await PrivateChatService.getPrivateChats();
      setPrivateChats(chats);
      setFilteredChats(chats);
    } catch (error) {
      console.error('加载私聊列表失败:', error);
      toast.error('加载私聊列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivateChats();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(privateChats);
    } else {
      const filtered = privateChats.filter(chat =>
        chat.other_user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.other_user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, privateChats]);

  // 处理创建私聊成功
  const handleChatCreated = (newChat: PrivateChat) => {
    setPrivateChats(prev => [newChat, ...prev]);
    setShowCreateModal(false);
    onSelectChat(newChat);
    toast.success('私聊创建成功');
  };

  // 格式化时间
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      return formatDistanceToNow(new Date(timeString), {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return '';
    }
  };

  // 截断消息内容
  const truncateMessage = (content: string, maxLength: number = 30) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
            私聊
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="新建私聊"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* 安全提示 */}
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-sm text-green-700">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            <span>{securityTip}</span>
          </div>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索联系人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 私聊列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? (
              <div>
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>未找到匹配的联系人</p>
              </div>
            ) : (
              <div>
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无私聊</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-blue-500 hover:text-blue-600"
                >
                  开始第一个私聊
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChatId === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    {chat.other_user.avatar ? (
                      <img
                        src={chat.other_user.avatar}
                        alt={chat.other_user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    {/* 在线状态指示器 */}
                    {chat.other_user.is_online && (
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white -mt-2 ml-7"></div>
                    )}
                  </div>

                  {/* 聊天信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.other_user.username}
                      </h3>
                      {chat.last_message_at && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(chat.last_message_at)}
                        </span>
                      )}
                    </div>
                    
                    {chat.last_message ? (
                      <div className="flex items-center mt-1">
                        {chat.last_message.is_encrypted && (
                          <Shield className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                        )}
                        <p className="text-sm text-gray-600 truncate">
                          {chat.last_message.user_id === chat.other_user.id ? '' : '我: '}
                          {truncateMessage(chat.last_message.content, 25)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-1">
                        暂无消息
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建私聊模态框 */}
      {showCreateModal && (
        <CreatePrivateChatModal
          onClose={() => setShowCreateModal(false)}
          onChatCreated={handleChatCreated}
        />
      )}
    </div>
  );
};

export default PrivateChatList;