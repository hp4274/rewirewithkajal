import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import './ScrollToTopButton.css';

const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <button
            className={`scroll-to-top-button ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Scroll to top"
        >
            <ChevronUp size={24} strokeWidth={2.5} />
        </button>
    );
};

export default ScrollToTopButton;
