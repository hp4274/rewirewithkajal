import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import AppointmentForm from '../components/AppointmentForm';

const Appointment: React.FC = () => {
    const navigate = useNavigate();

    const handleAccessForm = () => {
        navigate(`/intake-form`);
    };

    useEffect(() => {
        const handleScroll = () => {
            const reveals = document.querySelectorAll('.ra-reveal');
            reveals.forEach((reveal) => {
                const windowHeight = window.innerHeight;
                const elementTop = reveal.getBoundingClientRect().top;
                const elementVisible = 50;
                if (elementTop < windowHeight - elementVisible) {
                    reveal.classList.add('visible');
                }
            });
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Trigger once on mount
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="ra-page-wrapper">
                    {/* Hero Section */}
            <section className="ra-appt-hero">
                <div className="ra-hero-bg">
                    <div style={{ position: 'relative', zIndex: 8, paddingTop: '12px', paddingLeft: '18px' }}>
                        <Link to="/" className="ra-home-link" aria-label="Back to home page">
                            <span className="ra-home-link-arrow" aria-hidden="true"><ChevronLeft size={16} strokeWidth={2.4} /></span>
                            <span>Back to Home</span>
                        </Link>
                    </div>
                    <div className="ra-hero-blob"></div>
                    <div className="ra-hero-blob"></div>
                    <div className="ra-hero-blob"></div>
                </div>
                <div className="ra-hero-content">
                    <div className="ra-hero-eyebrow">
                        <span className="ra-eyebrow-line"></span> Begin Your Journey <span className="ra-eyebrow-line"></span>
                    </div>
                    <h1 className="ra-hero-title">Book Your <em>Session</em></h1>
                    <p className="ra-hero-sub">Begin your journey of emotional rewiring by sharing a little about yourself and what you're looking for. Kajal will be in touch within 24 hours.</p>
                </div>
                <div className="ra-hero-wave">
                    <svg viewBox="0 0 1440 110" fill="none" preserveAspectRatio="none">
                        <path d="M0,55 C400,110 1000,0 1440,55 L1440,110 L0,110 Z" />
                    </svg>
                </div>
            </section>

            {/* Process Section */}
            <section className="ra-process-section">
                <div className="ra-process-inner">
                    <div className="ra-reveal">
                        <div className="ra-process-eyebrow"><span></span>How It Works<span></span></div>
                        <h2 className="ra-process-title">Three simple <em>steps to your first session</em></h2>
                    </div>
                    <div className="ra-process-steps">
                        <div className="ra-step-item active ra-reveal ra-d1">
                            <div className="ra-step-dot">1</div>
                            <div className="ra-step-name">Fill the Form</div>
                            <div className="ra-step-desc">Share your details, concern, and preferred date</div>
                        </div>
                        <div className="ra-step-item ra-reveal ra-d2">
                            <div className="ra-step-dot">2</div>
                            <div className="ra-step-name">Kajal Reviews</div>
                            <div className="ra-step-desc">Kajal personally reviews your request within 24 hours</div>
                        </div>
                        <div className="ra-step-item ra-reveal ra-d3">
                            <div className="ra-step-dot">3</div>
                            <div className="ra-step-name">Confirmation</div>
                            <div className="ra-step-desc">Receive your confirmed session details by email</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Booking Form Section */}
            <section className="ra-booking-main">
                <div className="ra-booking-inner">
                    <div className="ra-info-chips ra-reveal">
                        <div className="ra-info-chip">
                            <div className="ra-chip-icon">🔒</div>
                            <div>
                                <div className="ra-chip-label">Confidentiality</div>
                                <div className="ra-chip-val">All sessions are 100% private</div>
                            </div>
                        </div>
                        <div className="ra-info-chip">
                            <div className="ra-chip-icon">🌐</div>
                            <div>
                                <div className="ra-chip-label">Languages</div>
                                <div className="ra-chip-val">Gujarati, English &amp; Hindi available</div>
                            </div>
                        </div>
                        <div className="ra-info-chip">
                            <div className="ra-chip-icon">📋</div>
                            <div>
                                <div className="ra-chip-label">Cancellation</div>
                                <div className="ra-chip-val">Free cancellation up to 24 hrs</div>
                            </div>
                        </div>
                    </div>

                    <div className="ra-reveal ra-d1" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
                        <AppointmentForm isRefactoredDesign={true} />
                    </div>
                </div>
            </section>

            {/* Intake Banner */}
            <section className="ra-intake-banner ra-reveal">
                <div className="ra-intake-banner-inner">
                    <div className="ra-intake-blob"></div>
                    <div className="ra-intake-blob"></div>
                    <div className="ra-intake-left">
                        <div className="ra-intake-tag">Existing Patients</div>
                        <h3>Ready to dive <em>deeper?</em></h3>
                        <p>If you're ready to book an advanced consultation, please answer our highly detailed Intake Questionnaires to help us prepare.</p>
                    </div>
                    <div className="ra-intake-right">
                        <button onClick={handleAccessForm} className="ra-btn-intake">
                            Access Intake Form
                        </button>
                    </div>
                </div>
            </section>

            {/* Why Choose Kajal */}
            <section className="ra-why-strip">
                <div className="ra-why-inner">
                    <div className="ra-why-header ra-reveal">
                        <h2>Why choose <em>Kajal?</em></h2>
                    </div>
                    <div className="ra-why-grid">
                        <div className="ra-why-card ra-reveal ra-d1">
                            <div className="ra-why-icon">✨</div>
                            <div className="ra-why-title">Evidence-Based</div>
                            <div className="ra-why-desc">Techniques grounded in modern psychological research.</div>
                        </div>
                        <div className="ra-why-card ra-reveal ra-d2">
                            <div className="ra-why-icon">🤝</div>
                            <div className="ra-why-title">Compassionate</div>
                            <div className="ra-why-desc">A safe, non-judgmental space to share your feelings.</div>
                        </div>
                        <div className="ra-why-card ra-reveal ra-d3">
                            <div className="ra-why-icon">🎯</div>
                            <div className="ra-why-title">Goal-Oriented</div>
                            <div className="ra-why-desc">Focused on actionable steps and real-life outcomes.</div>
                        </div>
                        <div className="ra-why-card ra-reveal ra-d4">
                            <div className="ra-why-icon">🌱</div>
                            <div className="ra-why-title">Holistic Healing</div>
                            <div className="ra-why-desc">Addressing mind and body for complete wellness.</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Appointment;
