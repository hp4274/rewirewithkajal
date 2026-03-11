import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const images = [
    'radial-gradient(circle at 20% 20%, #ffd7c1 0%, #f59e66 36%, #b5512f 100%)',
    'radial-gradient(circle at 80% 10%, #ffe5d2 0%, #f7b57f 34%, #c96439 100%)',
    'radial-gradient(circle at 50% 15%, #ffe8da 0%, #f3a56d 38%, #9f4628 100%)',
    'radial-gradient(circle at 30% 80%, #ffdbc7 0%, #ed9460 40%, #8c3c22 100%)'
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
                        style={{ backgroundImage: img }}
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
