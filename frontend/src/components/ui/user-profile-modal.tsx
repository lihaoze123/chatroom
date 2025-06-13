import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { authAPI } from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Separator } from './separator';
import { Badge } from './badge';
import { Calendar, MapPin, Briefcase, Globe, User as UserIcon, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserProfileModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, isOpen, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authAPI.getUserProfile(userId);
      setUser(userData);
    } catch (err) {
      setError('获取用户信息失败');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (userId: number) => {
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
    return colors[userId % colors.length];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

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
      return `${protocol}//${hostname}:5000`;
    }
    
    // 开发环境默认使用localhost
    return 'http://localhost:5000';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>用户信息</DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        )}
        
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* 用户头像和基本信息 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-20 h-20">
                    {user.avatar_url && (
                      <AvatarImage 
                        src={`${getAPIBaseURL()}${user.avatar_url}`} 
                        alt={user.username}
                      />
                    )}
                    <AvatarFallback className={`text-white text-2xl font-bold ${getAvatarColor(user.id)}`}>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">{user.real_name || user.username}</h3>
                    {user.real_name && (
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    )}
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant={user.is_online ? 'default' : 'secondary'}>
                        {user.is_online ? '在线' : '离线'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 详细信息 */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {user.bio && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <UserIcon className="w-4 h-4" />
                      <span>个人简介</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{user.bio}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {user.gender && (
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">性别:</span>
                      <span>{user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : user.gender}</span>
                    </div>
                  )}
                  
                  {user.occupation && (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">职业:</span>
                      <span>{user.occupation}</span>
                    </div>
                  )}
                  
                  {user.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">地址:</span>
                      <span>{user.address}</span>
                    </div>
                  )}
                  
                  {user.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">网站:</span>
                      <a 
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  
                  {user.birthday && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">生日:</span>
                      <span>{formatDate(user.birthday)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">加入时间:</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                  
                  {!user.is_online && user.last_seen && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">最后在线:</span>
                      <span>{formatDate(user.last_seen)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                关闭
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;