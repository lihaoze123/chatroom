import React, { useRef, useState, useEffect } from 'react';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
// 移除 ScrollArea 导入
// import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  typingUsers: string[];
  onUserClick?: (userId: number) => void;
}

// 定义组件ref类型
export interface MessageListRef {
  scrollToBottom: () => void;
}

const MessageList = React.forwardRef<MessageListRef, MessageListProps>((props, ref) => {
  const { messages, currentUserId, typingUsers, onUserClick } = props;
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // 防御性检查：确保 messages 是数组
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  // 滚动到底部函数
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
      setIsAtBottom(true);
    }
  };
  
  // 暴露方法给父组件
  React.useImperativeHandle(ref, () => ({
    scrollToBottom
  }));
  
  // 检查滚动位置
  const checkScrollPosition = () => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const { scrollHeight, scrollTop, clientHeight } = scrollArea;
      // 如果滚动条在底部附近（考虑一点误差），则认为在底部
      const isBottom = scrollHeight - scrollTop - clientHeight < 30;
      setIsAtBottom(isBottom);
    }
  };
  
  // 监听滚动事件
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const handleScroll = () => {
        if (!isScrolling) {
          setIsScrolling(true);
          checkScrollPosition();
          setTimeout(() => setIsScrolling(false), 100);
        }
      };
      
      scrollArea.addEventListener('scroll', handleScroll);
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }
  }, [isScrolling]);
  
  // 处理新消息和初始加载
  useEffect(() => {
    // 初始加载时滚动到底部
    if (prevMessagesLength === 0 && safeMessages.length > 0) {
      scrollToBottom();
    }
    // 有新消息时
    else if (safeMessages.length > prevMessagesLength) {
      // 检查最新消息是否是当前用户发送的
      const latestMessage = safeMessages[safeMessages.length - 1];
      const isOwnMessage = latestMessage && latestMessage.user_id === user?.id;
      
      // 如果是自己的消息或者已经在底部，则滚动到底部
      if (isOwnMessage || isAtBottom) {
        scrollToBottom();
      } else {
        // 否则增加未读消息计数
        setUnreadCount(prev => prev + (safeMessages.length - prevMessagesLength));
      }
    }
    
    setPrevMessagesLength(safeMessages.length);
  }, [safeMessages.length, prevMessagesLength, isAtBottom, user?.id]);

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
      {/* 使用普通的 div 替换 ScrollArea 组件 */}
      <div 
        ref={scrollAreaRef} 
        className="flex-1 p-3 sm:p-4 scrollable-content overflow-y-auto"
      >
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
                          <Avatar 
                            className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                            onClick={() => onUserClick && onUserClick(message.user_id)}
                          >
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
            {typingUsers.map((username, index) => (
              <div key={`${username}-${index}`} className="flex justify-start mb-2 w-full">
                <div className="flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex-container-safe">
                  <div className="flex-shrink-0 mr-2 sm:mr-3">
                    <Avatar 
                      className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                      <AvatarFallback className={`text-white text-xs sm:text-sm font-medium ${getAvatarColor(username.charCodeAt(0))}`}>
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      {username} 正在输入...
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
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* 滚动到底部按钮 */}
      {!isAtBottom && unreadCount > 0 && (
        <Button
          onClick={scrollToBottom}
          className="scroll-to-bottom-btn absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 px-3 py-1.5 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          size="sm"
        >
          <ChevronDown className="h-4 w-4" />
          <span>{unreadCount} 条新消息</span>
        </Button>
      )}
    </div>
  );
});

export default MessageList;