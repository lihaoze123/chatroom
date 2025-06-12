import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../types';
import { Eye, EyeOff, UserPlus, User, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // 验证单个字段
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'username':
        if (!value.trim()) return '请输入用户名';
        if (value.length < 2) return '用户名至少需要2个字符';
        if (value.length > 20) return '用户名不能超过20个字符';
        if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(value)) {
          return '用户名只能包含中文、英文字母、数字和下划线';
        }
        return '';
      case 'email':
        if (!value.trim()) return '请输入邮箱地址';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          return '请输入有效的邮箱地址';
        }
        return '';
      case 'password':
        if (!value) return '请输入密码';
        if (value.length < 6) return '密码长度至少6个字符';
        return '';
      case 'password2':
        if (!value) return '请确认密码';
        if (value !== formData.password) return '两次输入的密码不一致';
        return '';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证所有字段
    const newErrors: {[key: string]: string} = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof RegisterData]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    setTouched({ username: true, email: true, password: true, password2: true });
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    const success = await register(formData);
    if (success) {
      navigate('/login');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // 实时验证
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">创建新账户</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            已有账户？{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              立即登录
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">
                  用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`pl-10 h-11 sm:h-12 ${
                      errors.username && touched.username
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }`}
                    placeholder="用户名"
                  />
                </div>
                {errors.username && touched.username && (
                  <p className="mt-1 text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  邮箱
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`pl-10 h-11 sm:h-12 ${
                      errors.email && touched.email
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }`}
                    placeholder="邮箱地址"
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 h-11 sm:h-12 ${
                      errors.password && touched.password
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }`}
                    placeholder="密码（至少6个字符）"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="password2" className="sr-only">
                  确认密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="password2"
                    name="password2"
                    type={showPassword2 ? 'text' : 'password'}
                    required
                    value={formData.password2}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 h-11 sm:h-12 ${
                      errors.password2 && touched.password2
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }`}
                    placeholder="确认密码"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword2(!showPassword2)}
                  >
                    {showPassword2 ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
                {errors.password2 && touched.password2 && (
                  <p className="mt-1 text-sm text-destructive">{errors.password2}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || Object.values(errors).some(error => error !== '')}
              className="w-full h-11 sm:h-12"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  注册中...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  注册
                </div>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground mt-4">
              注册即表示您同意我们的{' '}
              <button
                type="button"
                className="text-primary hover:text-primary/80 transition-colors underline"
                onClick={() => {/* TODO: 显示服务条款 */}}
              >
                服务条款
              </button>
              {' '}和{' '}
              <button
                type="button"
                className="text-primary hover:text-primary/80 transition-colors underline"
                onClick={() => {/* TODO: 显示隐私政策 */}}
              >
                隐私政策
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;