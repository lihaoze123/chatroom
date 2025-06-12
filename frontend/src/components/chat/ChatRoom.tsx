import React, { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom as ChatRoomType } from '../../types';
import { preprocessMessage } from '../../utils/encryption';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Hash, Users, Settings, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

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
    if (!message.trim()) return;
    
    // 预处理消息
    const { isValid, cleanMessage, error } = preprocessMessage(message);
    
    if (!isValid) {
      console.error('消息发送失败:', error);
      // 这里可以添加用户提示
      return;
    }
    
    sendMessage(cleanMessage);
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* 聊天室头部 */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <h1 className="text-lg font-semibold">{room.name}</h1>
            </div>
            {room.description && (
              <span className="text-sm text-muted-foreground">- {room.description}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* 连接状态指示器 */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {connected ? '已连接' : '连接中...'}
              </span>
            </div>

            {/* 在线用户数 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserList(!showUserList)}
              title="查看在线用户"
            >
              <Users className="h-4 w-4 mr-1" />
              <span>{onlineUsers.length}</span>
            </Button>

            {/* 设置按钮 */}
            <Button
              variant="ghost"
              size="icon"
              title="设置"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* 退出登录 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="退出登录"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* 主要内容区域 */}
      <CardContent className="flex-1 flex p-0 overflow-hidden">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MessageList messages={messages} typingUsers={typingUsers} />
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            disabled={!connected}
          />
        </div>

        {/* 用户列表侧边栏 */}
        {showUserList && (
          <>
            <Separator orientation="vertical" />
            <div className="w-64 bg-muted/30 flex-shrink-0">
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-3">
                  在线用户 ({onlineUsers.length})
                </h3>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {onlineUsers.map((username, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{username}</span>
                        {username === user?.username && (
                          <span className="text-xs text-muted-foreground">(你)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatRoom;