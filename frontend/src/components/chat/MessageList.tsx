import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageListProps {
  messages: Message[];
  typingUsers: string[];
}

const MessageList: React.FC<MessageListProps> = ({ messages, typingUsers }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousLengthRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 防御性检查：确保 messages 是数组
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeTypingUsers = Array.isArray(typingUsers) ? typingUsers : [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
  }, []);

  const checkScrollPosition = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom);
        
        if (isNearBottom) {
          setUnreadCount(0);
        }
      }
    }
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.addEventListener('scroll', checkScrollPosition);
        return () => viewport.removeEventListener('scroll', checkScrollPosition);
      }
    }
  }, [checkScrollPosition]);

  // 当有新消息时，如果用户不在底部，增加未读计数
  useEffect(() => {
    if (safeMessages.length > previousLengthRef.current) {
      const newMessages = safeMessages.slice(previousLengthRef.current);
      const hasOwnMessage = newMessages.some(msg => msg.user_id === user?.id);
      
      if (hasOwnMessage) {
        // 如果是用户自己发送的消息，自动滚动到底部
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else if (showScrollButton) {
        // 如果是其他人的消息且用户不在底部，增加未读计数
        const newMessagesCount = newMessages.length;
        setUnreadCount(prev => prev + newMessagesCount);
      }
    }
    
    previousLengthRef.current = safeMessages.length;
  }, [safeMessages.length, showScrollButton, user?.id, scrollToBottom]);

  // 初始加载时滚动到底部
  useEffect(() => {
    if (safeMessages.length > 0) {
      // 延迟一点时间确保DOM已经渲染
      const timer = setTimeout(() => {
        scrollToBottom();
        checkScrollPosition();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [safeMessages.length === 0 ? 0 : 1, scrollToBottom, checkScrollPosition]); // 只在首次加载消息时触发

  const formatTime = (dateString: string) => {
    try {
      // 创建Date对象，如果是UTC时间，需要转换为北京时间(UTC+8)
      const date = new Date(dateString);
      // 如果时间字符串不包含时区信息，假设它是UTC时间，转换为北京时间
      const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      return formatDistanceToNow(beijingTime, { addSuffix: true, locale: zhCN });
    } catch (error) {
      return '刚刚';
    }
  };

  const getAvatarColor = (senderId: number) => {
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
    return colors[senderId % colors.length];
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 message-list-container relative">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 sm:p-4">
        {safeMessages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center h-full text-muted-foreground"
          >
            <div className="text-center px-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-3xl sm:text-4xl mb-2"
              >
                💬
              </motion.div>
              <p className="text-sm sm:text-base">还没有消息，开始聊天吧！</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-4 chat-container">
            <AnimatePresence initial={false}>
              {safeMessages.map((message, index) => {
                const isOwnMessage = message.user_id === user?.id;
                const showAvatar = index === 0 || safeMessages[index - 1].user_id !== message.user_id;
                const showTime = index === 0 || 
                  new Date(message.timestamp).getTime() - new Date(safeMessages[index - 1].timestamp).getTime() > 300000; // 5分钟

                return (
                  <motion.div 
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    className="w-full"
                  >
                    {showTime && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center mb-3 sm:mb-4"
                      >
                        <span className="text-xs text-muted-foreground bg-muted px-2 sm:px-3 py-1 rounded-full">
                          {formatTime(message.timestamp)}
                        </span>
                      </motion.div>
                    )}
                    
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 w-full`}>
                      <div className={`flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex-container-safe ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* 头像 */}
                        {showAvatar && !isOwnMessage && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                            className="flex-shrink-0 mr-2 sm:mr-3"
                          >
                            <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                              <AvatarFallback className={`text-white text-xs sm:text-sm font-medium ${getAvatarColor(message.user_id)}`}>
                                {message.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                        )}
                        
                        {/* 消息内容 */}
                        <div className={`min-w-0 flex-1 ${isOwnMessage ? 'mr-2 sm:mr-3' : showAvatar ? '' : 'ml-9 sm:ml-11'}`}>
                          {/* 发送者名称 */}
                          {showAvatar && !isOwnMessage && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 }}
                              className="text-xs text-muted-foreground mb-1 truncate"
                            >
                              {message.username}
                            </motion.div>
                          )}
                          
                          {/* 消息气泡 */}
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                              delay: 0.1,
                              type: "spring",
                              stiffness: 400,
                              damping: 25
                            }}
                            whileHover={{ scale: 1.02 }}
                            className={`px-3 sm:px-4 py-2 rounded-2xl message-bubble ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted text-foreground rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </motion.div>
                          
                          {/* 消息时间 */}
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}
                          >
                            {(() => {
                              // 转换为北京时间显示
                              const date = new Date(message.timestamp);
                              const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                              return beijingTime.toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Shanghai'
                              });
                            })()}
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* 正在输入指示器 */}
            <AnimatePresence>
              {safeTypingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-start mb-2"
                >
                  <div className="flex max-w-[75%] md:max-w-[65%]">
                    <div className="flex-shrink-0 mr-2 sm:mr-3">
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                        <AvatarFallback className="bg-gray-400 text-white text-xs sm:text-sm font-medium">
                          ...
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground mb-1">
                        {safeTypingUsers.join(', ')} 正在输入...
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="bg-muted text-foreground px-3 sm:px-4 py-2 rounded-2xl rounded-bl-md"
                      >
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 bg-current rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-current rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-current rounded-full"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* 滚动到底部按钮 */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="absolute bottom-4 right-4 z-10"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="secondary"
                size="icon"
                onClick={scrollToBottom}
                className="rounded-full shadow-lg border bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <ChevronDown className="h-4 w-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageList; 