import React, { useState, useEffect } from 'react';
import { ChatRoom } from '../../types';
import { chatAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { Hash, Users, Plus, Search, Lock, User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import PasswordPrompt from '../ui/PasswordPrompt';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

interface RoomListProps {
  onRoomSelect: (room: ChatRoom, isUserRoom?: boolean) => void;
  selectedRoomId?: number;
}

const RoomList: React.FC<RoomListProps> = ({ onRoomSelect, selectedRoomId }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [userRooms, setUserRooms] = useState<ChatRoom[]>([]);
  const [availableRooms, setAvailableRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createRoom, joinRoom, enterRoom } = useChat();
  const { logout, user } = useAuth();
  const navigate = useNavigate();


  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<ChatRoom | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败，请稍后重试');
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getRooms();
      
      // 检查是否是新的数据结构
      if (Array.isArray(response)) {
        // 旧的数据结构，所有房间都在一个数组中
        setRooms(response);
        setUserRooms([]);
        setAvailableRooms(response);
      } else {
        // 新的数据结构，区分用户房间和可用房间
        const { user_rooms = [], available_rooms = [] } = response;
        setUserRooms(user_rooms);
        setAvailableRooms(available_rooms);
        setRooms([...user_rooms, ...available_rooms]);
      }
    } catch (error) {
      console.error('Load rooms error:', error);
      toast.error('加载聊天室失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRoom = async (name: string, description?: string, isPrivate?: boolean, password?: string) => {
    const room = await createRoom(name, description, isPrivate, password);
    if (room) {
      // 创建者自动成为房间成员，所以应该添加到用户房间列表
      setUserRooms(prev => [...prev, room]);
      setRooms(prev => [...prev, room]);
      setShowCreateModal(false);
      
      // 重新加载房间列表以确保数据同步
      setTimeout(() => {
        loadRooms();
      }, 500);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 border-b-2 border-primary rounded-full"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 px-4 lg:px-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <CardTitle className="text-lg">聊天室</CardTitle>
          <motion.div
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateModal(true)}
              title="创建聊天室"
              className="h-8 w-8 lg:h-10 lg:w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索聊天室..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 lg:h-10"
          />
        </motion.div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <AnimatePresence mode="wait">
            {filteredRooms.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 text-center text-muted-foreground"
              >
                <div className="py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-4xl mb-4"
                  >
                    🔍
                  </motion.div>
                  {searchTerm ? '没有找到匹配的聊天室' : '暂无聊天室'}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="rooms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-1 p-2 lg:p-3"
              >
                <AnimatePresence>
                  {filteredRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                      layout
                    >
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Button
                          variant={selectedRoomId === room.id ? "secondary" : "ghost"}
                          className="w-full justify-start h-auto p-3 lg:p-4 relative overflow-hidden"
                          onClick={() => {
                            // 检查是否是用户已加入的房间
                            const isUserRoom = userRooms.some(ur => ur.id === room.id);
                            
                            if (isUserRoom) {
                              // 用户已加入的房间，直接进入
                              onRoomSelect(room, true);
                            } else if (room.is_private) {
                              // 私密房间需要密码
                              setPendingRoom(room);
                              setShowPasswordPrompt(true);
                            } else {
                              // 公开房间，需要加入
                              onRoomSelect(room, false);
                            }
                          }}
                        >
                          {selectedRoomId === room.id && (
                            <motion.div
                              layoutId="selectedRoom"
                              className="absolute inset-0 bg-secondary rounded-md"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                          
                          <div className="flex items-center space-x-3 w-full min-w-0 relative z-10">
                            <motion.div 
                              className="flex-shrink-0"
                            >
                              {room.is_private ? (
                                <Lock className="h-4 w-4 text-amber-500" />
                              ) : (
                                <Hash className="h-4 w-4 text-muted-foreground" />
                              )}
                            </motion.div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {room.name}
                                  </p>
                                  {room.is_private && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.2 }}
                                      className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    >
                                      私密
                                    </motion.span>
                                  )}
                                </div>
                                <motion.div 
                                  className="flex items-center text-xs text-muted-foreground flex-shrink-0"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {room.member_count || 0}
                                </motion.div>
                              </div>
                              {room.description && (
                                <motion.p 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                  className="text-xs text-muted-foreground truncate mt-1"
                                >
                                  {room.description}
                                </motion.p>
                              )}
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
      
      {/* 底部个人信息按钮 */}
      <div className="p-3 border-t">
        <motion.div
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-3"
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center space-x-3 w-full">
              <motion.div
                className="flex-shrink-0"
              >
                {user ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : ''} alt={user.username} />
                    <AvatarFallback className="text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </motion.div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">个人资料</p>
                <p className="text-xs text-muted-foreground">查看和编辑个人信息</p>
              </div>
            </div>
          </Button>
        </motion.div>
        
        {/* 退出登录按钮 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-2"
        >
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <div className="flex items-center space-x-3 w-full">
              <motion.div
                className="flex-shrink-0 p-2 bg-destructive/10 rounded-full"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <LogOut className="h-4 w-4 text-destructive" />
              </motion.div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">退出登录</p>
                <p className="text-xs text-muted-foreground">安全退出当前账户</p>
              </div>
            </div>
          </Button>
        </motion.div>
      </div>

      {/* 创建聊天室模态框 */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoomModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateRoom}
          />
        )}
      </AnimatePresence>

      {/* 密码提示框 */}
      <AnimatePresence>
        {showPasswordPrompt && pendingRoom && (
          <PasswordPrompt
            isOpen={showPasswordPrompt}
            roomName={pendingRoom.name}
            onClose={() => {
              setShowPasswordPrompt(false);
              setPendingRoom(null);
            }}
            onSubmit={async (password) => {
              try {
                await joinRoom(pendingRoom.id, password);
                // 成功加入房间后，直接通知父组件进入房间（不需要再次加入）
                onRoomSelect(pendingRoom, true);
                setShowPasswordPrompt(false);
                setPendingRoom(null);
                
                // 重新加载房间列表以更新用户房间状态
                setTimeout(() => {
                  loadRooms();
                }, 500);
              } catch (err) {
                console.error('Password error:', err);
                toast.error('密码错误或无法加入该房间');
              }
            }}
          />
        )}
      </AnimatePresence>
    </Card>
  );
};

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (
    name: string,
    description?: string,
    isPrivate?: boolean,
    password?: string
  ) => void;
}


const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onCreate(
      name.trim(),
      description.trim() || undefined,
      isPrivate,
      isPrivate ? password.trim() : undefined
    );
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>创建聊天室</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roomName" className="text-sm font-medium">
                聊天室名称 *
              </label>
              <Input
                id="roomName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入聊天室名称"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="roomDescription" className="text-sm font-medium">
                描述（可选）
              </label>
              <textarea
                id="roomDescription"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="输入聊天室描述"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
        <input
        type="checkbox"
        checked={isPrivate}
        onChange={(e) => setIsPrivate(e.target.checked)}
      />
      <span>是否为私密聊天室</span>
    </label>
  </div>

{isPrivate && (
  <div className="space-y-2">
    <label htmlFor="roomPassword" className="text-sm font-medium">
      聊天室密码 *
    </label>
    <Input
      id="roomPassword"
      type="password"
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="请输入密码"
      className="h-10"
    />
  </div>
)}


            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 order-2 sm:order-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 order-1 sm:order-2"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    创建中...
                  </div>
                ) : (
                  '创建聊天室'
                )}
              </Button>
            </div>
          </form>
        </CardContent>



      </Card>
    </div>
  );
};

export default RoomList;