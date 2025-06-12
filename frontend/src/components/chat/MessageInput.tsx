import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping, disabled }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '😢', '😡'];

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* 表情按钮 */}
        <div className="relative group">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="表情"
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          {/* 表情面板 */}
          <div className="absolute bottom-full left-0 mb-2 bg-popover border rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[240px]">
            <div className="grid grid-cols-5 gap-3">
              {emojis.map((emoji, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessage(prev => prev + emoji)}
                  className="p-1.5 text-xl h-auto"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 消息输入框 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter发送，Shift+Enter换行)"
            disabled={disabled}
            className="w-full px-4 py-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          size="icon"
          title="发送消息"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* 输入提示 */}
      <div className="mt-2 text-xs text-muted-foreground">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>
  );
};

export default MessageInput;