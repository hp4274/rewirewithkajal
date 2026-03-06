import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const images = [
    "https://media.istockphoto.com/id/583809524/photo/alberta-wilderness-near-banff.jpg?s=612x612&w=0&k=20&c=hiI3ib9ibDxAgqEZEH09EO3JOw94v5xh6hzcuXGhO-M=",
    "https://media.istockphoto.com/id/1381637603/photo/mountain-landscape.jpg?s=612x612&w=0&k=20&c=w64j3fW8C96CfYo3kbi386rs_sHH_6BGe8lAAAFS-y4=",
    "https://media.istockphoto.com/id/517188688/photo/mountain-landscape.jpg?s=612x612&w=0&k=20&c=A63koPKaCyIwQWOTFBRWXj_PwCrR4cEoOw2S9Q7yVl8=",
    "https://thumbs.dreamstime.com/b/copy-space-stock-photo-view-wild-crocus-flowers-alps-sunrise-early-morning-light-beautiful-alpine-landscape-419530088.jpg"
];

const HeroSlider: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

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
                        className={`slide ${index === currentSlide ? 'active' : ''}`}
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
