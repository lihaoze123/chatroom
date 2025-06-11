import React, { useEffect, useRef } from 'react';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface MessageListProps {
  messages: Message[];
  typingUsers: string[];
}

const MessageList: React.FC<MessageListProps> = ({ messages, typingUsers }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 防御性检查：确保 messages 是数组
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeTypingUsers = Array.isArray(typingUsers) ? typingUsers : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [safeMessages]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
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
    <ScrollArea className="flex-1 p-4">
      {safeMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">💬</div>
            <p>还没有消息，开始聊天吧！</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {safeMessages.map((message, index) => {
            const isOwnMessage = message.user_id === user?.id;
            const showAvatar = index === 0 || safeMessages[index - 1].user_id !== message.user_id;
            const showTime = index === 0 || 
              new Date(message.timestamp).getTime() - new Date(safeMessages[index - 1].timestamp).getTime() > 300000; // 5分钟

            return (
              <div key={message.id} className="animate-fade-in">
                {showTime && (
                  <div className="flex justify-center mb-4">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* 头像 */}
                    {showAvatar && !isOwnMessage && (
                      <div className="flex-shrink-0 mr-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`text-white text-sm font-medium ${getAvatarColor(message.user_id)}`}>
                            {message.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    {/* 消息内容 */}
                    <div className={`${isOwnMessage ? 'mr-3' : showAvatar ? '' : 'ml-11'}`}>
                      {/* 发送者名称 */}
                      {showAvatar && !isOwnMessage && (
                        <div className="text-xs text-muted-foreground mb-1">
                          {message.username}
                        </div>
                      )}
                      
                      {/* 消息气泡 */}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
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
                        {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* 正在输入指示器 */}
          {safeTypingUsers.length > 0 && (
            <div className="flex justify-start mb-2">
              <div className="flex max-w-xs lg:max-w-md">
                <div className="flex-shrink-0 mr-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-muted">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {safeTypingUsers.join(', ')} 正在输入...
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-2xl rounded-bl-md">
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
  );
};

export default MessageList; 