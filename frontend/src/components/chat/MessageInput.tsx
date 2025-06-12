import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '../ui/button';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping, disabled }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 自动调整文本框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // 处理输入状态
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // 清除之前的定时器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 设置新的定时器，2秒后停止输入状态
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // 停止输入状态
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
      
      // 清除定时器
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 关闭表情面板
      setShowEmojiPanel(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPanel(false);
    textareaRef.current?.focus();
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // 点击外部关闭表情面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPanel && !(event.target as Element).closest('.emoji-panel-container')) {
        setShowEmojiPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPanel]);

  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '😢', '😡', '🔥', '💯', '🎯', '⚡', '🌟', '💪'];

  return (
    <div className="border-t bg-background p-3 sm:p-4 message-input-container mobile-safe-area flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-3">
        {/* 表情按钮 */}
        <div className="relative emoji-panel-container">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="表情"
            onClick={() => setShowEmojiPanel(!showEmojiPanel)}
            className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          {/* 表情面板 */}
          {showEmojiPanel && (
            <div className="absolute bottom-full left-0 mb-2 bg-popover border rounded-lg shadow-lg p-3 sm:p-4 z-50 w-64 sm:w-72">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {emojis.map((emoji, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1.5 text-lg sm:text-xl h-auto aspect-square"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 消息输入框 */}
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={disabled}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground text-sm sm:text-base"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
          title="发送消息"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;