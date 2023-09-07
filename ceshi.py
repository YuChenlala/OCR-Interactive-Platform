from flask import Flask, request, jsonify
from flask_cors import CORS
import json
app = Flask(__name__)
CORS(app)
@app.route('/upload', methods=['POST'])
def process_images():
    # 获取上传的文件
    files = request.files.getlist('images')

    # 处理图片并生成数据
    # 返回处理结果
    file = open('data.json', 'r')
    return file

@app.route('/submit', methods=['POST'])
def hello():
    image = request.files['image']
    json_file = request.form['text']
    print(json_file)
    json_data = json.loads(json_file)
    return jsonify("hello")


if __name__ == '__main__':
    app.run()
