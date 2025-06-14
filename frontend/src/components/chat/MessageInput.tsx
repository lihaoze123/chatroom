import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './FileUpload';

interface MessageInputProps {
  onSendMessage: (message: string, messageType?: string, fileInfo?: any) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping, disabled }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  const handleFileUploaded = (fileInfo: {
    url: string;
    name: string;
    size: number;
    type: string;
  }) => {
    // 发送文件消息
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const messageType = imageExtensions.includes(fileInfo.type.toLowerCase()) ? 'image' : 'file';
    onSendMessage('', messageType, fileInfo);
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-t bg-background p-3 sm:p-4 message-input-container mobile-safe-area flex-shrink-0"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 文件上传按钮 */}
        <div className="flex-shrink-0">
          <FileUpload onFileUploaded={handleFileUploaded} disabled={disabled} />
        </div>
        
        {/* 表情按钮 */}
        <div className="relative emoji-panel-container flex-shrink-0">
          <motion.div
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="表情"
              onClick={() => setShowEmojiPanel(!showEmojiPanel)}
              className="h-10 w-10 sm:h-11 sm:w-11"
            >
              <motion.div
                animate={{ rotate: showEmojiPanel ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <Smile className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
          
          {/* 表情面板 */}
          <AnimatePresence>
            {showEmojiPanel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="absolute bottom-full left-0 mb-2 bg-popover border rounded-lg shadow-lg p-3 sm:p-4 z-50 w-64 sm:w-72"
              >
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {emojis.map((emoji, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: index * 0.02,
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmojiClick(emoji)}
                        className="p-1.5 text-lg sm:text-xl h-auto aspect-square"
                      >
                        {emoji}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 消息输入框容器 */}
        <div className="flex-1 relative min-w-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
            {/* 输入框 */}
            <motion.div 
              className="flex-1 relative"
              animate={{ 
                scale: isFocused ? 1.01 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="输入消息..."
                disabled={disabled}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground text-sm sm:text-base transition-all duration-200"
                rows={1}
                style={{ 
                  minHeight: '40px', 
                  maxHeight: '120px',
                  height: '40px'
                }}
                animate={{
                  borderColor: isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                }}
                transition={{ duration: 0.2 }}
              />
              
              {/* 输入状态指示器 */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-full h-full bg-green-500 rounded-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 发送按钮 */}
            <div className="flex-shrink-0">
              <motion.div
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: message.trim() ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  scale: message.trim() ? { duration: 0.3 } : { duration: 0.2 }
                }}
              >
                <Button
                  type="submit"
                  disabled={!message.trim() || disabled}
                  size="icon"
                  className="h-10 w-10 sm:h-11 sm:w-11 relative overflow-hidden"
                  title="发送消息"
                >
                  <motion.div
                    animate={{ 
                      x: message.trim() ? [0, 2, 0] : 0,
                      rotate: message.trim() ? [0, -10, 0] : 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Send className="h-4 w-4" />
                  </motion.div>
                  
                  {/* 发送按钮背景动画 */}
                  {message.trim() && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.1 }}
                      className="absolute inset-0 bg-white rounded-md"
                    />
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageInput;