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
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="serene-appointment-page">
            {/* Top Navigation / Header */}
            <div style={{ position: 'relative', zIndex: 8, paddingBottom: '10px', paddingTop: '18px', paddingLeft: '18px' }}>
                <Link to="/" className="abt2-home-link" aria-label="Back to home page">
                    <span className="abt2-home-link-arrow" aria-hidden="true"><ChevronLeft size={16} strokeWidth={2.4} /></span>
                    <span>Back to Home</span>
                </Link>
            </div>

            {/* Hero Section */}
            <section className="serene-hero">
                <div>
                    <span className="serene-hero-badge">Begin Your Journey</span>
                    <h1 className="serene-font-headline">
                        Book Your <br /><i className="serene-font-headline">Session.</i>
                    </h1>
                    <p>
                        Step into a space designed for clarity and healing. Our curated approach ensures your wellness journey is as unique as your story.
                    </p>
                    <a href="#intake" className="serene-btn">Start Intake</a>
                </div>
                <div className="serene-hero-image-wrapper">
                    <div className="serene-hero-img-main">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAW6Ze4Ziu8H2MeiFDxqXzUFhCF6yLmf9vb7b09Fs3bvnA82OVTzROJn_2Prgnnix0cja0nDvELK8lqUjGh-4m1eNLkh_tryA4RwnRX9U0DqylkPBxXmKIW73Zh_DQ93EHtAFxz5gLyDbOxcrtzEiuqVKZv4h1htaNf1_srk_1JpnhlyC8Tdzwd7XI1HRKH3GUN6YaIXzn9smqgbc_Q8LbcMnIPj7p2e3w69nfhddoQuoqUcPctnSSnyX77GXQewMi94K28BrSe-15" alt="Calm spa environment" />
                    </div>
                    <div className="serene-hero-img-sub hidden md:block">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEkWPZenPJ6-5BLcNTV-PY0Py4avSWk0SS08kRcX4fOc_LWdW-i-FmLm6zx8_ld-G4GvW_iO8y4I3aaeCJnanh-GQjv8Qs_x9J2l_KrX-GFXBriU1Vk1stA8_TNP_tUhesJk1bww8XxgdijRR_Ak-1r1wCPqM_Aetf7O1tox7CZxwSq_NmXpfwGXmvhOmjTsSwxdDbNrR7M8qLsqN5lBP4nALcUfNenpEYGVdbcGaexmXfoiD2h45lg7jU7O5LYBddd0vpaVgF-S12" alt="Hands resting peacefully" />
                    </div>
                </div>
            </section>

            {/* Existing Patient Banner */}
            <section className="serene-existing-banner">
                <div>
                    <h3 className="serene-font-headline">Returning to Serene?</h3>
                    <p>Access your existing profile to book follow-up appointments instantly.</p>
                </div>
                <button onClick={handleAccessForm} className="serene-btn serene-banner-btn">
                    Existing Patients Login
                </button>
            </section>

            {/* Three Steps Section */}
            <section className="serene-steps-section">
                <div className="serene-steps-header">
                    <h2 className="serene-font-headline">A Simple Path to Peace</h2>
                    <div className="serene-steps-line"></div>
                </div>
                <div className="serene-steps-grid">
                    <div className="serene-step-card">
                        <div className="serene-step-icon c1">
                            <span className="serene-material-symbols">edit_note</span>
                        </div>
                        <h4 className="serene-font-headline">01. Fill the Form</h4>
                        <p>Share your needs and preferences through our thoughtful intake form to help us understand your journey.</p>
                    </div>
                    <div className="serene-step-card">
                        <div className="serene-step-icon c2">
                            <span className="serene-material-symbols">psychology</span>
                        </div>
                        <h4 className="serene-font-headline">02. Expert Review</h4>
                        <p>Kajal personally reviews every intake to ensure a perfect match with our evidence-based practices.</p>
                    </div>
                    <div className="serene-step-card">
                        <div className="serene-step-icon c3">
                            <span className="serene-material-symbols">verified</span>
                        </div>
                        <h4 className="serene-font-headline">03. Confirmation</h4>
                        <p>Receive a curated appointment schedule and preparatory materials for your first session within 24 hours.</p>
                    </div>
                </div>
            </section>

            {/* The Intake Form Section */}
            <section className="serene-intake-section" id="intake">
                <div className="serene-intake-container">
                    <div className="serene-intake-heading">
                        <h2 className="serene-font-headline">Intake Assessment</h2>
                        <p style={{ color: '#5e6059', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure &amp; Private</p>
                    </div>
                    
                    {/* Preserve existing form element and function */}
                    <div style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
                        <AppointmentForm isRefactoredDesign={true} />
                    </div>
                </div>
            </section>

            {/* Mission Statement Pull Quote */}
            <section className="serene-quote-section">
                <div className="serene-material-symbols serene-quote-icon">format_quote</div>
                <blockquote className="serene-font-headline">
                    "Dedicated to helping you navigate <i>life's complexities</i> with curated grace and evidence-based precision."
                </blockquote>
                <p className="serene-quote-label">— Our Commitment to You</p>
            </section>

            {/* Service Benefits / Editorial Layout */}
            <section className="serene-benefits-section" style={{ paddingBottom: 0 }}>
                <div className="serene-benefits-grid">
                    <div className="serene-benefit-card">
                        <span className="serene-material-symbols">science</span>
                        <h5 className="serene-font-headline">Evidence-Based</h5>
                        <p>Methods rooted in peer-reviewed science and proven clinical frameworks for lasting results.</p>
                    </div>
                    <div className="serene-benefit-card">
                        <span className="serene-material-symbols">favorite</span>
                        <h5 className="serene-font-headline">Compassionate</h5>
                        <p>A sanctuary of judgment-free care where every emotion is met with gentle professional guidance.</p>
                    </div>
                    <div className="serene-benefit-card">
                        <span className="serene-material-symbols">ads_click</span>
                        <h5 className="serene-font-headline">Goal-Oriented</h5>
                        <p>Strategic sessions focused on measurable growth and practical tools for your daily life.</p>
                    </div>
                    <div className="serene-benefit-card">
                        <span className="serene-material-symbols">self_improvement</span>
                        <h5 className="serene-font-headline">Holistic Healing</h5>
                        <p>Addressing the interconnected nature of mind, body, and spirit within your personal ecosystem.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Appointment;
