import React, { useEffect, useState } from 'react';

const AnimatedBackground: React.FC = () => {
    const [stars, setStars] = useState<number[]>([]);

    useEffect(() => {
        // Generate a random number of stars depending on screen, mapping about 30 stars
        const numStars = Math.floor(Math.random() * 20) + 20;
        const tempStars = [];
        for (let i = 0; i < numStars; i++) {
            tempStars.push(i);
        }
        setStars(tempStars);
    }, []);

    return (
        <div className="animated-background">
            {stars.map((i) => {
                const size = Math.random() * 4 + 2; // 2px to 6px diameter
                const left = Math.random() * 100; // random place horizontal start
                const duration = Math.random() * 10 + 10; // 10s to 20s fall speed
                const delay = Math.random() * 10; // offset animation start
                const opacity = Math.random() * 0.4 + 0.2; // 0.2 to 0.6 opacity (stars are a bit brighter)

                const style = {
                    left: `${left}vw`,
                    width: `${size}px`,
                    height: `${size}px`,
                    opacity: opacity,
                    animationDuration: `${duration}s`,
                    animationDelay: `-${delay}s`,
                };

                return <div key={i} className="falling-star" style={style}></div>;
            })}
        </div>
    );
};

export default AnimatedBackground;
