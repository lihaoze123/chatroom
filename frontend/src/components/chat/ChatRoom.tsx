import React, { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom as ChatRoomType } from '../../types';
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
    sendMessage(message);
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
      <CardContent className="flex-1 flex p-0 overflow-hidden relative">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MessageList messages={messages} typingUsers={typingUsers} />
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            disabled={!connected}
          />
        </div>

        {/* 用户列表侧边栏 - 桌面端 */}
        {showUserList && (
          <>
            <Separator orientation="vertical" className="hidden lg:block" />
            <div className="hidden lg:block w-64 bg-muted/30 flex-shrink-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    在线用户 ({onlineUsers.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowUserList(false)}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
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

        {/* 移动端用户列表弹窗 */}
        {showUserList && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="bg-background w-full max-h-[60vh] rounded-t-lg">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    在线用户 ({onlineUsers.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowUserList(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="max-h-[40vh] p-4">
                <div className="space-y-3">
                  {onlineUsers.map((username, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">{username}</span>
                      {username === user?.username && (
                        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                          你
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
      </CardContent>
    </Card>
  );
};

export default ChatRoom; 