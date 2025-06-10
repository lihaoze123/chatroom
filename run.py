#!/usr/bin/env python3
# run.py
# Flask应用启动文件

import os
import sys
from app import create_app, socketio
from config import config

def main():
    """主函数"""
    # 获取配置环境
    config_name = os.environ.get('FLASK_ENV', 'development')
    
    try:
        # 创建应用实例
        config_class = config.get(config_name, config['default'])
        app = create_app(config_class)
        
        # 获取运行参数
        host = os.environ.get('FLASK_HOST', '127.0.0.1')
        port = int(os.environ.get('FLASK_PORT', 5000))
        debug = config_name == 'development'
        
        print(f"启动聊天室应用...")
        print(f"环境: {config_name}")
        print(f"地址: http://{host}:{port}")
        print(f"调试模式: {'开启' if debug else '关闭'}")
        
        # 使用Socket.IO运行应用
        socketio.run(app, host=host, port=port, debug=debug)
        
    except KeyboardInterrupt:
        print("\n应用已停止")
        sys.exit(0)
    except Exception as e:
        print(f"应用启动失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()