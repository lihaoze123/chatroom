import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { ChatRoom as ChatRoomType, PrivateChat } from '../types';
import RoomList from '../components/chat/RoomList';
import PrivateChatList from '../components/chat/PrivateChatList';
import ChatRoom from '../components/chat/ChatRoom';
import { MessageCircle, Users, User } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

type ChatMode = 'rooms' | 'private';

const ChatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { connectSocket, disconnectSocket } = useChat();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<PrivateChat | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('rooms');

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
    // 这里会触发ChatContext中的joinRoom
  };

  const handlePrivateChatSelect = async (chat: PrivateChat) => {
    setSelectedPrivateChat(chat);
    setSelectedRoom(null);
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
    <div className="h-screen flex bg-background overflow-hidden">
      {/* 左侧边栏 */}
      <div className="w-80 flex-shrink-0 flex flex-col">
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

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedRoom ? (
          <ChatRoomComponent room={selectedRoom} />
        ) : (
          <Card className="h-full">
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  欢迎来到聊天室！
                </h3>
                <p className="text-muted-foreground mb-4">
                  {chatMode === 'rooms' 
                    ? '选择一个群聊开始聊天，或者创建一个新的群聊。'
                    : '选择一个私聊开始对话，或者创建一个新的私聊。'
                  }
                </p>
                <div className="text-sm text-muted-foreground">
                  当前用户：{user.username}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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

    // 组件卸载时离开房间
    return () => {
      if (currentRoom) {
        leaveRoom(currentRoom.id);
      }
    };
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