/**
 * 前端加密工具模块
 * 用于私聊消息的客户端加密
 */

// 简单的消息验证和清理函数
export const validateMessage = (message: string): boolean => {
  if (!message || message.trim().length === 0) {
    return false;
  }
  
  // 检查消息长度限制
  if (message.length > 10000) {
    return false;
  }
  
  return true;
};

export const sanitizeMessage = (message: string): string => {
  try {
    // 移除前后空白
    let sanitized = message.trim();
    
    // 移除控制字符，但保留换行、回车和制表符
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, (char) => {
      return ['\n', '\r', '\t'].includes(char) ? char : '';
    });
    
    return sanitized;
  } catch (error) {
    console.error('消息清理失败:', error);
    return message;
  }
};

// 消息安全检查
export const isMessageSafe = (message: string): boolean => {
  try {
    // 检查是否包含潜在的恶意脚本
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(message)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('消息安全检查失败:', error);
    return false;
  }
};

// 消息预处理
export const preprocessMessage = (message: string): { isValid: boolean; cleanMessage: string; error?: string } => {
  try {
    // 验证消息
    if (!validateMessage(message)) {
      return {
        isValid: false,
        cleanMessage: '',
        error: '消息格式无效或为空'
      };
    }
    
    // 安全检查
    if (!isMessageSafe(message)) {
      return {
        isValid: false,
        cleanMessage: '',
        error: '消息包含不安全内容'
      };
    }
    
    // 清理消息
    const cleanMessage = sanitizeMessage(message);
    
    return {
      isValid: true,
      cleanMessage
    };
  } catch (error) {
    console.error('消息预处理失败:', error);
    return {
      isValid: false,
      cleanMessage: '',
      error: '消息处理失败'
    };
  }
};

// 消息长度格式化
export const formatMessageLength = (message: string): string => {
  const length = message.length;
  if (length > 1000) {
    return `${(length / 1000).toFixed(1)}K`;
  }
  return length.toString();
};

// 检查消息是否为加密消息
export const isEncryptedMessage = (message: any): boolean => {
  return message && typeof message === 'object' && message.is_encrypted === true;
};

// 消息显示格式化
export const formatMessageForDisplay = (message: any): string => {
  try {
    if (isEncryptedMessage(message)) {
      // 如果是加密消息但解密失败，显示占位符
      return message.content || '[加密消息]';
    }
    
    return message.content || '';
  } catch (error) {
    console.error('消息格式化失败:', error);
    return '[消息格式错误]';
  }
};

// 私聊安全提示
export const getPrivateChatSecurityTip = (): string => {
  const tips = [
    '您的私聊消息已加密保护',
    '消息仅您和对方可见',
    '请勿分享敏感个人信息',
    '保护好您的账户安全'
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
};

// 消息时间格式化
export const formatMessageTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分钟前`;
    }
    
    // 小于24小时
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }
    
    // 超过24小时，显示具体时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= yesterday) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch (error) {
    console.error('时间格式化失败:', error);
    return '';
  }
};

// 截断长消息
export const truncateMessage = (message: string, maxLength: number = 50): string => {
  if (message.length <= maxLength) {
    return message;
  }
  
  return message.substring(0, maxLength) + '...';
};

export default {
  validateMessage,
  sanitizeMessage,
  isMessageSafe,
  preprocessMessage,
  formatMessageLength,
  isEncryptedMessage,
  formatMessageForDisplay,
  getPrivateChatSecurityTip,
  formatMessageTime,
  truncateMessage
};