import React, { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom as ChatRoomType } from '../../types';
import { preprocessMessage } from '../../utils/encryption';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Hash, Users, Settings, LogOut, X } from 'lucide-react';
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

  // 在移动端自动关闭用户列表
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && showUserList) {
        setShowUserList(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showUserList]);

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

  const toggleUserList = () => {
    setShowUserList(!showUserList);
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
      {/* 聊天室头部 - 桌面端显示 */}
      <CardHeader className="pb-3 hidden lg:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0">
              <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h1 className="text-lg font-semibold truncate">{room.name}</h1>
            </div>
            {room.description && (
              <span className="text-sm text-muted-foreground truncate hidden xl:inline">
                - {room.description}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* 连接状态指示器 */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {connected ? '已连接' : '连接中...'}
              </span>
            </div>

            {/* 在线用户数 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleUserList}
              title="查看在线用户"
            >
              <Users className="h-4 w-4 mr-1" />
              <span>{onlineUsers.length}</span>
            </Button>

            {/* 设置按钮 - 桌面端显示 */}
            <Button
              variant="ghost"
              size="icon"
              title="设置"
              className="hidden md:inline-flex"
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

      {/* 移动端简化头部 */}
      <CardHeader className="pb-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {connected ? '已连接' : '连接中...'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* 在线用户数 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleUserList}
              title="查看在线用户"
            >
              <Users className="h-4 w-4 mr-1" />
              <span>{onlineUsers.length}</span>
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
      <CardContent className="flex-1 p-0 flex relative">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          <MessageList 
            messages={messages} 
            typingUsers={typingUsers}
          />
          <MessageInput 
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            disabled={!connected}
          />
        </div>

        {/* 用户列表侧边栏 */}
        {showUserList && (
          <>
            {/* 移动端遮罩层 */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowUserList(false)}
            />
            
            {/* 用户列表 */}
            <div className="fixed right-0 top-0 bottom-0 w-64 bg-background border-l z-50 lg:relative lg:w-56 lg:z-auto">
              <div className="flex items-center justify-between p-4 border-b lg:hidden">
                <h3 className="font-semibold">在线用户</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUserList(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="hidden lg:block p-4 border-b">
                <h3 className="font-semibold text-sm">在线用户 ({onlineUsers.length})</h3>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {onlineUsers.map((username, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium truncate">
                        {username}
                        {username === user?.username && ' (你)'}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatRoom;