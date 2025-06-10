from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Length

class CreateRoomForm(FlaskForm):
    name = StringField('聊天室名称', 
                      validators=[DataRequired(message='请输入聊天室名称'),
                                Length(min=2, max=50, message='聊天室名称长度必须在2-50个字符之间')])
    
    description = TextAreaField('描述',
                               validators=[DataRequired(message='请输入聊天室描述'),
                                         Length(max=200, message='描述不能超过200个字符')])
    
    submit = SubmitField('创建聊天室')