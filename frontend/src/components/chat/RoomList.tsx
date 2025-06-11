import React, { useState, useEffect } from 'react';
import { ChatRoom } from '../../types';
import { chatAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { Hash, Users, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface RoomListProps {
  onRoomSelect: (room: ChatRoom) => void;
  selectedRoomId?: number;
}

const RoomList: React.FC<RoomListProps> = ({ onRoomSelect, selectedRoomId }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createRoom } = useChat();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await chatAPI.getRooms();
      setRooms(roomsData);
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

  const handleCreateRoom = async (name: string, description?: string) => {
    const room = await createRoom(name, description);
    if (room) {
      setRooms(prev => [...prev, room]);
      setShowCreateModal(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">聊天室</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCreateModal(true)}
            title="创建聊天室"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索聊天室..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {filteredRooms.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchTerm ? '没有找到匹配的聊天室' : '暂无聊天室'}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={selectedRoomId === room.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto p-3"
                  onClick={() => onRoomSelect(room)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="flex-shrink-0">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {room.name}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          {room.member_count || 0}
                        </div>
                      </div>
                      {room.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {room.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* 创建聊天室模态框 */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </Card>
  );
};

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (name: string, description?: string) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onCreate(name.trim(), description.trim() || undefined);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
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
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="输入聊天室描述"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    创建中...
                  </div>
                ) : (
                  '创建'
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