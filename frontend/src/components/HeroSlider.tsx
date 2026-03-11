import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

import image1 from '../assets/image1.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';

const images = [image1, image2, image3, image4];

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
