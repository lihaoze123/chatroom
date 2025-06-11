import React, { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom as ChatRoomType } from '../../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Hash, Users, Settings, LogOut } from 'lucide-react';

interface ChatRoomProps {
  room: ChatRoomType;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room }) => {
  const { 
    messages, 
    typingUsers, 
    onlineUsers, 
    sendMessage, 
    setTyping, 
    connected,
    loading 
  } = useChat();
  const { user, logout } = useAuth();
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    // 组件挂载时，房间已经通过父组件加入
  }, [room.id]);

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 聊天室头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Hash className="h-5 w-5 text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-900">{room.name}</h1>
          </div>
          {room.description && (
            <span className="text-sm text-gray-500">- {room.description}</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 连接状态指示器 */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {connected ? '已连接' : '连接中...'}
            </span>
          </div>

          {/* 在线用户数 */}
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="查看在线用户"
          >
            <Users className="h-4 w-4" />
            <span>{onlineUsers.length}</span>
          </button>

          {/* 设置按钮 */}
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col">
          <MessageList messages={messages} typingUsers={typingUsers} />
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            disabled={!connected}
          />
        </div>

        {/* 用户列表侧边栏 */}
        {showUserList && (
          <div className="w-64 border-l border-gray-200 bg-gray-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                在线用户 ({onlineUsers.length})
              </h3>
              <div className="space-y-2">
                {onlineUsers.map((username, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{username}</span>
                    {username === user?.username && (
                      <span className="text-xs text-gray-500">(你)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom; 