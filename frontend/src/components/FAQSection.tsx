import React, { useState } from 'react';
import './FAQSection.css';

const faqs = [
    {
        id: 1,
        question: 'How do I know if I need counseling?',
        answer: 'If you are experiencing persistent feelings of sadness, overwhelming anxiety, difficulty functioning in your daily life, or finding that your usual coping mechanisms are no longer working, counseling can provide the necessary tools and support to regain balance.',
        image: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 2,
        question: 'What happens during a "Mind Rewiring" session?',
        answer: 'During a Mind Rewiring session, we work collaboratively to identify negative, recurring thought patterns. We then use cognitive behavioral techniques to challenge and replace these thoughts, essentially "rewiring" your brain\'s neural pathways toward more positive and constructive responses.',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 3,
        question: 'How long does the therapeutic process usually take?',
        answer: 'Healing is a highly individual journey. Some clients find clarity and improvement in a few short weeks, while others benefit from ongoing support over several months. We establish and adjust milestones together based exactly on what you need.',
        image: 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 4,
        question: 'Is my personal information kept completely confidential?',
        answer: 'Absolutely. We adhere to the strictest ethical boundaries and professional confidentiality standards. Your stories, struggles, and personal data are kept secure and completely private, providing you a safe space to be totally vulnerable.',
        image: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=800'
    }
];

const FAQSection: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);
    const [isMobileView, setIsMobileView] = useState(() => window.matchMedia('(max-width: 900px)').matches);

    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 900px)');

        const syncViewportMode = () => {
            const mobile = mediaQuery.matches;
            setIsMobileView(mobile);
            setActiveIndex((previous) => {
                if (mobile) return null;
                return previous ?? 0;
            });
        };

        syncViewportMode();

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncViewportMode);
        } else {
            mediaQuery.addListener(syncViewportMode);
        }

        return () => {
            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', syncViewportMode);
            } else {
                mediaQuery.removeListener(syncViewportMode);
            }
        };
    }, []);

    const handleFaqClick = (index: number) => {
        if (isMobileView) {
            setActiveIndex((previous) => previous === index ? null : index);
            return;
        }

        setActiveIndex(index);
    };

    return (
        <section className="faq-section container">
            <div className="faq-layout">
                {/* Left Side: Questions List */}
                <div className="faq-questions">
                    <h2 className="faq-title">Your Mental Health Journey</h2>
                    <p className="faq-subtitle">Common questions, answered compassionately.</p>

                    <div className="faq-list">
                        {faqs.map((faq, index) => (
                            <div
                                key={faq.id}
                                className={`faq-item stagger-item ${activeIndex === index ? 'active' : ''}`}
                                onClick={() => handleFaqClick(index)}
                            >
                                <div className="faq-item-header">
                                    <span className="faq-question-text">{faq.question}</span>
                                    <div className="faq-arrow">
                                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </div>
                                </div>

                                <div className={`faq-mobile-answer ${activeIndex === index ? 'active' : ''}`}>
                                    <div className="faq-mobile-image-wrap">
                                        <img src={faq.image} alt={faq.question} className="faq-mobile-image" loading="lazy" decoding="async" />
                                    </div>
                                    <p className="faq-mobile-answer-text">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Answer & Image */}
                {!isMobileView && (
                    <div className="faq-answer-container">
                        {faqs.map((faq, index) => (
                            <div
                                key={`answer-${faq.id}`}
                                className={`faq-answer-card ${activeIndex === index ? 'active' : ''}`}
                            >
                                <div className="faq-answer-image-wrap">
                                    <img src={faq.image} alt={faq.question} className="faq-answer-img" />
                                    <div className="faq-image-overlay"></div>
                                </div>
                                <div className="faq-answer-content">
                                    <p className="faq-answer-text">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FAQSection;
