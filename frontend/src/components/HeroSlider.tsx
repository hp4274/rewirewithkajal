import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const images = [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
];

const HeroSlider: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = images.length;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="hero-slider">
            <div className="slider-wrapper">
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={`slide ${
                            index === currentSlide
                                ? 'active'
                                : index === (currentSlide + 1) % totalSlides
                                  ? 'next'
                                  : index === (currentSlide - 1 + totalSlides) % totalSlides
                                    ? 'prev'
                                    : ''
                        }`}
                        style={{ backgroundImage: `url(${img})` }}
                    >
                        <div className="slide-overlay">
                            <div className="slide-content">
                                <h1>Find Your Peace. Rewire Your Mind.</h1>
                                <p>Dedicated mental health guidance tailored for you.</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="slider-dots">
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroSlider;
