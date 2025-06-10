import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { ChatRoom as ChatRoomType } from '../types';
import RoomList from '../components/chat/RoomList';
import ChatRoom from '../components/chat/ChatRoom';
import { MessageCircle } from 'lucide-react';

const ChatPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { connectSocket, disconnectSocket } = useChat();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);

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
    // 这里会触发ChatContext中的joinRoom
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">正在验证身份...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 左侧边栏 - 聊天室列表 */}
      <div className="w-80 flex-shrink-0">
        <RoomList
          onRoomSelect={handleRoomSelect}
          selectedRoomId={selectedRoom?.id}
        />
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <ChatRoomComponent room={selectedRoom} />
        ) : (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                欢迎来到聊天室！
              </h3>
              <p className="text-gray-500 mb-4">
                选择一个聊天室开始聊天，或者创建一个新的聊天室。
              </p>
              <div className="text-sm text-gray-400">
                当前用户：{user.username}
              </div>
            </div>
          </div>
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
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">正在加入聊天室...</p>
        </div>
      </div>
    );
  }

  return <ChatRoom room={room} />;
};

export default ChatPage; 