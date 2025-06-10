from flask import render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.utils import secure_filename
from app import db
from app.models import User
from app.auth import bp
import os
import uuid

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

# 个人资料页面
@bp.route('/profile')
@login_required
def profile():
    return render_template('auth/profile.html', user=current_user)

# 编辑个人资料
@bp.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    if request.method == 'POST':
        # 处理头像上传
        avatar_file = request.files.get('avatar')
        if avatar_file and avatar_file.filename:
            # 验证文件类型
            allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
            if '.' in avatar_file.filename and \
               avatar_file.filename.rsplit('.', 1)[1].lower() in allowed_extensions:
                
                # 生成唯一文件名
                filename = str(uuid.uuid4()) + '.' + avatar_file.filename.rsplit('.', 1)[1].lower()
                
                # 确保上传目录存在
                upload_folder = os.path.join(current_app.root_path, 'static', 'images', 'avatars')
                os.makedirs(upload_folder, exist_ok=True)
                
                # 保存文件
                file_path = os.path.join(upload_folder, filename)
                avatar_file.save(file_path)
                
                # 删除旧头像（如果不是默认头像）
                if current_user.avatar and current_user.avatar != 'default.jpg':
                    old_file_path = os.path.join(upload_folder, current_user.avatar)
                    if os.path.exists(old_file_path):
                        try:
                            os.remove(old_file_path)
                        except:
                            pass  # 忽略删除失败的情况
                
                # 更新用户头像
                current_user.avatar = filename
            else:
                flash('头像文件格式不支持，请上传 PNG、JPG、JPEG 或 GIF 格式的图片', 'danger')
                return render_template('auth/edit_profile.html', user=current_user)
        
        # 更新用户信息
        current_user.real_name = request.form.get('real_name', '').strip()
        current_user.phone = request.form.get('phone', '').strip()
        current_user.address = request.form.get('address', '').strip()
        current_user.bio = request.form.get('bio', '').strip()
        current_user.gender = request.form.get('gender', '').strip()
        current_user.occupation = request.form.get('occupation', '').strip()
        current_user.website = request.form.get('website', '').strip()
        
        # 处理生日
        birthday_str = request.form.get('birthday', '').strip()
        if birthday_str:
            try:
                from datetime import datetime
                current_user.birthday = datetime.strptime(birthday_str, '%Y-%m-%d').date()
            except ValueError:
                flash('生日格式不正确，请使用 YYYY-MM-DD 格式', 'danger')
                return render_template('auth/edit_profile.html', user=current_user)
        
        try:
            db.session.commit()
            flash('个人资料更新成功！', 'success')
            return redirect(url_for('auth.profile'))
        except Exception as e:
            db.session.rollback()
            flash('更新失败，请重试', 'danger')
            return render_template('auth/edit_profile.html', user=current_user)
    
    return render_template('auth/edit_profile.html', user=current_user)
