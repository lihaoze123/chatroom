# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('frontend/build', 'frontend/build'), 
        ('config.py', '.'), 
    ],
    hiddenimports=[
        # FastAPI 相关
        'fastapi',
        'uvicorn',
        'uvicorn.main',
        'uvicorn.server',
        'uvicorn.config',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.websockets',
        'starlette',
        'starlette.applications',
        'starlette.middleware',
        'starlette.routing',
        'starlette.responses',
        'starlette.staticfiles',
        
        # Socket.IO 相关
        'socketio',
        'python_socketio',
        'engineio',
        'engineio.async_drivers',
        'engineio.async_drivers.threading',
        'engineio.async_drivers.eventlet',
        
        # SQLAlchemy 相关
        'sqlalchemy',
        'sqlalchemy.dialects.sqlite',
        'sqlalchemy.pool',
        'sqlalchemy.engine',
        'alembic',
        'alembic.runtime',
        'alembic.script',
        
        # 认证相关
        'jose',
        'jose.jwt',
        'passlib',
        'passlib.hash',
        'passlib.context',
        'bcrypt',
        
        # 其他依赖
        'multipart',
        'python_multipart',
        'aiofiles',
        'jinja2',
        'pydantic',
        'pydantic_settings',
        'email_validator',
        'python_dateutil',
        'decouple',
        
        # 应用模块
        'app',
        'app.config',
        'app.database',
        'app.models',
        'app.api',
        'app.api.auth',
        'app.api.rooms',
        'app.api.messages',
        'app.api.upload',
        'app.socket',
        'app.socket.events',
        'app.schemas',
        'app.core',
        'app.utils',
        'main'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='chatroom',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
