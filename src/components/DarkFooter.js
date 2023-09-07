/*eslint-disable*/
import React from "react";

// reactstrap components
import { Container } from "reactstrap";

function DarkFooter() {
  return (
    <footer className="footer" data-background-color="black">
      <Container>
        <nav>
          <ul>
            <li>
              Creative Tim
            </li>
            <li>
              About Us
            </li>
            <li>
              Blog
            </li>
          </ul>
        </nav>
        <div className="copyright" id="copyright">
          © {new Date().getFullYear()}, 
          . Coded by yuchen & shushu
            Creative Tim
          .
        </div>
      </Container>
    </footer>
  );
}

export default DarkFooter;
