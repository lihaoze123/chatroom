# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=[],
    datas=[('frontend/build', 'frontend/build'), ('config.py', '.'), ('migrations', 'migrations')],
    hiddenimports=['eventlet', 'eventlet.wsgi', 'eventlet.green', 'eventlet.green.socket', 'eventlet.green.threading', 'eventlet.green.time', 'eventlet.green.select', 'eventlet.green.ssl', 'eventlet.green.subprocess', 'eventlet.green.os', 'eventlet.hubs', 'eventlet.hubs.epolls', 'eventlet.hubs.kqueue', 'eventlet.hubs.selects', 'engineio.async_drivers', 'engineio.async_drivers.eventlet', 'engineio.async_drivers.threading', 'flask_socketio', 'flask_cors', 'flask_login', 'flask_sqlalchemy', 'flask_wtf', 'sqlalchemy.dialects.sqlite', 'app.models', 'app.socket_events', 'app.api', 'app.api.auth'],
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
