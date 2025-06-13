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
import { ArrowLeft, Save, User as UserIcon, Mail, MapPin, Briefcase, Calendar, LogOut } from 'lucide-react';
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
      const updatedUser = await authAPI.updateUser(formData);
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/chat')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">个人资料</h1>
          </div>
          
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              编辑资料
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={loading}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧头像和基本信息 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <AvatarUpload 
                    user={user}
                    onAvatarUpdate={(updatedUser) => {
                      updateUser(updatedUser);
                      // 只在非编辑模式下更新formData，避免覆盖用户正在编辑的数据
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
                        // 在编辑模式下，只更新avatar_url字段
                        setFormData(prev => ({
                          ...prev,
                          avatar_url: updatedUser.avatar_url || ''
                        }));
                      }
                    }}
                    size="lg"
                    showUploadButton={true}
                  />
                  
                  <h2 className="text-xl font-semibold mb-2">
                    {user.username}
                  </h2>
                  
                  <p className="text-muted-foreground mb-4">
                    @{user.username}
                  </p>
                  
                  {user.bio && (
                    <p className="text-sm text-muted-foreground">
                      {user.bio}
                    </p>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div className="text-sm text-muted-foreground">
                    <p>加入时间</p>
                    <p>{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* 退出登录按钮 */}
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>退出登录</span>
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
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>详细信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('username', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  

                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">性别</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('gender', e.target.value)}
                      disabled={!isEditing}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">请选择</option>
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthday">生日</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('birthday', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* 联系信息 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">地址</Label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        placeholder="请输入地址"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="occupation">职业</Label>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('occupation', e.target.value)}
                        disabled={!isEditing}
                        placeholder="请输入职业"
                      />
                    </div>
                  </div>
                  

                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">个人简介</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      placeholder="介绍一下自己..."
                      rows={4}
                    />
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