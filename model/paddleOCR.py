from paddleocr import PaddleOCR, draw_ocr
from PIL import Image
# Paddleocr目前支持的多语言语种可以通过修改lang参数进行切换
# 例如`ch`, `en`, `fr`, `german`, `korean`, `japan`
ocr = PaddleOCR(use_angle_cls=True, lang="ch")  # need to run only once to download and load model into memory

def image_to_text(image_path):
    result = ocr.ocr(image_path, cls=True)
    image = Image.open(image_path)
    width, height = image.size
    for idx in range(len(result)):
        res = result[idx]
        for line in res:
            for point in line[0]:
                point[0] /= width
                point[1] /= height
            line[0][2][0] += 0.01
            line[0][2][1] += 0.01
            line[0][3][1] += 0.01
    return result[0]



