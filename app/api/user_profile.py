# 用户资料API

from flask import jsonify
from flask_login import login_required
from app.api import bp
from app.models import User
from app.utils import get_client_ip

@bp.route('/users/<int:user_id>/profile', methods=['GET'])
@login_required
def api_get_user_profile(user_id):
    """获取指定用户的公开资料API"""
    client_ip = get_client_ip()
    
    try:
        user = User.query.get_or_404(user_id)
        
        # 返回用户的公开信息
        user_data = {
            'id': user.id,
            'username': user.username,
            'avatar_url': user.avatar_url,
            'real_name': user.real_name,
            'bio': user.bio,
            'gender': user.gender,
            'occupation': user.occupation,
            'website': user.website,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'is_online': user.is_online,
            'last_seen': user.last_seen.isoformat() if user.last_seen else None
        }
        
        return jsonify({
            'user': user_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取用户信息失败'}), 500