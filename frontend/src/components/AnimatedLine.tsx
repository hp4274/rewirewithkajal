import React from 'react';

const AnimatedLine: React.FC = () => {
    return (
        <div className="animated-line-container">
            <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="animated-line-svg">
                <path
                    d="M 0 200
                       C 80 200, 120 230, 200 350
                       C 280 470, 380 400, 480 250
                       C 550 130, 600 80, 660 100
                       C 700 120, 710 180, 710 300
                       C 710 380, 760 380, 760 330
                       C 760 270, 720 270, 740 370
                       C 760 450, 830 330, 920 250
                       C 980 200, 1050 210, 1200 200"
                    fill="none"
                    stroke="var(--color-primary-light)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="drawing-path"
                />
            </svg>
        </div>
    );
};

export default AnimatedLine;
