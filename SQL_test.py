from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

app = Flask(__name__)
HOSTNAME = "127.0.0.1"
PORT = 3306
USERNAME = "root"
PASSWORD = "ZHOUYANG666"
DATABASE = "ocr_data"
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}?charset=utf8mb4"

db = SQLAlchemy(app)

def get_image_binary_data(image_path):
    with open(image_path, 'rb') as file:
        binary_data = file.read()
    return binary_data

class Image(db.Model):
    __tablename__ = "image"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    file_data = db.Column(db.LargeBinary(length=2**32-1))
    texts = db.relationship("Text", back_populates="origin_image")

class Text(db.Model):
    __tablename__ = "text"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    file_data = db.Column(db.Text)
    origin_image_id = db.Column(db.Integer, db.ForeignKey("image.id"))
    origin_image = db.relationship("Image", back_populates="texts")

with app.app_context():
    db.create_all()

@app.route('/hello')
def hello():
    image_path = '1.png'
    binary_data = get_image_binary_data(image_path)
    image = Image(file_data=binary_data)
    db.session.add(image)
    db.session.commit()
    return "hello"


if __name__ == '__main__':
    app.run(debug=True)