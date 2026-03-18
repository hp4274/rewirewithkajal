const fs = require('fs');
let html = fs.readFileSync('Refrence Design/index.html', 'utf8');

let start = html.indexOf('<div class="home">');
let end = html.lastIndexOf('</div>');
if (start === -1) {
    console.log('div class=home not found');
    process.exit(1);
}
let inner = html.substring(start, end);

// Need to find the exact closing tag for <div class="home">
// Let's just Regex out the body content
let bodyStart = html.indexOf('<body>') + 6;
let bodyEnd = html.indexOf('</body>');
let bodyContent = html.substring(bodyStart, bodyEnd);

bodyContent = bodyContent.replace(/class=/g, 'className=');
bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');
bodyContent = bodyContent.replace(/<!--(.*?)-->/g, '{/* $1 */}');
bodyContent = bodyContent.replace(/tabindex=/gi, 'tabIndex=');

let jsx = import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const Home: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);

    return (
        <div style={{ backgroundColor: '#f7f6f4', width: '100%', overflowX: 'hidden' }}>
            
        </div>
    );
};

export default Home;;

fs.writeFileSync('frontend/src/pages/Home.tsx', jsx);
console.log('done');
