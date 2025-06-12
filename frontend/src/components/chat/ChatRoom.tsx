import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom as ChatRoomType } from '../../types';
import MessageList, { MessageListRef } from './MessageList';
import MessageInput from './MessageInput';
import { Hash, Users, Settings, X, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
// 移除 ScrollArea 导入
// import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface ChatRoomProps {
  room: ChatRoomType;
  onUserClick?: (userId: number) => void;
  onExitRoom?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room, onUserClick, onExitRoom }) => {
  const { 
    messages, 
    typingUsers, 
    onlineUsers, 
    sendMessage, 
    setTyping, 
    connected,
    loading,
    leaveRoom 
  } = useChat();
  const { user } = useAuth();
  const [showUserList, setShowUserList] = useState(false);
  const messageListRef = useRef<MessageListRef>(null);

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

  const handleExitRoom = async () => {
    try {
      // 离开当前房间
      await leaveRoom(room.id);
      // 通知父组件退出房间
      if (onExitRoom) {
        onExitRoom();
      }
    } catch (error) {
      console.error('Exit room error:', error);
    }
  };

  const toggleUserList = () => {
    setShowUserList(!showUserList);
  };

  // 获取头像颜色
  const getAvatarColor = (charCode: number) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-gray-500',
    ];
    return colors[charCode % colors.length];
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
    <Card className="h-full flex flex-col fixed-layout">
      {/* 聊天室头部 - 桌面端显示，固定在顶部 */}
      <CardHeader className="pb-3 hidden lg:block fixed-header bg-background">
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

            {/* 退出聊天室 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExitRoom}
              title="退出聊天室"
              className="text-muted-foreground hover:text-destructive"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* 移动端简化头部，固定在顶部 */}
      <CardHeader className="pb-3 lg:hidden fixed-header bg-background">
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

            {/* 退出聊天室 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExitRoom}
              title="退出聊天室"
              className="text-muted-foreground hover:text-destructive"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* 主要内容区域 */}
      <CardContent className="flex-1 p-0 flex relative overflow-hidden scrollable-content">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="flex-1 overflow-hidden scrollable-content">
            <MessageList 
              messages={messages} 
              currentUserId={user?.id || 0}
              typingUsers={typingUsers}
              onUserClick={onUserClick}
              ref={messageListRef}
            />
          </div>
          <div className="fixed-footer bg-background border-t">
            <MessageInput 
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={!connected}
              onMessageSent={() => {
                // 当消息发送时，调用MessageList组件的scrollToBottom方法
                if (messageListRef.current) {
                  messageListRef.current.scrollToBottom();
                }
              }}
            />
          </div>
        </div>

        {/* 用户列表侧边栏 */}
        {showUserList && (
          <>
            {/* 移动端遮罩层 */}
            <div 
              className="md:hidden fixed inset-0 bg-black/50 z-40" 
              onClick={() => setShowUserList(false)}
            />
            
            {/* 侧边栏 */}
            <div className={`fixed md:relative right-0 top-0 h-full w-64 bg-background border-l z-50 transform transition-transform duration-300 ${showUserList ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
              {/* 移动端关闭按钮 */}
              <button 
                className="md:hidden absolute top-2 left-2 p-2 text-muted-foreground hover:text-foreground" 
                onClick={() => setShowUserList(false)}
              >
                <X size={20} />
              </button>
              
              {/* 标题 - 在大屏幕上隐藏 */}
              <div className="md:hidden p-4 text-center font-medium border-b">
                在线用户
              </div>
              
              {/* 用户列表 - 使用普通 div 替换 ScrollArea */}
              <div className="h-full py-4 overflow-y-auto">
                <div className="px-4 mb-2 text-sm font-medium text-muted-foreground">
                  在线用户 ({onlineUsers.length})
                </div>
                <div className="space-y-1 px-2">
                  {onlineUsers.map((username, index) => (
                    <button
                      key={index}
                      className={`w-full flex items-center space-x-2 px-2 py-2 rounded-md hover:bg-accent text-left`}
                      onClick={() => onUserClick && onUserClick(index)}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${getAvatarColor(username.charCodeAt(0))} text-white`}>
                            {username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatRoom;