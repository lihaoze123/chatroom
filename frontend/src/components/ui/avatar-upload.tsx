import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { authAPI } from '../../services/api';
import { User } from '../../types';
import { socketService } from '../../services/socket';
import toast from 'react-hot-toast';

// 获取API基础URL
const getAPIBaseURL = (): string => {
  // 优先使用环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 在生产环境或局域网环境下，使用当前页面的host
  if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // 改为FastAPI端口8000
    return `${protocol}//${hostname}:8000`;
  }
  
  // 开发环境默认使用localhost:8000
  return 'http://localhost:8000';
};

const API_BASE_URL = getAPIBaseURL();

interface AvatarUploadProps {
  user: User;
  onAvatarUpdate: (user: User) => void;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  user, 
  onAvatarUpdate, 
  size = 'md',
  showUploadButton = true 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 防护：如果用户对象为空，不渲染组件
  if (!user || !user.username) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  // 根据尺寸调整图标大小
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('只支持 PNG、JPG、JPEG、GIF、WEBP 格式的图片');
      return;
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('文件大小不能超过5MB');
      return;
    }

    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传文件
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const result = await authAPI.uploadAvatar(file);
      // 先清除预览，然后更新用户信息
      setPreview(null);
      
      // 检查返回的用户对象是否有效
      if (result.user && result.user.username) {
        onAvatarUpdate(result.user);
        
        // 通过Socket通知其他用户头像更新
        if (result.user.avatar_url) {
          socketService.emitAvatarUpdated(result.user.avatar_url);
        }
        
        toast.success('头像更新成功！');
      } else {
        // 如果返回的用户对象无效，手动更新当前用户的头像URL
        console.warn('返回的用户对象无效，使用备用方案');
        const updatedUser = { ...user, avatar_url: result.avatar_url };
        onAvatarUpdate(updatedUser);
        
        if (result.avatar_url) {
          socketService.emitAvatarUpdated(result.avatar_url);
        }
        
        toast.success('头像更新成功！');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      toast.error(error instanceof Error ? error.message : '头像上传失败，请稍后重试');
      setPreview(null);
    } finally {
      setUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 头像显示容器 */}
      <div className="relative group inline-block">
        <Avatar className={`${sizeClasses[size]} transition-all duration-200`}>
          <AvatarImage 
            src={preview || (user.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : '')} 
            alt={user.username}
            onLoad={() => {
              // 当新头像加载完成后，确保清除预览
              if (!uploading && preview) {
                setPreview(null);
              }
            }}
          />
          <AvatarFallback className={size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'}>
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* 上传按钮覆盖层 */}
        {showUploadButton && (
          <div 
            className={`absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer ${sizeClasses[size]}`}
            onClick={handleUploadClick}
          >
            {uploading ? (
              <div className={`animate-spin rounded-full border-b-2 border-white ${iconSizes[size]}`}></div>
            ) : (
              <Camera className={`${iconSizes[size]} text-white`} />
            )}
          </div>
        )}
        
        {/* 上传状态指示器 */}
        {uploading && (
          <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* 预览清除按钮 */}
        {preview && !uploading && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* 独立上传按钮 */}
      {showUploadButton && size === 'lg' && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>上传中...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>更换头像</span>
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;