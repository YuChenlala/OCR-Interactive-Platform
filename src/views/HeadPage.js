import React from "react";

// reactstrap components
// import {
// } from "reactstrap";

// core components
import IndexNavbar from "components/IndexNavbar.js";
import IndexHeader from "components/IndexHeader.js";
// import DarkFooter from "components/DarkFooter.js";

// // sections for this page
// import MainFunction from "components/MainFunction.js";

function HeadPage() {
  React.useEffect(() => {
    document.body.classList.add("index-page");
    document.body.classList.add("sidebar-collapse");
    document.documentElement.classList.remove("nav-open");
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    return function cleanup() {
      document.body.classList.remove("index-page");
      document.body.classList.remove("sidebar-collapse");
    };
  });
  return (
    <>
      {/* 导航栏----后期还可以美化！！！！ */}
      {/* <IndexNavbar /> */}
      <div className="wrapper">
        {/* 首页---标题页 */}
        <IndexHeader />
      </div>
    </>
  );
}

export default HeadPage;
