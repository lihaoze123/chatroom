import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { ChatRoom as ChatRoomType, PrivateChat } from '../types';
import RoomList from '../components/chat/RoomList';
import PrivateChatList from '../components/chat/PrivateChatList';
import ChatRoom from '../components/chat/ChatRoom';
import { MessageCircle, Users, User, Menu, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

type ChatMode = 'rooms' | 'private';

const ChatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { connectSocket, disconnectSocket } = useChat();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateChat | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('rooms');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // 连接Socket
      connectSocket();
    }

    return () => {
      // 组件卸载时断开连接
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, connectSocket, disconnectSocket]);

  const handleRoomSelect = async (room: ChatRoomType) => {
    setSelectedRoom(room);
    setSelectedPrivateChat(null);
    // 在移动端选择房间后关闭侧边栏
    setIsMobileMenuOpen(false);
    // 这里会触发ChatContext中的joinRoom
  };

  const handlePrivateChatSelect = async (chat: PrivateChat) => {
    setSelectedPrivateChat(chat);
    setSelectedRoom(null);
    // 在移动端选择私聊后关闭侧边栏
    setIsMobileMenuOpen(false);
    // 将私聊转换为ChatRoom格式以复用现有组件
    const privateChatRoom: ChatRoomType = {
      id: chat.room_id,
      name: chat.other_user.username,
      description: `与 ${chat.other_user.username} 的私聊`,
      created_at: chat.created_at,
      created_by: chat.other_user.id,
      is_private: true,
      room_type: 'private',
      member_count: 2,
      online_count: chat.other_user.is_online ? 2 : 1,
    };
    setSelectedRoom(privateChatRoom);
  };

  const handleModeChange = (mode: ChatMode) => {
    setChatMode(mode);
    setSelectedRoom(null);
    setSelectedPrivateChat(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">正在验证身份...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      {/* 移动端遮罩层 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 左侧边栏 */}
      <div className={`
        fixed lg:relative lg:translate-x-0 z-50 lg:z-auto
        w-80 lg:w-80 h-full flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full bg-background border-r lg:border-r-0 flex flex-col">
          {/* 移动端关闭按钮 */}
          <div className="lg:hidden flex justify-end p-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 模式切换标签 */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => handleModeChange('rooms')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  chatMode === 'rooms'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                群聊
              </button>
              <button
                onClick={() => handleModeChange('private')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  chatMode === 'private'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                私聊
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-hidden">
            {chatMode === 'rooms' ? (
              <RoomList
                onRoomSelect={handleRoomSelect}
                selectedRoomId={selectedRoom?.id}
              />
            ) : (
              <PrivateChatList
                onSelectChat={handlePrivateChatSelect}
                selectedChatId={selectedPrivateChat?.id}
              />
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 移动端顶部导航栏 */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          {selectedRoom ? (
            <div className="flex items-center space-x-2 flex-1 justify-center">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="font-medium truncate">{selectedRoom.name}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 flex-1 justify-center">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">选择聊天室</span>
            </div>
          )}
          
          <div className="w-10" /> {/* 占位符保持居中 */}
        </div>

        {/* 聊天内容区域 */}
        <div className="flex-1 overflow-hidden">
          {selectedRoom ? (
            <ChatRoomComponent room={selectedRoom} />
          ) : (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    欢迎来到聊天室！
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                    {chatMode === 'rooms' 
                      ? '选择一个群聊开始聊天，或者创建一个新的群聊。'
                      : '选择一个私聊开始对话，或者创建一个新的私聊。'
                    }
                  </p>
                  <div className="text-sm text-muted-foreground">
                    当前用户：{user.username}
                  </div>
                  
                  {/* 移动端快速选择按钮 */}
                  <div className="lg:hidden mt-6">
                    <Button
                      onClick={toggleMobileMenu}
                      className="w-full sm:w-auto"
                    >
                      <Menu className="h-4 w-4 mr-2" />
                      {chatMode === 'rooms' ? '选择聊天室' : '选择私聊'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// 包装ChatRoom组件以处理房间加入逻辑
const ChatRoomComponent: React.FC<{ room: ChatRoomType }> = ({ room }) => {
  const { joinRoom, leaveRoom, currentRoom } = useChat();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleRoomChange = async () => {
      if (currentRoom && currentRoom.id !== room.id) {
        // 离开当前房间
        await leaveRoom(currentRoom.id);
      }
      
      if (!currentRoom || currentRoom.id !== room.id) {
        // 加入新房间
        setLoading(true);
        try {
          await joinRoom(room.id);
        } finally {
          setLoading(false);
        }
      }
    };

    handleRoomChange();
  }, [room.id, currentRoom?.id, joinRoom, leaveRoom]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加入聊天室...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ChatRoom room={room} />;
};

export default ChatPage;