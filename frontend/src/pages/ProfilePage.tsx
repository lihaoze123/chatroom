import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import AvatarUpload from '../components/ui/avatar-upload';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Save, User as UserIcon, Mail, MapPin, Briefcase, Calendar, LogOut, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { User } from '../types';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    email: '',
    address: '',
    bio: '',
    gender: '',
    birthday: '',
    occupation: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        address: user.address || '',
        bio: user.bio || '',
        gender: user.gender || '',
        birthday: user.birthday || '',
        occupation: user.occupation || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 过滤掉空字符串和null值，只发送有效数据
      const filteredData: Partial<User> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          (filteredData as any)[key] = value;
        }
      });
      
      console.log('🔍 前端发送的数据:', filteredData);
      
      const updatedUser = await authAPI.updateUser(filteredData);
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success('个人信息更新成功！');
    } catch (error) {
      console.error('更新失败:', error);
      toast.error(error instanceof Error ? error.message : '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        address: user.address || '',
        bio: user.bio || '',
        gender: user.gender || '',
        birthday: user.birthday || '',
        occupation: user.occupation || '',
        avatar_url: user.avatar_url || '',
      });
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败，请稍后重试');
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* 顶部导航 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 md:mb-8"
        >
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/chat')}
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">个人资料</h1>
          </div>
          
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              size="sm"
              className="md:size-default"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              编辑资料
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                size="sm"
                className="md:size-default"
              >
                取消
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading}
                size="sm"
                className="md:size-default"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    保存中...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* 左侧头像和基本信息 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* 头像区域 */}
                  <div className="relative">
                    <AvatarUpload 
                      user={user}
                      onAvatarUpdate={(updatedUser) => {
                        updateUser(updatedUser);
                        if (!isEditing) {
                          setFormData({
                            username: updatedUser.username || '',
                            email: updatedUser.email || '',
                            address: updatedUser.address || '',
                            bio: updatedUser.bio || '',
                            gender: updatedUser.gender || '',
                            birthday: updatedUser.birthday || '',
                            occupation: updatedUser.occupation || '',
                            avatar_url: updatedUser.avatar_url || ''
                          });
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            avatar_url: updatedUser.avatar_url || ''
                          }));
                        }
                      }}
                      size="lg"
                      showUploadButton={true}
                    />
                  </div>
                  
                  {/* 用户名和标识 */}
                  <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {user.username}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  
                  {/* 个人简介 */}
                  {user.bio && (
                    <div className="w-full max-w-xs">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {user.bio}
                      </p>
                    </div>
                  )}
                  
                  <Separator className="w-full" />
                  
                  {/* 加入时间 */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">加入时间</p>
                      <p className="text-xs">
                        {new Date(user.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="w-full" />
                  
                  {/* 退出登录按钮 */}
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 右侧详细信息 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <Card>
              <CardHeader className="pb-4 md:pb-6">
                <CardTitle className="text-lg md:text-xl">详细信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 md:space-y-8">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">基本信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm">用户名</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('username', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">邮箱</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm">性别</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value: string) => handleInputChange('gender', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">男</SelectItem>
                          <SelectItem value="female">女</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthday" className="text-sm">生日</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="birthday"
                          type="date"
                          value={formData.birthday}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('birthday', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* 其他信息 */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">其他信息</h3>
                  <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm">地址</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('address', e.target.value)}
                            disabled={!isEditing}
                            placeholder="请输入地址"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="occupation" className="text-sm">职业</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="occupation"
                            value={formData.occupation}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('occupation', e.target.value)}
                            disabled={!isEditing}
                            placeholder="请输入职业"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm">个人简介</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        placeholder="介绍一下自己..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;