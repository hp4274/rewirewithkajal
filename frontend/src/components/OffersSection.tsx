import React from 'react';
import AnimatedLine from './AnimatedLine';

const offers = [
    { id: 1, title: '1:1 Counselling', shapeClass: 'shape-1', image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&q=80&w=600' },
    { id: 2, title: 'Relationship Guidance', shapeClass: 'shape-2', image: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=600' },
    { id: 3, title: 'Stress Management', shapeClass: 'shape-3', image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=600' },
    { id: 4, title: 'Mind Rewiring Sessions', shapeClass: 'shape-4', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600' },
    { id: 5, title: 'Emotional Healing', shapeClass: 'shape-5', image: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&q=80&w=600' }
];

const OffersSection: React.FC = () => {
    return (
        <section className="offers-section" id="offers" style={{ position: 'relative' }}>
            <AnimatedLine />
            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div className="section-header text-center">
                    <h2>What We Offer</h2>
                    <p className="subtitle">Curated paths to rediscover your inner strength.</p>
                </div>

                <div className="offers-grid">
                    {offers.map(offer => (
                        <div
                            key={offer.id}
                            className={`offer-card stagger-item ${offer.shapeClass}`}
                            style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${offer.image})` }}
                        >
                            <h4 className="offer-title">{offer.title}</h4>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default OffersSection;
