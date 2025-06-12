import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginData } from '../../types';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    username: '',
    password: '',
    remember_me: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(formData);
    if (success) {
      navigate('/chat');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5,
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center px-4 sm:px-6">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4"
            >
              <LogIn className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-xl sm:text-2xl font-bold">登录您的账户</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                还没有账户？{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  立即注册
                </Link>
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label htmlFor="username" className="sr-only">
                    用户名
                  </label>
                  <motion.div 
                    className="relative"
                    animate={{
                      scale: focusedField === 'username' ? 1.02 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <motion.div 
                      className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      animate={{
                        color: focusedField === 'username' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      <User className="h-4 w-4" />
                    </motion.div>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      className="pl-10 h-11 sm:h-12"
                      placeholder="用户名"
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label htmlFor="password" className="sr-only">
                    密码
                  </label>
                  <motion.div 
                    className="relative"
                    animate={{
                      scale: focusedField === 'password' ? 1.02 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <motion.div 
                      className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      animate={{
                        color: focusedField === 'password' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      <Lock className="h-4 w-4" />
                    </motion.div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="pl-10 pr-10 h-11 sm:h-12"
                      placeholder="密码"
                    />
                    <motion.button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        animate={{ rotate: showPassword ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </motion.div>
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0"
              >
                <motion.div 
                  className="flex items-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <input
                    id="remember_me"
                    name="remember_me"
                    type="checkbox"
                    checked={formData.remember_me}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-sm text-foreground">
                    记住我
                  </label>
                </motion.div>

                <div className="text-sm">
                  <motion.button
                    type="button"
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                    onClick={() => {/* TODO: 实现忘记密码功能 */}}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    忘记密码？
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                                 <Button
                   type="submit"
                   disabled={loading}
                   className="w-full h-11 sm:h-12"
                   size="lg"
                 >
                  {loading ? (
                    <div className="flex items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-b-2 border-primary-foreground rounded-full mr-2"
                      />
                      登录中...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      登录
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginForm; 