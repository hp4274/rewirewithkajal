import React, { useState } from 'react';
import './CombinedSlider.css';

const problems = [
    {
        title: 'Anxiety',
        desc: 'Constant worry and nervousness that interferes with daily activities. We help you find your calm center.',
        image: 'https://www.hdfcergo.com/images/default-source/wellness-corner/understanding-illness-anxiety-disorder_m.jpg'
    },
    {
        title: 'Depression',
        desc: 'Persistent feelings of sadness, loss of interest, and lack of energy. Reclaim the color in your life.',
        image: 'https://neurowellnessspa.com/wp-content/uploads/2022/09/iStock-1301034661.jpeg'
    },
    {
        title: 'Burnout',
        desc: 'Physical and emotional exhaustion typically caused by prolonged stress. Discover how to recharge sustainably.',
        image: 'https://www.darlingdowns.health.qld.gov.au/__data/assets/image/0014/105161/20211122-burnout-864x486px.jpg'
    },
    {
        title: 'Overthinking',
        desc: 'Dwelling on thoughts repeatedly, causing stress and decision paralysis. Learn to break the mental loops.',
        image: 'https://cdn.powerofpositivity.com/wp-content/uploads/2022/08/Psychologist-Explains-Eight-Habits-to-Stop-Overthinking.jpg'
    }
];

const CombinedSlider: React.FC = () => {
    const [activeProblem, setActiveProblem] = useState(0);

    return (
        <section className="problems-section container">
            <div className="section-header text-center">
                <h2>Mental Health Challenges We Address</h2>
                <p className="subtitle">Understanding the root of the issue is the first step derived from compassion.</p>
            </div>

            <div className="problems-accordion">
                {problems.map((problem, index) => (
                    <div
                        key={index}
                        className={`problem-accordion-item ${activeProblem === index ? 'active' : ''}`}
                        onClick={() => setActiveProblem(index)}
                        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url('${problem.image}')` }}
                    >
                        <div className="problem-accordion-content">
                            <div className="problem-accordion-number">0{index + 1}</div>
                            <h3>{problem.title}</h3>
                            <p className="problem-accordion-desc">{problem.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CombinedSlider;
