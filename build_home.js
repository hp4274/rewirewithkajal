const fs = require('fs');
let html = fs.readFileSync('Refrence Design/index.html', 'utf8');

// remove navbar
let navStart = html.indexOf('<nav class="navbar"');
let navEnd = html.indexOf('</nav>') + 6;
html = html.substring(0, navStart) + html.substring(navEnd);

// remove footer
let footerStart = html.indexOf('<footer class="footer"');
let footerEnd = html.indexOf('</footer>') + 9;
html = html.substring(0, footerStart) + html.substring(footerEnd);

let bodyStart = html.indexOf('<div class="home">');
let bodyEnd = html.lastIndexOf('</body>');
let bodyContent = html.substring(bodyStart, bodyEnd);

bodyContent = bodyContent.replace(/class=/g, 'className=');
bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');
bodyContent = bodyContent.replace(/<!--([\s\S]*?)-->/g, '{/**/}');
bodyContent = bodyContent.replace(/tabindex=/gi, 'tabIndex=');
bodyContent = bodyContent.replace(/novalidate/gi, 'noValidate');

let jsx = 'import React, { useEffect } from "react";\n' +
'import { useNavigate } from "react-router-dom";\n' +
'import "../styles/global.css";\n\n' +
'const Home: React.FC = () => {\n' +
'    const navigate = useNavigate();\n' +
'    useEffect(() => {\n' +
'        window.scrollTo({ top: 0, behavior: "auto" });\n' +
'    }, []);\n' +
'    return (\n' +
'        <div style={{ width: "100%", overflowX: "hidden" }}>\n' +
'            ' + bodyContent + '\n' +
'        </div>\n' +
'    );\n' +
'};\n\n' +
'export default Home;\n';
fs.writeFileSync('frontend/src/pages/Home.tsx', jsx, 'utf8');
console.log('done writing jsx');
