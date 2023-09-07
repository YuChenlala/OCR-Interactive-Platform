import React, { useState } from 'react';
import { ScrollList, ScrollItem } from '@douyinfe/semi-ui';

const CustomScrollSelector = ({ options, data,className, confidence, onChange, header, footer }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  // console.log(confidence);
  // console.log(options);
  const handleSelect = (data) => {
    setSelectedIndex(data.index);
    onChange(data.index);
    console.log("����ѡ������ǣ�", data.index);
  };

  let selection = [];
  if (Array.isArray(options)) {
    options.map((item, index) => {
      if (data.image_data[index][1][1] <= confidence){
        selection.push(item);
      }
    });
  } else {
    console.error('options ����һ����Ч������');
  }

  return (
    <ScrollList className ={className} footer={footer} header={header}>
      <ScrollItem
        mode="wheel"
        cycled={false}
        list={selection}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
      />
    </ScrollList>
  );
};

export default CustomScrollSelector;
