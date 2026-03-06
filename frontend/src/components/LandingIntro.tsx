import React from 'react';
import './LandingIntro.css';
import ladyImg from '../assets/lady.png';

const LandingIntro: React.FC = () => {
    return (
        <section className="landing-intro">
            <div className="container intro-container">
                {/* Left Side: Firm Motto */}
                <div className="intro-left slide-in-left">
                    <h1 className="intro-motto">
                        Rewiring Minds,<br />
                        <span className="motto-highlight">Restoring Lives.</span>
                    </h1>
                    <p className="intro-subtext">
                        Your journey to inner peace starts with a single step.
                        We provide compassionate, evidence-based guidance to help you navigate
                        life's complexities.
                    </p>
                </div>

                {/* Center: Image */}
                <div className="intro-center slide-up">
                    <img src={ladyImg} alt="Kajal Portrait" className="intro-portrait" />
                    {/* Optional glow effect behind the portrait */}
                    <div className="portrait-glow"></div>
                </div>

                {/* Right Side: Quotes */}
                <div className="intro-right slide-in-right">
                    <div className="quote-card">
                        <p className="quote-text">
                            "The good life is a process, not a state of being. It is a direction not a destination."
                        </p>
                        <p className="quote-author">— Carl Rogers</p>
                    </div>

                    <div className="quote-card" style={{ animationDelay: '0.4s' }}>
                        <p className="quote-text">
                            "Who looks outside, dreams; who looks inside, awakes."
                        </p>
                        <p className="quote-author">— Carl Jung</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingIntro;
