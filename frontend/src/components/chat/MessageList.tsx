import React, { useEffect, useRef, useState, useCallback } from 'react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousLengthRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 防御性检查：确保 messages 是数组
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeTypingUsers = Array.isArray(typingUsers) ? typingUsers : [];

  const scrollToBottom = useCallback(() => {
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
  }, []);
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
      // 创建Date对象，如果是UTC时间，需要转换为北京时间(UTC+8)
      const date = new Date(dateString);
      // 如果时间字符串不包含时区信息，假设它是UTC时间，转换为北京时间
      const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      return formatDistanceToNow(beijingTime, { addSuffix: true, locale: zhCN });
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
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center px-4">
              <div className="text-3xl sm:text-4xl mb-2">💬</div>
              <p className="text-sm sm:text-base">还没有消息，开始聊天吧！</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 chat-container">
            {safeMessages.map((message, index) => {
              const isOwnMessage = message.user_id === user?.id;
              const showAvatar = index === 0 || safeMessages[index - 1].user_id !== message.user_id;
              const showTime = index === 0 || 
                new Date(message.timestamp).getTime() - new Date(safeMessages[index - 1].timestamp).getTime() > 300000; // 5分钟

              return (
                <div key={message.id} className="animate-fade-in w-full">
                  {showTime && (
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <span className="text-xs text-muted-foreground bg-muted px-2 sm:px-3 py-1 rounded-full">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 w-full`}>
                    <div className={`flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex-container-safe ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* 头像 */}
                      {showAvatar && !isOwnMessage && (
                        <div className="flex-shrink-0 mr-2 sm:mr-3">
                          <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                            <AvatarFallback className={`text-white text-xs sm:text-sm font-medium ${getAvatarColor(message.user_id)}`}>
                              {message.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      
                      {/* 消息内容 */}
                      <div className={`min-w-0 flex-1 ${isOwnMessage ? 'mr-2 sm:mr-3' : showAvatar ? '' : 'ml-9 sm:ml-11'}`}>
                        {/* 发送者名称 */}
                        {showAvatar && !isOwnMessage && (
                          <div className="text-xs text-muted-foreground mb-1 truncate">
                            {message.username}
                          </div>
                        )}
                        
                        {/* 消息气泡 */}
                        <div
                          className={`px-3 sm:px-4 py-2 rounded-2xl message-bubble ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        
                        {/* 消息时间 */}
                        <div className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* 正在输入指示器 */}
            {safeTypingUsers.length > 0 && (
              <div className="flex justify-start mb-2 w-full">
                <div className="flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex-container-safe">
                  <div className="flex-shrink-0 mr-2 sm:mr-3">
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                      <AvatarFallback className="bg-muted">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      {safeTypingUsers.join(', ')} 正在输入...
                    </div>
                    <div className="px-3 sm:px-4 py-2 bg-muted rounded-2xl rounded-bl-md message-bubble">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* 滚动到底部按钮 */}
      {showScrollButton && (
        <div className="scroll-to-bottom-btn">
          <Button
            onClick={scrollToBottom}
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 h-10 w-auto px-3"
            title="滚动到底部"
          >
            <ChevronDown className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="ml-1 unread-count text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : (
              <span className="ml-1 text-xs hidden sm:inline">底部</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageList; 