from flask import render_template
from app.main import bp

@bp.route('/')
@bp.route('/<name>')
def index(name='World'):
    return render_template('index.html', person=name)