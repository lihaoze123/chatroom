import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gender: '',
    bio: '',
    occupation: '', // 用作兴趣爱好字段
  });

  useEffect(() => {
    if (user) {
      console.log('ProfilePage useEffect - 当前user信息:', user);
      setFormData({
        gender: user.gender || '',
        bio: user.bio || '',
        occupation: user.occupation || '',
      });
      console.log('ProfilePage useEffect - 设置formData完成');
    }
  }, [user]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenderSelect = (gender: string) => {
    setFormData((prev) => ({
      ...prev,
      gender,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('ProfilePage handleSave - 开始保存，当前formData:', formData);
      
      // 创建FormData对象
      const formDataToSend = new FormData();
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('occupation', formData.occupation);
      
      // 调用API更新用户信息
      const response = await authAPI.updateProfile(formDataToSend);
      console.log('ProfilePage handleSave - API响应:', response);
      
      // 更新本地用户状态
      if (response.user) {
        console.log('ProfilePage handleSave - 更新本地用户状态:', response.user);
        updateUser(response.user);
      }
      
      toast.success('个人信息保存成功！');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 px-4 lg:px-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 lg:h-10 lg:w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">个人信息</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 lg:p-6 space-y-6">
        {/* 用户基本信息显示 */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="text-sm text-muted-foreground">用户名</div>
          <div className="font-medium">{user.username}</div>
          <div className="text-sm text-muted-foreground">邮箱</div>
          <div className="font-medium">{user.email}</div>
        </div>

        {/* 性别选择 */}
        <div className="space-y-3">
          <label className="text-sm font-medium">性别</label>
          <div className="flex space-x-3">
            <Button
              variant={formData.gender === '男' ? 'default' : 'outline'}
              onClick={() => handleGenderSelect('男')}
              className="flex-1"
            >
              男
            </Button>
            <Button
              variant={formData.gender === '女' ? 'default' : 'outline'}
              onClick={() => handleGenderSelect('女')}
              className="flex-1"
            >
              女
            </Button>
          </div>
        </div>

        {/* 个性签名 */}
        <div className="space-y-3">
          <label htmlFor="bio" className="text-sm font-medium">
            个性签名
          </label>
          <textarea
            id="bio"
            rows={3}
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder="写点什么介绍一下自己吧..."
            maxLength={200}
          />
          <div className="text-xs text-muted-foreground text-right">
            {formData.bio.length}/200
          </div>
        </div>

        {/* 兴趣爱好 */}
        <div className="space-y-3">
          <label htmlFor="interests" className="text-sm font-medium">
            兴趣爱好
          </label>
          <Input
            id="interests"
            type="text"
            value={formData.occupation}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            placeholder="如：阅读、旅行、音乐、运动等"
            className="h-10"
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground">
            请用逗号分隔多个兴趣爱好
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 order-2 sm:order-1"
            disabled={loading}
          >
            返回主页
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 order-1 sm:order-2"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                保存中...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                保存修改
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePage;