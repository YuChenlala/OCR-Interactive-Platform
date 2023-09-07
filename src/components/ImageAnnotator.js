import React, { useState, useEffect, useRef  } from 'react';
import { Button } from 'antd';
import "./ImageAnnotator.scss";

function ImageAnnotator({ image, onClose }) {
  const [text, setText] = useState('');
  const [showAnnotator, setShowAnnotator] = useState(true);
  const [rectangles, setRectangles] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const startPositionRef = useRef(null);


  // 处理鼠标按下事件
  const handleMouseDown = (event) => {
    setDrawing(true);
    startPositionRef.current = { x: event.clientX, y: event.clientY };
  };

  // 处理鼠标移动事件
  const handleMouseMove = (event) => {
    if (drawing) {
      const rect = event.target.getBoundingClientRect();
      const startX = startPositionRef.current.x - rect.left;
      const startY = startPositionRef.current.y - rect.top;
      const width = event.clientX - startPositionRef.current.x;
      const height = event.clientY - startPositionRef.current.y;
      const tempRect = { x: startX, y: startY, width, height };
      setRectangles([...rectangles.slice(0, -1), tempRect]);
    }
  };

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    if (drawing) {
      setDrawing(false);
      startPositionRef.current = null;
    }
  };

  // 渲染标记矩形
  const renderRectangles = () => {
    return rectangles.map((rectangle, index) => (
      <div
        key={index}
        style={{
          position: 'absolute',
          left: rectangle.x,
          top: rectangle.y,
          width: rectangle.width,
          height: rectangle.height,
          border: '2px solid red',
          pointerEvents: 'none',
        }}
      />
    ));
  };
  
  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleComplete = () => {
    // 获取图片的位置和尺寸
    const imageElement = document.querySelector('.image-annotator-popup img');
    const imageRect = imageElement.getBoundingClientRect();
    const imageWidth = imageElement.width;
    const imageHeight = imageElement.height;

    // 将矩形四个端点的相对坐标计算并存储到新的数组中
    const rectanglesWithRelativeCoordinates = rectangles.map((rectangle) => {
      const x1 = rectangle.x / imageWidth;
      const y1 = rectangle.y / imageHeight;
      const x2 = (rectangle.x + rectangle.width) / imageWidth;
      const y2 = rectangle.y / imageHeight;
      const x3 = (rectangle.x + rectangle.width) / imageWidth;
      const y3 = (rectangle.y + rectangle.height) / imageHeight;
      const x4 = rectangle.x / imageWidth;
      const y4 = (rectangle.y + rectangle.height) / imageHeight;

      return [
        [x1, y1],
        [x2, y2],
        [x3, y3],
        [x4, y4],
      ];
    });

    // 将标注数据传递给主程序
    const annotatedData = {
      rectangles: rectanglesWithRelativeCoordinates.flat(), // 使用 flat() 来展开数组
      text,
    };
    onClose(annotatedData);
    setShowAnnotator(false); // 关闭标注窗口
  };

  // 当接收到新的图片时，重置标注数据和标注窗口显示状态
  useEffect(() => {
    setRectangles([]);
    setText('');
    setShowAnnotator(true);
  }, [image]);

  if (!showAnnotator) {
    return null; // 当 showAnnotator 为 false 时，不渲染标注窗口
  }

  return (
    <div className="image-annotator-popup">
      <p className='title'>图片标注:</p>
      {image && (
      <div
        className='image-place'
        style={{ position: 'relative' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
      <img
        src={image}
        alt="Selected"
        style={{ maxWidth: '100%', maxHeight: '350px' }}
      />
      {renderRectangles()}
      </div>
      )}
      <div className='ocr'>
        <p className='ocr-title'>文本信息：</p>
        <input type="text"  className="ocr-input" value={text} onChange={handleTextChange} />
        {/* <p>输入的文本：{text}</p> */}
      </div>
      <div className='button-div'>
        <Button type="primary" size='middle'  onClick={handleComplete}>完成</Button>
      </div>
    </div>
  );
}

export default ImageAnnotator;
