import React, { useEffect } from 'react';
import '../components/AboutSection.css'; // Reusing the same CSS to maintain the design
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);

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
        <main className="about-page container fade-in" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <div className="reveal active">
                {/* Main Hero About Block mirroring the original component */}
                <section className="about-section" style={{ padding: 0 }}>
                    <div className="about-content">
                        <h2>About Rewire With Kajal</h2>
                        <h3 className="subtitle">Therapeutic guidance tailored to your mind.</h3>

                        <p>
                            At Rewire With Kajal, we believe that the mind is highly malleable.
                            Through dedicated and scientific approaches involving compassion and understanding,
                            we aim to rewire negative thought patterns into positive, fulfilling life choices.
                        </p>
                        <p>
                            Our platform offers 1:1 sessions, comprehensive emotional guidance,
                            and actionable steps toward mental well-being, unburdening yourself from emotional trauma.
                            We emphasize the deep, interconnected relationship between physical habits and mental health.
                        </p>
                        <p>
                            Whether you are facing burnout, dealing with relationship strains, or struggling to maintain
                            personal boundaries, our tailored modules serve as a blueprint to reclaim your mental autonomy.
                        </p>

                        <Link to="/appointment" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>Book Appointment</Link>
                    </div>

                    <div className="about-image-wrapper">
                        <img
                            src="https://img.freepik.com/free-photo/young-beautiful-woman-pink-warm-sweater-natural-look-smiling-portrait-isolated-long-hair_285396-896.jpg?w=740"
                            alt="Kajal Profile"
                            className="about-image"
                        />
                        <div className="about-shape-decoration"></div>
                    </div>
                </section>
            </div>

            {/* Extended Details Section */}
            <div className="reveal" style={{ marginTop: '80px' }}>
                <section className="about-details" style={{ backgroundColor: 'var(--color-white)', padding: '60px 40px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-soft)' }}>
                    <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '30px', fontSize: '2rem' }}>Our Philosophy and Methodology</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                        <div>
                            <h3 style={{ color: 'var(--color-text-main)', marginBottom: '16px', fontSize: '1.4rem' }}>Cognitive Restructuring</h3>
                            <p style={{ color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                We begin by identifying the root causes of spontaneous negative thoughts. By acknowledging and
                                isolating these triggers, we help clients build custom cognitive barriers that prevent emotional
                                spirals before they manifest physically.
                            </p>
                        </div>

                        <div>
                            <h3 style={{ color: 'var(--color-text-main)', marginBottom: '16px', fontSize: '1.4rem' }}>Holistic Integration</h3>
                            <p style={{ color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                Emotional well-being doesn't exist in a vacuum. We explore sleep quality, daily stressors,
                                and relational dynamics to ensure that progress made in our sessions translates directly into
                                everyday peace of mind and bodily relaxation.
                            </p>
                        </div>

                        <div>
                            <h3 style={{ color: 'var(--color-text-main)', marginBottom: '16px', fontSize: '1.4rem' }}>Progressive Milestones</h3>
                            <p style={{ color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                Healing is an active process that requires measurable steps. We work together to establish
                                realistic, weekly progressive milestones, celebrating small victories while equipping you with
                                the lifelong tools required for continued mental maintenance.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default AboutPage;
