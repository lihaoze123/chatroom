# run.py
# This file will run your Flask application.

from app import create_app
from config import Config

app = create_app(Config)

if __name__ == '__main__':
    app.run(debug=True)