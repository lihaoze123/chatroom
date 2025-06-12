import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  gender?: string;
  bio?: string;
  occupation?: string;
}

interface UserProfilePageProps {
  userId: number;
  onBack: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId, onBack }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getUserProfile(userId);
        setUser(response.user);
      } catch (error: any) {
        console.error('获取用户信息失败:', error);
        toast.error('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
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

  if (!user) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">用户信息不存在</p>
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
            <CardTitle className="text-lg">用户信息</CardTitle>
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

        {/* 性别显示 */}
        {user.gender && (
          <div className="space-y-3">
            <label className="text-sm font-medium">性别</label>
            <div className="bg-muted/30 rounded-lg p-3">
              <span className="text-sm">{user.gender}</span>
            </div>
          </div>
        )}

        {/* 个性签名显示 */}
        {user.bio && (
          <div className="space-y-3">
            <label className="text-sm font-medium">个性签名</label>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
            </div>
          </div>
        )}

        {/* 兴趣爱好显示 */}
        {user.occupation && (
          <div className="space-y-3">
            <label className="text-sm font-medium">兴趣爱好</label>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm">{user.occupation}</p>
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            返回聊天
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfilePage;