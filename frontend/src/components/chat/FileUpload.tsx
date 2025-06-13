import React, { useRef, useState } from 'react';
import { Upload, Image, FileText, X } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'react-hot-toast';
import { chatAPI } from '../../services/api';

interface FileUploadProps {
  onFileUploaded: (fileInfo: {
    url: string;
    name: string;
    size: number;
    type: string;
  }) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File, type: 'image' | 'file') => {
    if (disabled || uploading) return;

    // 文件大小检查
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeLimit = type === 'image' ? '10MB' : '50MB';
      toast.error(`文件大小不能超过${sizeLimit}`);
      return;
    }

    setUploading(true);
    try {
      const result = await chatAPI.uploadChatFile(file, type);
      onFileUploaded({
        url: result.file_url,
        name: result.file_name,
        size: result.file_size,
        type: result.file_type
      });
      toast.success('文件上传成功！');
    } catch (error: any) {
      console.error('文件上传失败:', error);
      toast.error(error.response?.data?.error || '文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'image');
    }
    e.target.value = ''; // 重置input
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'file');
    }
    e.target.value = ''; // 重置input
  };

  return (
    <div className="flex gap-2">
      {/* 图片上传 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => imageInputRef.current?.click()}
        className="p-2 h-8 w-8"
      >
        <Image className="h-4 w-4" />
      </Button>
      
      {/* 文件上传 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        className="p-2 h-8 w-8"
      >
        <FileText className="h-4 w-4" />
      </Button>

      {/* 隐藏的文件输入 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {uploading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          上传中...
        </div>
      )}
    </div>
  );
};

export default FileUpload;