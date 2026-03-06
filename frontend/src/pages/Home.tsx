import React, { useEffect } from 'react';
import HeroSlider from '../components/HeroSlider';
import ProblemSlider from '../components/CombinedSlider';
import OffersSection from '../components/OffersSection';
import FAQSection from '../components/FAQSection';
import HomeBlogs from '../components/HomeBlogs';
import AppointmentForm from '../components/AppointmentForm';

const Home: React.FC = () => {
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach((el) => observer.observe(el));

        return () => {
            revealElements.forEach((el) => observer.unobserve(el));
        };
    }, []);

    return (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '120px', paddingBottom: '120px' }}>
            <div className="reveal"><HeroSlider /></div>
            <div className="reveal"><ProblemSlider /></div>
            <div className="reveal"><OffersSection /></div>
            <div className="reveal"><FAQSection /></div>
            <div className="reveal"><HomeBlogs /></div>
            <div className="reveal"><AppointmentForm /></div>
        </main>
    );
};

export default Home;
