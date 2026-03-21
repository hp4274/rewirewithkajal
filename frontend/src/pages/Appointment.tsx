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
        <div className="abt2-wrapper">
            {/* HEADER SECTION */}
            <div style={{
                position: 'relative',
                zIndex: 8,
                paddingTop: '12px',
                paddingLeft: '18px',
                paddingRight: '18px',
                paddingBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    <Link to="/" className="abt2-home-link" aria-label="Back to home page" style={{ margin: 0 }}>
                        <span className="abt2-home-link-arrow" aria-hidden="true"><ChevronLeft size={16} strokeWidth={2.4} /></span>
                        <span>Back to Home</span>
                    </Link>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', maxWidth: '100%' }}></div>
                <div style={{ flex: 1 }}></div>
            </div>

            {/* PREMIUM HERO */}
            <section style={{ textAlign: 'center', padding: '20px 20px 60px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ background: '#FFF5EB', borderRadius: '40px', padding: '60px 20px', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
                    <div style={{ 
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '2px', 
                        color: '#C78152', 
                        border: '1px solid rgba(199, 129, 82, 0.3)', 
                        borderRadius: '100px', 
                        padding: '6px 16px', 
                        margin: '0 auto 24px', 
                        display: 'inline-block' 
                    }}>Begin Your Journey</div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem, 5vw, 4.5rem)', color: '#00373E', margin: '0 0 24px', lineHeight: '1.1' }}>
                        Book Your <em style={{ fontStyle: 'italic', fontWeight: '400', color: '#C78152' }}>Session</em>
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: '#00373E', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', opacity: 0.8 }}>
                        Begin your journey of emotional rewiring by sharing a little about yourself and what you're looking for. Kajal will be in touch within 24 hours.
                    </p>
                </div>
            </section>

            {/* PROCESS SECTION */}
            <section style={{ maxWidth: '1000px', margin: '0 auto 80px', padding: '0 20px' }}>
                <div className="ra-reveal" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ background: '#E8F0EC', borderRadius: '40px', padding: '40px 20px', boxShadow: '0 4px 30px rgba(0,0,0,0.03)', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ 
                            fontFamily: 'var(--font-heading)',
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            textTransform: 'uppercase', 
                            letterSpacing: '2px', 
                            color: '#C78152', 
                            border: '1px solid rgba(199, 129, 82, 0.3)', 
                            borderRadius: '100px', 
                            padding: '6px 16px', 
                            margin: '0 auto 16px', 
                            display: 'inline-block' 
                        }}>How It Works</div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: '#00373E', margin: 0 }}>Three simple <em style={{ fontStyle: 'italic', fontWeight: '400', color: '#C78152' }}>steps</em></h2>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                    {[
                        { step: '1', title: 'Fill the Form', desc: 'Share your details, concern, and preferred date.' },
                        { step: '2', title: 'Kajal Reviews', desc: 'Kajal personally reviews your request within 24 hours.' },
                        { step: '3', title: 'Confirmation', desc: 'Receive your confirmed session details by email.' }
                    ].map((s, i) => (
                        <div key={i} className={`ra-reveal ra-d${i + 1}`} style={{ background: '#FFFFFF', padding: '40px 30px', border: '1px solid rgba(0, 55, 62, 0.05)', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F2EBE3', color: '#00373E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 'bold' }}>{s.step}</div>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#00373E', marginBottom: '12px' }}>{s.title}</h3>
                            <p style={{ fontFamily: 'var(--font-body)', color: '#00373E', opacity: 0.7, lineHeight: '1.5' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FORM SECTION */}
            <section style={{ padding: '0 20px 80px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div className="ra-info-chips ra-reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 24px', borderRadius: '100px', border: '1px solid rgba(0, 55, 62, 0.05)' }}>
                            <span style={{ fontSize: '1.2rem' }}>🔒</span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#00373E', fontWeight: 500 }}>100% Private</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 24px', borderRadius: '100px', border: '1px solid rgba(0, 55, 62, 0.05)' }}>
                            <span style={{ fontSize: '1.2rem' }}>🌐</span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#00373E', fontWeight: 500 }}>Gujarati, English &amp; Hindi</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 24px', borderRadius: '100px', border: '1px solid rgba(0, 55, 62, 0.05)' }}>
                            <span style={{ fontSize: '1.2rem' }}>📋</span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#00373E', fontWeight: 500 }}>Free cancellation up to 24hrs</span>
                        </div>
                    </div>

                    <div className="ra-reveal ra-d1" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
                        <AppointmentForm isRefactoredDesign={true} />
                    </div>
                </div>
            </section>

            {/* INTAKE BANNER */}
            <section style={{ maxWidth: '1000px', margin: '0 auto 80px', padding: '0 20px' }}>
                <div className="ra-reveal" style={{ background: '#00373E', borderRadius: '32px', padding: '60px 40px', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 400px' }}>
                        <div className="abt2-kicker" style={{ color: '#F9E6D0', borderColor: 'rgba(249, 230, 208, 0.3)', marginBottom: '16px' }}>Existing Patients</div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: '#FFFFFF', marginBottom: '15px' }}>Ready to dive <em style={{ fontStyle: 'italic', fontWeight: '400', color: '#C78152' }}>deeper?</em></h3>
                        <p style={{ fontFamily: 'var(--font-body)', color: '#FFFFFF', opacity: 0.8, lineHeight: '1.6', maxWidth: '500px' }}>If you're ready to book an advanced consultation, please answer our highly detailed Intake Questionnaires to help us prepare.</p>
                    </div>
                    <div>
                        <button onClick={handleAccessForm} style={{ padding: '16px 36px', borderRadius: '100px', background: '#FFFFFF', color: '#00373E', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>
                            Access Intake Form
                        </button>
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE KAJAL */}
            <section style={{ padding: '0 20px 80px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="ra-reveal" style={{ textAlign: 'center', marginBottom: '50px' }}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', color: '#00373E' }}>Why choose <em style={{ fontStyle: 'italic', fontWeight: '400', color: '#C78152' }}>Kajal?</em></h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                        {[
                            { icon: '✨', title: 'Evidence-Based', desc: 'Techniques grounded in modern psychological research.' },
                            { icon: '🤝', title: 'Compassionate', desc: 'A safe, non-judgmental space to share your feelings.' },
                            { icon: '🎯', title: 'Goal-Oriented', desc: 'Focused on actionable steps and real-life outcomes.' },
                            { icon: '🌱', title: 'Holistic Healing', desc: 'Addressing mind and body for complete wellness.' }
                        ].map((w, i) => (
                            <div key={i} className={`ra-reveal ra-d${i + 1}`} style={{ background: '#FFFFFF', padding: '30px', borderRadius: '24px', border: '1px solid rgba(0, 55, 62, 0.05)', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '15px' }}>{w.icon}</div>
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#00373E', fontWeight: 600, marginBottom: '10px' }}>{w.title}</div>
                                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#00373E', opacity: 0.7, lineHeight: '1.5' }}>{w.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Appointment;
