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
import { motion, AnimatePresence } from 'framer-motion';

interface ChatRoomProps {
  room: ChatRoomType;
  onLeaveRoom?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room, onLeaveRoom }) => {
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

  const handleSendMessage = (message: string, messageType?: string, fileInfo?: any) => {
    sendMessage(message, messageType, fileInfo);
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(room.id);
      // 通知父组件清除选中的房间
      if (onLeaveRoom) {
        onLeaveRoom();
      }
    } catch (error) {
      console.error('退出聊天室失败:', error);
    }
  };

  const toggleUserList = () => {
    setShowUserList(!showUserList);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 border-b-2 border-primary rounded-full mx-auto mb-4"
            />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              加载中...
            </motion.p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* 聊天室头部 - 桌面端显示 */}
      <CardHeader className="pb-3 hidden lg:block flex-shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </motion.div>
              <h1 className="text-lg font-semibold truncate">{room.name}</h1>
            </div>
            {room.description && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground truncate hidden xl:inline"
              >
                - {room.description}
              </motion.span>
            )}
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* 连接状态指示器 */}
            <div className="hidden sm:flex items-center space-x-2">
              <motion.div 
                animate={{ 
                  scale: connected ? [1, 1.2, 1] : 1,
                  backgroundColor: connected ? '#10b981' : '#ef4444'
                }}
                transition={{ 
                  scale: { duration: 1, repeat: Infinity },
                  backgroundColor: { duration: 0.3 }
                }}
                className="w-2 h-2 rounded-full"
              />
              <span className="text-xs text-muted-foreground">
                {connected ? '已连接' : '连接中...'}
              </span>
            </div>

            {/* 在线用户数 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleUserList}
                title="查看在线用户"
              >
                <Users className="h-4 w-4 mr-1" />
                <motion.span
                  key={onlineUsers.length}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {onlineUsers.length}
                </motion.span>
              </Button>
            </motion.div>

            {/* 设置按钮 - 桌面端显示 */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                title="设置"
                className="hidden md:inline-flex"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* 退出登录 */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLeaveRoom}
                title="退出聊天室"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </CardHeader>

      {/* 移动端简化头部 */}
      <CardHeader className="pb-3 lg:hidden flex-shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <motion.div 
              animate={{ 
                scale: connected ? [1, 1.2, 1] : 1,
                backgroundColor: connected ? '#10b981' : '#ef4444'
              }}
              transition={{ 
                scale: { duration: 1, repeat: Infinity },
                backgroundColor: { duration: 0.3 }
              }}
              className="w-2 h-2 rounded-full flex-shrink-0"
            />
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {connected ? '已连接' : '连接中...'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* 在线用户数 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleUserList}
                title="查看在线用户"
              >
                <Users className="h-4 w-4 mr-1" />
                <motion.span
                  key={onlineUsers.length}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {onlineUsers.length}
                </motion.span>
              </Button>
            </motion.div>

            {/* 退出登录 */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLeaveRoom}
                title="退出聊天室"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </CardHeader>

      <Separator className="flex-shrink-0" />

      {/* 主要内容区域 */}
      <CardContent className="flex-1 p-0 flex relative overflow-hidden min-h-0">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
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
        <AnimatePresence>
          {showUserList && (
            <>
              {/* 移动端遮罩层 */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setShowUserList(false)}
              />
              
              {/* 用户列表 */}
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="fixed right-0 top-0 bottom-0 w-64 bg-background border-l z-50 lg:relative lg:w-56 lg:z-auto flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b lg:hidden flex-shrink-0">
                  <h3 className="font-semibold">在线用户</h3>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowUserList(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>

                <div className="hidden lg:block p-4 border-b flex-shrink-0">
                  <h3 className="font-semibold text-sm">在线用户 ({onlineUsers.length})</h3>
                </div>

                                 <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {onlineUsers.map((username, index) => (
                      <motion.div
                        key={username}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.3,
                          delay: index * 0.05
                        }}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`w-2 h-2 rounded-full ${
                            username === user?.username ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                        />
                        <span className="text-sm truncate flex-1">
                          {username}
                          {username === user?.username && (
                            <span className="text-xs text-muted-foreground ml-1">(你)</span>
                          )}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ChatRoom;