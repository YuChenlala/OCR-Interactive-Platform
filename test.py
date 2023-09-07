# import requests
#
# # 定义上传的图片文件路径
# image_paths = [
#     '1.png',
#     # 添加更多图片路径...
#     # 添加更多图片路径...
# ]
#
# # 构建请求数据
# files = [('images', open(image_path, 'rb')) for image_path in image_paths]
#
# # 发送POST请求
# url = 'http://127.0.0.1:5000/upload'  # 根据实际的Flask接口地址进行修改
# response = requests.post(url, files=files)
#
# # 打印返回结果
# # for idx in range(len(response)):
# #     res = response[idx]
# #     for line in res:
# #         print(line)
# print(response.status_code)
# print(response.text)

#
import requests
import json
from werkzeug.datastructures import FileStorage
def test_upload_files():
    url = 'http://localhost:5000/submit'  # 替换为实际的接口地址


    files ={}
    files['image'] = open('1.png', 'rb')
    files['json'] = open('data.json', 'r')
    # 构建请求数据


    # 发送 POST 请求
    response = requests.post(url, files=files)

    # 打印响应结果
    print(response.status_code)
    print(response.text)

    # 关闭文件
    for file in files.values():
        file.close()

if __name__ == '__main__':
    test_upload_files()
