import PIL
from flask import Flask, request, jsonify, abort
import os
from model.paddleOCR import image_to_text
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
import json
import time
import PIL
app = Flask(__name__)
CORS(app)
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
    file_data = db.Column(db.JSON)
    origin_image_id = db.Column(db.Integer, db.ForeignKey("image.id"))
    origin_image = db.relationship("Image", back_populates="texts")

with app.app_context():
    db.create_all()

with app.app_context():
    db.create_all()


#限制文件格式为图片
ALLOWED_EXTENSIONS_IMAGE = {'png', 'jpg', 'jpeg'}

ALLOWED_EXTENSIONS_JSON = {'json'}

def allowed_file_image(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS_IMAGE


def allowed_file_json(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS_JSON

#对传入数据进行检验
@app.before_request
def validate_files():
    endpoint = request.endpoint
    if endpoint == 'upload':
        if 'image' not in request.files:
            return jsonify({'error': 'Both image and json files are required.'}), 400

        image_file = request.files['image']
        if not allowed_file_image(image_file.filename):
            return jsonify({'error': 'Invalid file type. Allowed extensions are: png, jpg, jpeg.'}), 400

    elif endpoint == 'submit':
        if 'image' not in request.files or 'json' not in request.files:
            return jsonify({'error': 'Both image and json files are required.'}), 400

        image_file = request.files['image']
        json_file = request.files['json']
        if allowed_file_image(image_file.filename):
            print("1")
        if not allowed_file_image(image_file.filename):
            abort(400, {'error': 'Invalid JSON data. Required fields are missing.'})
        if not allowed_file_json(json_file.filename):
            abort(400, {'error': 'Invalid JSON file type. Allowed extensions are: json.'})
        pass

@app.route('/upload', methods = ['POST'])
def UploadApi():
    images = request.files.getlist("images")  # 获取上传的多张图片
    # 对图片进行处理
    save_folder = 'uploads'
    os.makedirs(save_folder, exist_ok=True)
    cnt = 0
    text_data = {
        'image_num': len(images),
        'message': 'Image uploaded successfully',
    }
    result_list = []

    for image_file in images:
        # 保存图片到指定文件夹
        cnt += 1
        file_path = os.path.join(save_folder, image_file.filename)
        image_file.save(file_path) #临时保存
        data = {
            'id': cnt,
        }
        data_text = image_to_text(f"uploads/{image_file.filename}")
        os.remove(file_path)        #删除文件
        data['image_data'] = data_text
        result_list.append(data)
    text_data['OCR_data'] = result_list
    # 返回JSON响应
    return jsonify(text_data)


@app.route('/submit', methods = ['POST'])
def SubmitApi():
    image = request.files['image']
    json_file = request.form['text']
    print(json_file)
    json_data = json.loads(json_file)
    # 对图片进行处理
    save_folder = 'uploads'
    os.makedirs(save_folder, exist_ok=True)
    image_id = int(time.time())
    # 保存图片到指定文件夹
    file_path = os.path.join(save_folder, image.filename)
    image.save(file_path)  # 临时保存
    Tupian = PIL.Image.open(file_path)
    Tupian.close()
    width, height = Tupian.size
    binary_data = get_image_binary_data(file_path)
    image = Image(id=image_id, file_data=binary_data)
    db.session.add(image)
    db.session.commit()
    os.remove(file_path)  # 删除文件
    try:
        for index in json_data:
            for point in index[0]:
                point[0] *= width
                point[1] *= height
        text = Text(file_data=json.dumps(json_data))
        image = Image.query.get(image_id)
        text.origin_image_id = image.id
        db.session.add(text)
        db.session.commit()
    except json.JSONDecodeError:
        error_message = {'error': 'Invalid JSON file'}
        return jsonify(error_message), 400
    return jsonify("success")

if __name__ == '__main__':
    app.run(debug=True)