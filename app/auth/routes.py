from flask import render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user, login_required
from app import db
from app.models import User
from app.auth import bp

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    if request.method != 'POST':
        return render_template('auth/register.html')

    # 获取表单数据
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    password2 = request.form.get('password2')

    # 验证表单数据
    if not all([username, email, password, password2]):
        flash('所有字段都必须填写！', 'danger')
        return render_template('auth/register.html')

    if password != password2:
        flash('两次输入的密码不匹配！', 'danger')
        return render_template('auth/register.html', username=username, email=email)

    if User.query.filter_by(username=username).first():
        flash('用户名已被使用，请选择其他用户名。', 'danger')
        return render_template('auth/register.html', username=username, email=email)

    if User.query.filter_by(email=email).first():
        flash('该邮箱已被注册，请使用其他邮箱。', 'danger')
        return render_template('auth/register.html', username=username, email=email)

    # 创建新用户
    try:
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        flash('注册成功！欢迎加入我们！', 'success')
        return redirect(url_for('auth.login'))
    except Exception as e:
        flash('注册过程中发生错误，请稍后重试。', 'danger')
        return render_template('auth/register.html', username=username, email=email)

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    if request.method != 'POST':
        return render_template('auth/login.html')
    
    # 获取表单数据
    username = request.form.get('username')
    password = request.form.get('password')
    remember_me = request.form.get('remember_me') == 'on'
    
    # 验证表单数据
    if not username or not password:
        flash('用户名和密码都必须填写！', 'danger')
        return render_template('auth/login.html')
    
    # 验证用户凭据
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        flash('用户名或密码错误', 'danger')
        return redirect(url_for('auth.login'))
    
    # 登录用户并重定向
    login_user(user, remember=remember_me)
    next_page = request.args.get('next')
    if not next_page or not next_page.startswith('/'):
        next_page = url_for('main.index')
    return redirect(next_page)

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('您已成功退出登录。', 'info')
    return redirect(url_for('main.index'))

@bp.route('/profile')
@login_required
def profile():
    return f"你好，{current_user.username}！这是您的个人资料页面。"