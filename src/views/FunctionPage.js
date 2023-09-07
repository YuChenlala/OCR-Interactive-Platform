import React, { useRef, useState, useEffect } from 'react';
import "./FunctionPage.scss";
import DarkFooter from "components/DarkFooter.js";
import ImageAnnotator from 'components/ImageAnnotator';
import { SideSheet, Upload } from '@douyinfe/semi-ui';
import CustomScrollSelector from '../components/CustomScrollSelector';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { IconDownloadStroked, IconChevronLeft, IconArrowRight, 
  IconPlusStroked, IconEditStroked } from '@douyinfe/semi-icons';
import { IconBolt } from '@douyinfe/semi-icons'
import { saveAs } from 'file-saver';
import {
  NavItem,
  NavLink,
  Nav,
  Input,
  NavbarBrand,
  Collapse,
  FormGroup,
  Navbar,
  Container
} from "reactstrap";


function FunctionPage() {
  //---------------------------功能实现-------------------------
  const [file, setFile] = useState(null); // 图片列表
  const [currentIndex, setCurrentIndex] = useState(0) //当前下标
  const [currentTextList, setCurrentTextList] = useState([]) //当前图片的ocr文本信息列表
  const [dataList, setDataList] = useState([]) //返回数据列表
  const [textList, setTextList] = useState([]) //所有图片的ocr文本列表
  const [rectangleList, setRectangleList] = useState([]) //矩形信息
  const [confidenceThres, setconfidenceThres] = useState(1) //置信度阈值
  const [showImageAnnotator, setShowImageAnnotator] = useState(false); //图片标注界面
  const [annotatedData, setAnnotatedData] = useState(null); //标注数据
  // 为了显示截取图片
  const [partImageData, setPartImageData] = useState(null);
  const [partWidth, setPartWidth] = useState(null);
  const [partHeight, setPartHeight] = useState(null);
  // 高亮下标
  const [selectIndex, setSelectIndex] = useState(-1);
  //设置上传组件的可见性
  const [uploadVisible, setUploadVisible] = useState(true);
  const canvasRef = useRef(null);
  const isFirstShow = useRef(false);

  //----------------储存置信度阈值函数-------------------
  const saveInputValue = () => {
    let inputValue = document.getElementById("inputValue").value;
    setconfidenceThres(inputValue);
    console.log("显示设置的阈值：", inputValue);
  }

  
  //上传函数------------------2：前后端交互部分1----------
  // 回调函数
  const handleUploadChange = (file) => {
    // 处理文件变化
    setFile(file.fileList);
  };
  // 成功上传文件之后的回调
  const handleUpload = () => {
    const formData = new FormData();
    //图片文件----formData
    file.forEach((file) => {
      formData.append('images', file.fileInstance);
    });
    //发送fetch请求
    fetch('http://127.0.0.1:5000/upload', {
      method: 'POST',
      body: formData
    })
    //解析后端返回数据
    .then(response => response.json())
    .then(data => {
      console.log(data);
      // //处理后端返回的数据
      // console.log(data);
      //获取后端数据
      setDataList(data.OCR_data);
      //设置最初始的文本信息
      const textListTemp = [];
      data.OCR_data.forEach((data) => {
        const image_data = data.image_data;
        const textList0 = [];
        image_data.forEach((item) => {
          const text = item[1][0];
          const highlight = false;
          const textObj = {text, highlight};
          textList0.push(textObj);
        })
        textListTemp.push(textList0);
      })
      // 设置文本列表
      setTextList(textListTemp);
      // 设置当前图片对应的文本列表
      setCurrentTextList(textListTemp[0]);
      })
    .catch(error => {
      // 处理错误
      console.error(error);
    });
   
    // 进行图片的渲染（默认为第一张）
    drawImageAndRectangle(file[0], dataList , -1);
  } 

  //------识别触发渲染--------------
  const recognize = async (selectedIndex) => {
    console.log("识别");
    //提取当前文字信息
    console.log(selectIndex);
    getTextList(currentIndex, selectedIndex);
    isFirstShow.current = true;
  }

  // ----------------画矩形的函数--------------------
  const drawRectangle = (ctx, x, y, width, height, color, num) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 ;
    ctx.strokeRect(x, y, width, height);
    ctx.font = '14px Arial';  // 设置字体大小和字体样式
    ctx.fillStyle = color;
    ctx.fillText(`${num}`, x, y);  // 在位置(x,y)绘制文本数字1
    // // 判断该矩形框对应文本是否为高亮
    // if (currentTextList[num]?.highlight) {
    //   ctx.fillStyle = `rgba(114, 250, 147, 0.5)`; //设置填充颜色
    //   ctx.fillRect(x, y, width, height);
    // }
  }

  const drawImageAndRectangle = (file, data, selectedIndex) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const blobUrl = URL.createObjectURL(file.fileInstance)
    console.log("blob", blobUrl)
    const image = new Image()
    image.src = blobUrl

    image.onload = () => {
      //获取图片的实际宽度和高度
      const imageWidth = image.width;
      const imageHeight = image.height;
      //计算缩放比例，以确保图片按照固定比例进行显示
      //这里初始以容器的宽和高来设置
      const ratio = Math.min(700/ imageWidth, 450 / imageHeight);
      const displayWidth = imageWidth * ratio;
      const displayHeight = imageHeight * ratio;

      // 修改图片对象的宽度和高度属性
      image.width = displayWidth;
      image.height = displayHeight;

      // 设置 canvas 的宽度和高度与图片的显示宽度和高度一致
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      // 绘制图片到 canvas
      ctx.drawImage(image, 0, 0, displayWidth, displayHeight);
      if(selectedIndex!==-1) {
        //提取坐标和精确度渲染
        const image_data = data.image_data;
        let rectangles = [];
        image_data.forEach((item, index) => {
          //获取颜色---通过置信度阈值confidenceThres进行判断
          if (index == selectedIndex){
            //取消其他的高亮
            currentTextList.forEach((item) => {
              item.highlight = false;
            })
            // 设置为高亮
            currentTextList[index].highlight = true;
            let color;
            if (item[1][1] < confidenceThres) {
              color = 'rgb(255, 0, 0)';
            } else {
              color = 'rgb(246, 195, 69)';
            }
            const coordinateList = item[0];
            //左上x
            const x1 = coordinateList[0][0];
            //左上y
            const y1 = coordinateList[0][1];
            //右上x
            const x2 = coordinateList[1][0];
            //左下y
            const y4 = coordinateList[3][1];
            //长 = 右上x - 左上x
            const width = (x2 - x1) * image.width
            //高 = 左下y - 左上x
            const height = (y4 - y1) * image.height
            //x
            const x = x1 * image.width
            //y
            const y = y1 * image.height
            const rItem = { x, y, width, height, index }
            rectangles.push(rItem)
            // 画矩形
            drawRectangle(ctx, x, y, width, height, color, index)
            const tempPartImage = ctx.getImageData(x, y, width, height);
            setPartImageData(tempPartImage);
            setPartWidth(width);
            setPartHeight(height);
          }
          
        });
        setRectangleList([...rectangles])
      }
      URL.revokeObjectURL(blobUrl)
    }
  }


  //选择图片并渲染
  const initStart = (index, selectedIndex) => {
    //当前图片
    const currentImg = file[index];
    //当前数据
    const currentData = dataList[index];
    drawImageAndRectangle(currentImg, currentData, selectedIndex);

  }

  //提取当前文字信息函数---------------同时重新渲染页面
  const getTextList = (index, selectedIndex) => {
    const texts = textList[index];
    setCurrentTextList(texts);
    //传递参数给图片和文档组件------实现前端重新渲染两部分信息
    initStart(index, selectedIndex);
  }
  


  //-----------------上一张功能实现-------------------
  const previous = () => {
    if (file!=null) {
      const len = file.length;
      //把当前文本的高亮都取消
      currentTextList.forEach((item) => {
        item.highlight = false;
      })
      console.log("上一张");
      //传回textList
      textList[currentIndex] = currentTextList;
      //切换坐标
      let currentIndexTemp = currentIndex;
      if (currentIndex === 0){
        setCurrentIndex(len - 1 );
        currentIndexTemp = len-1;
      }else{
        setCurrentIndex((currentIndex - 1)%len);
        currentIndexTemp = (currentIndex - 1)%len;
      }
      // 获取并设置当前的文本信息
      getTextList(currentIndexTemp,-1);
      setconfidenceThres(1);
    }
      
  }

  //----------下一张功能实现-------------
  const next = () => {
    if (file!=null) {
      const len = file.length;
      //把当前文本的高亮取消
      currentTextList.forEach((item) => {
        item.highlight = false;
      })
      //传回textList
      console.log("下一张");
      textList[currentIndex] = currentTextList;
      //切换坐标
      setCurrentIndex((currentIndex + 1)%len);
      let currentIndexTemp = (currentIndex + 1)%len;
      //实现文本信息
      getTextList(currentIndexTemp,-1);
      // 将置信度设置为1
      setconfidenceThres(1);
    }
  }

  //-----------------添加功能实现-------------------
  //处理添加按钮点击事件
  const handleAdd = () => {
    console.log("添加");
    if(file!=null) {
      setShowImageAnnotator(true);
    } else {
      console.log("此时未上传图片！")
    }
    
  }
  //处理添加标注回调函数
  const handleImageAnnotatorClose = (annotatedData) => {
    console.log("添加回调");
    console.log(annotatedData);
    setAnnotatedData(annotatedData);
    if (annotatedData.text!=[] && annotatedData.rectangles!=[]) {
      //添加具体处理标注数据操作
      //将新增的矩形坐标和文本数据加入
      let listTextA = [];
      listTextA.push(annotatedData.text);
      //设置置信度为1
      listTextA.push(1);
      //矩形相对坐标＋文本＋置信度
      let list = [];
      list.push(annotatedData.rectangles);
      list.push(listTextA);
      //将数组同步更新到当前数据中
      //更新dataList
      dataList[currentIndex].image_data.push(list);
      //更新currentTextList
      const text = annotatedData.text;
      const highlight = false;
      const textObj = {text, highlight};
      currentTextList.push(textObj);
      //更新textList
      textList[currentIndex] = currentTextList;
      // console.log(currentTextList);

    }
    //关闭界面
    setShowImageAnnotator(false);
    // 提取当前文本信息
    getTextList(currentIndex,selectIndex);
  }


  //-------------实现删除功能----------
  const handleDec = () => {
    console.log("删除");
    //找出当前高亮的文本index
    const textRec = currentTextList.find(item => (
      item.highlight == true
    ));
    const index = currentTextList.indexOf(textRec);
    console.log("待删除的下标：", index);
    // 若没有高亮，则index此时为-1
    if (index != -1) {
      //更新currentTextList
      currentTextList.splice(index, 1);
      //更新textList
      textList[currentIndex] = currentTextList;
      //更新dataList
      dataList[currentIndex].image_data.splice(index, 1);

      getTextList(currentIndex,selectIndex);
    }
    // 关闭弹窗
    handleCancel();
  }

  //提交按钮方法-------------------------前后端交互2-------
  const handleEditText = async () => {
    const userChoice = window.confirm("确定所有图片是否修改完成？");

    if (userChoice && file!=null) {
      //循环多次请求
    //   for (let i=0; i<file.length; i++) {
    //     const text = textList[i];
    //     const newText = [];
    //     // const newText = text.map((item) => item.text);
    //     for( let j=0; j<text.length; j++) {
    //       let list = [];
    //       //先存放矩形位置信息
    //       list.push(dataList[i].image_data[j][0]);
    //       //创建文本＋精确度信息
    //       let list0 = [];
    //       list0.push(text[j].text);
    //       list0.push(dataList[i].image_data[j][1][1]);
    //       //将文本＋精确度数组加入list
    //       list.push(list0);

    //       newText.push(list);
    //     }
    //     const image = file[i];
    //     //创建一个FormData对象
    //     const formData = new FormData();
    //     formData.append('image', image);
    //     const jsonText = JSON.stringify(newText);
    //     formData.append('text', jsonText);

    //     //发送请求
    //     const res = await fetch('http://127.0.0.1:5000/submit', {
    //       method: 'POST',
    //       body: formData
    //     })
    //     console.log(res);
    //  }
    } 
    else {
      //用户点击取消，不执行修改操作
    }
  }

  
  //高亮点击事件
  const highLight = (event) => {
    let rect = canvasRef.current.getBoundingClientRect();
    // 获取鼠标点击的位置信息
    let x0 = event.clientX - rect.left;
    let y0 = event.clientY - rect.top;
    console.log(x0, y0);
    console.log(rectangleList);
    const rectangle = rectangleList.find(item => (
      item.x < x0 && x0 < item.x + item.width && item.y < y0 && y0 < item.y + item.height
      ));
    if (rectangle !== undefined){
       //创建一个新的canvas元素
       const newCanvas = document.createElement('canvas');
       const newCtx = newCanvas.getContext('2d');
       newCanvas.width = partWidth;
       newCanvas.height = partHeight;
       // 将矩形位置的像素数据绘制
       newCtx.putImageData(partImageData, 0, 0);
       
      // 出现弹窗
      console.log(rectangle);
      showDialog(function() {
        // 延迟执行回调函数
        setTimeout(function() {
        // 获取弹窗容器元素
        const dialogElement = document.getElementById('show-part-picture');
        // 将新的Canvas元素添加为弹窗容器元素的子节点
        dialogElement.appendChild(newCanvas);
        }, 0);
      });
      let newTextList = currentTextList;
      console.log(currentTextList.length);
      // 清楚其他的高亮属性
      newTextList.forEach(item => item.highlight = false);
      newTextList[rectangle.index].highlight = true;
      setCurrentTextList([...newTextList]);
      recognize(rectangle.index)
      console.log(currentTextList);
      // 重新渲染
      getTextList(currentIndex,selectIndex);

     

    }
    
  }

  const handleSelection = (selectedValue) => {
    console.log('当前选择的选项: ', selectedValue);
    var temp = 0, cnt = 0;
    dataList[currentIndex].image_data.map((item, index) => {
      if (item[1][1] <= confidenceThres){
        temp++;
        console.log(temp);
        if (temp == selectedValue+1){
          cnt = index;
        }
      }
    })
    setSelectIndex(cnt)
    recognize(cnt)
    
  };
  //修改按键添加
  function onClick(){
    if (file!=null) {
      const newCanvas = document.createElement('canvas');
      const newCtx = newCanvas.getContext('2d');
      newCanvas.width = partWidth;
      newCanvas.height = partHeight;
      // 将矩形位置的像素数据绘制
      newCtx.putImageData(partImageData, 0, 0);
      showDialog(function() {
        // 延迟执行回调函数
        setTimeout(function() {
        // 获取弹窗容器元素
        const dialogElement = document.getElementById('show-part-picture');
        // 将新的Canvas元素添加为弹窗容器元素的子节点
        dialogElement.appendChild(newCanvas);
        }, 0);
      });
    }
  }

  function renderFooter(){
    return (
      <div id="modify-div">
        <Button size="middle" type="primary" onClick={onClick}>
          修改
        </Button>
      </div>
    );
  }

  function renderHeader(){
    return (
      <h6>OCR识别文本：</h6>
    )
  }

  //功能实现————弹窗实现
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  function showDialog(callback) {
    setVisible(true);
    setText(textList[currentIndex][selectIndex].text);
    if(typeof callback === 'function'){
      callback();
    }
  }
  
  const handleOk = () => {
    setVisible(false);
    let text0 = currentTextList;
    text0[selectIndex].text = text;
    setCurrentTextList(text0);
    textList[currentIndex] = currentTextList
    console.log('Ok button clicked');
  };
  const handleCancel = () => {
    setVisible(false);
    console.log('Cancel button clicked');
  };

  const handleSelectionChange = (event) =>{
    setText(event.target.value);
  }


  //下载文本功能实现
  const download = () => {
    console.log(textList);
    if (textList && Array.isArray(textList)) {
      const text = textList[currentIndex].map((item, index) => `${index + 1}. ${item.text}`).join('\n');
      console.log(text)
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, 'text.txt');
      }
  }


  return (
  <>
    {/* 导航功能栏 */}
    <Navbar  expand="lg" color="info">
      <Container>
          <img
              alt="..."
              width="30" height="30" 
              src={require("assets/img/now-logo.png")}
            ></img>
          <NavbarBrand>  </NavbarBrand>
          <Link to="/index">
            <NavbarBrand id="nav-title">
              OCR交互平台
            </NavbarBrand>
          </Link>
        
        <Collapse
          className="justify-content-end"
          navbar
          isOpen={true}
        >
          <Nav navbar>
            <NavItem style={{ display: "flex", alignItems: "center" }}>
              <NavbarBrand>
                置信度阈值：
              </NavbarBrand>
              <FormGroup>
                <Input
                  id="inputValue"
                  defaultValue=""
                  placeholder="0-1之间,默认为1"
                  title='0-1之间,默认为1'
                  type="text"
                  className="placeholder-style"
                  onChange={saveInputValue}
                  value={confidenceThres}
                ></Input>
              </FormGroup>
            </NavItem>
            {/* 上一张功能 */}
            <NavItem>
              <NavLink onClick={() => previous()}>
                <IconChevronLeft />
                <p>上一张</p>
              </NavLink>
            </NavItem>
            {/* 下一张功能 */}
            <NavItem>
              <NavLink onClick={() => next()}>
                <IconArrowRight />
                <p>下一张</p>
              </NavLink>
            </NavItem>
            {/* 增加功能 */}
            <NavItem>
              <NavLink onClick={() => handleAdd()}>
                <IconPlusStroked />
                <p>增加</p>
              </NavLink>
            </NavItem>
            <div style={{position: 'absolute'}}>
              {showImageAnnotator && (
                  <ImageAnnotator image={URL.createObjectURL(file[currentIndex].fileInstance)} onClose={handleImageAnnotatorClose} />
                )}
            </div>
            {/* 提交功能 */}
            <NavItem>
              <NavLink onClick={() => handleEditText()}>
                <IconEditStroked />
                <p>提交</p>
              </NavLink>
            </NavItem>
            {/* 下载功能 */}
            <NavItem>
              <NavLink onClick={()=>download()}>
                <IconDownloadStroked />
                <p>下载</p>
              </NavLink>
            </NavItem>
          </Nav>
          </Collapse>
      </Container>
    </Navbar>

    {/* 功能区实现 */}
    <div className='main-container'>
      {/* 左边图片 */}
      <div className='image-place'>
        {uploadVisible && (
           <Upload
            className='upload-component'
            action='https://api.semi.design/upload'
            dragIcon={<IconBolt />}
            file={file}
            draggable={true}
            accept='image/png,image/jpeg,image/jpg'
            dragMainText='点击上传文件或拖拽文件到这里'
            dragSubText='仅支持png、jpeg、jpg格式图片'
            style={{ marginTop: 10 }}
            onSuccess={handleUpload}
            onChange={handleUploadChange}
            onProgress={() => setUploadVisible(false)}
            showUploadList={false}
            multiple
           />
        )}
        <canvas ref={canvasRef} className='image' onClick={(e) => highLight(e)} />
      </div>
      {/* 右边ocr文本 */}
      <div className='ocr-place'>
        {/* 滑动选择器 */}
        <CustomScrollSelector 
          options={textList[currentIndex]} 
          data = {dataList[currentIndex]} 
          className='scroll-list' 
          confidence = {confidenceThres} 
          onChange={handleSelection}  
          header={renderHeader()} 
          footer={renderFooter()} />
      </div>
      {/* 侧边滑动栏 */}
      <SideSheet title="修改" visible={visible} onCancel={handleCancel} placement='bottom' height={150}>
          <div className='modify-place' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} >
            {/* 修改弹窗内容部分 */}
            <p style={{ marginLeft: '200px', color: 'black', fontSize: '16px' }}>图片内容：</p>
            <div id="show-part-picture" style={{ marginLeft: '20px' }}>
            </div>
            <p style={{ marginLeft: '100px', color: 'black', fontSize: '16px' }}>识别文本：</p>
            <input type="text" className="ocr-input" value={text} onChange={handleSelectionChange} style={{ marginLeft: '20px', width: '200px' }}/>
            <Button type="primary" size='middle' className="custom-button" onClick={() => handleOk()} style={{ marginLeft: '20px' }}>确定</Button>
            <Button type="primary" size='middle' className="custom-button" onClick={() => handleDec()} style={{ marginLeft: '20px' }}>删除</Button>
          </div>
      </SideSheet>
    </div> 
    <div className="footer">
        <DarkFooter></DarkFooter>
      </div>
  </>
  );
}
export default FunctionPage;