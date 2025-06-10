# app/auth/routes.py
# Define your authentication routes (login, register, logout) here.

from flask import render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user, login_required
from app import db
from app.models import User
from app.auth import bp

# Assume you have WTForms or similar for form handling.
# For simplicity, I'll use direct request.form access, but forms are recommended for production.

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index')) # Redirect to main page if already logged in

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        password2 = request.form.get('password2')

        if not username or not email or not password or not password2:
            flash('All fields are required!', 'danger')
            return render_template('auth/register.html')

        if password != password2:
            flash('Passwords do not match!', 'danger')
            return render_template('auth/register.html', username=username, email=email)

        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists. Please choose a different one.', 'danger')
            return render_template('auth/register.html', username=username, email=email)

        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email address already registered. Please use a different one.', 'danger')
            return render_template('auth/register.html', username=username, email=email)

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!', 'success')
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember_me = request.form.get('remember_me') == 'on' # Check if checkbox is checked

        if not username or not password:
            flash('Username and password are required!', 'danger')
            return render_template('auth/login.html')

        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            flash('Invalid username or password', 'danger')
            return redirect(url_for('auth.login'))

        login_user(user, remember=remember_me)
        next_page = request.args.get('next')
        if not next_page or not next_page.startswith('/'): # Security check for 'next' URL
            next_page = url_for('main.index')
        return redirect(next_page)
    return render_template('auth/login.html')

@bp.route('/logout')
@login_required # Ensure only logged-in users can logout
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.index'))

# Example of a protected route
@bp.route('/profile')
@login_required
def profile():
    return f"Hello, {current_user.username}! This is your profile page."