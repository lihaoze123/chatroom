from flask import render_template, request, redirect, url_for, flash
from app.auth import bp

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # TODO: 实现登录逻辑
        flash('登录功能待实现')
        return redirect(url_for('main.index'))
    return render_template('auth/login.html')

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # TODO: 实现注册逻辑
        flash('注册功能待实现')
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')

@bp.route('/logout')
def logout():
    # TODO: 实现登出逻辑
    flash('已登出')
    return redirect(url_for('main.index')) 