import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const stats = [
    { value: '200+', label: 'Clients Helped' },
    { value: '8', label: 'Years in Practice' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '2', label: 'Languages (EN + HI)' }
];

const philosophyPillars = [
    {
        icon: 'NJ',
        title: 'Non-Judgment',
        desc: 'A space free from shame, where every part of you is welcome exactly as it is.'
    },
    {
        icon: 'CO',
        title: 'Collaboration',
        desc: 'We work as partners. Your insights guide the direction as much as mine.'
    },
    {
        icon: 'EB',
        title: 'Evidence-Based',
        desc: 'Grounded in research while remaining warm, adaptive, and deeply human.'
    },
    {
        icon: 'YP',
        title: 'Your Pace',
        desc: 'Healing is not a race. We move at a rhythm that honors where you are today.'
    }
];

const credentials = [
    {
        year: '2014 - 2016',
        title: 'M.A. Clinical Psychology',
        institute: 'University of Delhi - First Class with Distinction'
    },
    {
        year: '2017',
        title: 'B.A. (Hons.) Psychology',
        institute: 'Lady Shri Ram College, New Delhi'
    },
    {
        year: '2018',
        title: 'Certified CBT Practitioner',
        institute: 'Beck Institute for Cognitive Behavior Therapy, USA'
    },
    {
        year: '2020',
        title: 'MBSR - Mindfulness-Based Stress Reduction',
        institute: 'Center for Mindfulness, UMass Medical School'
    },
    {
        year: '2021',
        title: 'Trauma-Informed Care Certification',
        institute: 'SAMHSA and Trauma Resource Institute'
    },
    {
        year: '2023',
        title: 'Somatic Experiencing Practitioner (SEP)',
        institute: 'Somatic Experiencing International'
    }
];

const modalities = [
    {
        tag: 'CBT',
        name: 'Cognitive Behavioural Therapy',
        desc: 'Identify and restructure thought patterns driving anxiety, low mood, and unhelpful behaviours.'
    },
    {
        tag: 'Body-Based',
        name: 'Somatic Therapy',
        desc: 'Release stored stress through body-based awareness, regulation, and gentle nervous system work.'
    },
    {
        tag: 'MBSR / MBCT',
        name: 'Mindfulness-Based Therapy',
        desc: 'Build calm awareness to observe thoughts without being pulled into old emotional loops.'
    },
    {
        tag: 'Relational',
        name: 'Attachment-Based Therapy',
        desc: 'Understand early relational blueprints and create healthier patterns in your present relationships.'
    },
    {
        tag: 'Safety-First',
        name: 'Trauma-Informed Care',
        desc: 'All sessions are grounded in safety, trust, and choice so healing can happen without overwhelm.'
    },
    {
        tag: 'Story and Identity',
        name: 'Narrative Therapy',
        desc: 'Separate yourself from the problem and reauthor the stories you carry about who you are.'
    }
];

const testimonials = [
    {
        quote:
            'Kajal helped me see my patterns without judgment and finally change them. I came in barely functioning and left with a life I am proud of.',
        name: 'Priya S.',
        detail: 'Client since 2022 - Anxiety and Self-Worth',
        featured: false
    },
    {
        quote:
            'What sets Kajal apart is her ability to hold space without rushing you toward answers. After years of feeling misunderstood, I finally felt seen.',
        name: 'Arjun M.',
        detail: 'Client since 2021 - Relationship Healing',
        featured: true
    },
    {
        quote:
            'I was skeptical about online therapy, but Kajal made it feel deeply personal. The somatic work shifted something in me that years of therapy had not reached.',
        name: 'Neha R.',
        detail: 'Client since 2023 - Trauma Recovery',
        featured: false
    }
];

const storyImages = [
    {
        title: 'Practice',
        image:
            'https://images.pexels.com/photos/3767394/pexels-photo-3767394.jpeg?auto=compress&cs=tinysrgb&w=1200'
    },
    {
        title: 'Learning',
        image:
            'https://images.pexels.com/photos/4050320/pexels-photo-4050320.jpeg?auto=compress&cs=tinysrgb&w=1200'
    },
    {
        title: 'With Heart',
        image:
            'https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg?auto=compress&cs=tinysrgb&w=1200'
    }
];

const AboutPage: React.FC = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });

        const revealElements = document.querySelectorAll<HTMLElement>(
            '.ra-reveal, .ra-reveal-left, .ra-reveal-right'
        );

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.14 }
        );

        revealElements.forEach((element) => observer.observe(element));

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="ra-about">
            <section className="ra-hero">
                <div className="ra-hero-left">
                    <div className="ra-blob ra-blob-one"></div>
                    <div className="ra-blob ra-blob-two"></div>

                    <div className="ra-hero-left-content">
                        <div className="ra-eyebrow">
                            <span className="ra-eyebrow-line"></span>
                            <span>The Story Behind the Space</span>
                        </div>

                        <h1>
                            I&apos;m Kajal.
                            <em>Your Guide to Healing.</em>
                        </h1>

                        <p className="ra-hero-desc">
                            A licensed therapist with 8+ years of experience helping individuals
                            untangle anxiety, heal from within, and step into their most authentic
                            selves.
                        </p>

                        <div className="ra-quote-chip">
                            <span className="ra-quote-mark">&quot;</span>
                            <div>
                                <p>
                                    Healing is not about becoming someone new. It is about coming
                                    home to who you have always been.
                                </p>
                                <span>- Kajal&apos;s core belief</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ra-hero-right">
                    <div className="ra-hero-right-bg-text" aria-hidden="true">
                        Kajal
                    </div>

                    <div className="ra-portrait-frame ra-reveal-right">
                        <span className="ra-portrait-tag">Licensed Therapist</span>
                        <span className="ra-portrait-tag">8+ Years Experience</span>
                        <span className="ra-portrait-tag">Hindi and English</span>
                        <div className="ra-portrait-main">
                            <img
                                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                                alt="Profile"
                                loading="eager"
                                decoding="async"
                                style={{ borderRadius: 'inherit' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="ra-stats-strip">
                {stats.map((stat, index) => (
                    <article className="ra-stat-cell ra-reveal" key={stat.label} style={{ transitionDelay: `${index * 70}ms` }}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                    </article>
                ))}
            </section>

            <section className="ra-story">
                <div className="ra-story-grid">
                    <div className="ra-reveal-left">
                        <p className="ra-section-kicker">My Story</p>
                        <h2>
                            A Journey That Began With
                            <em>My Own Healing</em>
                        </h2>
                        <p>
                            I did not choose therapy. It chose me. In my mid-20s, I found myself
                            caught in patterns I could not explain, anxiety that came from nowhere,
                            and a constant feeling of not being enough.
                        </p>
                        <p>
                            My own healing process opened a door I did not know existed. Beneath the
                            noise of my thoughts were old stories. Slowly, I learned to rewrite them.
                        </p>
                        <p>
                            Today my practice is built on one conviction. You are not broken. You are
                            someone who has not been given the right tools yet.
                        </p>

                        <div className="ra-signature">
                            <div className="ra-sign-avatar">K</div>
                            <div>
                                <strong>Kajal</strong>
                                <span>Licensed Therapist - Rewire with Kajal</span>
                            </div>
                        </div>
                    </div>

                    <div className="ra-mosaic ra-reveal-right">
                        <div className="ra-mosaic-cell ra-mosaic-main">
                            <img
                                src={storyImages[0].image}
                                alt={storyImages[0].title}
                                loading="lazy"
                                decoding="async"
                            />
                            <span>{storyImages[0].title}</span>
                        </div>
                        <div className="ra-mosaic-cell">
                            <img
                                src={storyImages[1].image}
                                alt={storyImages[1].title}
                                loading="lazy"
                                decoding="async"
                            />
                            <span>{storyImages[1].title}</span>
                        </div>
                        <div className="ra-mosaic-cell">
                            <img
                                src={storyImages[2].image}
                                alt={storyImages[2].title}
                                loading="lazy"
                                decoding="async"
                            />
                            <span>{storyImages[2].title}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="ra-philosophy">
                <div className="ra-philosophy-bg" aria-hidden="true">
                    Rewire
                </div>

                <div className="ra-philosophy-grid">
                    <div className="ra-reveal-left">
                        <p className="ra-section-kicker ra-kicker-light">My Philosophy</p>
                        <h2>
                            Therapy Is a Space to
                            <em>Be, Not Just Perform</em>
                        </h2>
                        <p>
                            I do not believe in one-size-fits-all therapy. Every person brings a
                            different constellation of experiences, fears, and strengths.
                        </p>
                        <p>
                            My role is not to fix you. My role is to help you see yourself clearly,
                            without the distortion of old stories.
                        </p>
                    </div>

                    <div className="ra-pillar-grid ra-reveal-right">
                        {philosophyPillars.map((pillar, index) => (
                            <article className="ra-pillar-card ra-reveal" key={pillar.title} style={{ transitionDelay: `${index * 70}ms` }}>
                                <div className="ra-pillar-icon">{pillar.icon}</div>
                                <h3>{pillar.title}</h3>
                                <p>{pillar.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ra-credentials">
                <div className="ra-section-head ra-reveal">
                    <p className="ra-section-kicker">Education and Training</p>
                    <h2>
                        Built on
                        <em>Solid Foundations</em>
                    </h2>
                    <p>Years of rigorous learning in service of your healing.</p>
                </div>

                <div className="ra-timeline">
                    {credentials.map((item, index) => (
                        <article className={`ra-timeline-item ra-reveal ${index % 2 === 0 ? 'left' : 'right'}`} key={`${item.year}-${item.title}`}>
                            <div className="ra-timeline-card">
                                <p className="ra-timeline-year">{item.year}</p>
                                <h3>{item.title}</h3>
                                <p>{item.institute}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="ra-modalities">
                <div className="ra-section-head ra-reveal">
                    <p className="ra-section-kicker">How I Work</p>
                    <h2>
                        Therapeutic
                        <em>Modalities</em>
                    </h2>
                    <p>An integrative approach drawing from modern and holistic psychology.</p>
                </div>

                <div className="ra-modality-grid">
                    {modalities.map((modality, index) => (
                        <article className="ra-modality-card ra-reveal" key={modality.name} style={{ transitionDelay: `${index * 60}ms` }}>
                            <div className="ra-modality-number">{String(index + 1).padStart(2, '0')}</div>
                            <h3>{modality.name}</h3>
                            <p>{modality.desc}</p>
                            <span>{modality.tag}</span>
                        </article>
                    ))}
                </div>
            </section>

            <section className="ra-testimonials">
                <div className="ra-test-bg ra-test-bg-one"></div>
                <div className="ra-test-bg ra-test-bg-two"></div>

                <div className="ra-test-inner">
                    <div className="ra-section-head ra-reveal">
                        <p className="ra-section-kicker ra-kicker-light">Client Stories</p>
                        <h2>
                            Words From Those Who&apos;ve
                            <em>Walked This Path</em>
                        </h2>
                        <p>Every story is shared with permission and love.</p>
                    </div>

                    <div className="ra-test-grid">
                        {testimonials.map((testimonial, index) => (
                            <article className={`ra-test-card ra-reveal ${testimonial.featured ? 'featured' : ''}`} key={testimonial.name} style={{ transitionDelay: `${index * 70}ms` }}>
                                <p className="ra-stars">5.0</p>
                                <p className="ra-test-quote">{testimonial.quote}</p>
                                <div className="ra-test-author">
                                    <div className="ra-test-avatar">{testimonial.name.slice(0, 1)}</div>
                                    <div>
                                        <strong>{testimonial.name}</strong>
                                        <span>{testimonial.detail}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ra-cta">
                <div className="ra-cta-inner ra-reveal">
                    <p className="ra-cta-kicker">Ready to Begin?</p>
                    <h2>
                        Let&apos;s Start Your
                        <em>Healing Journey Together</em>
                    </h2>
                    <p>
                        The most courageous thing you can do is ask for support. I am here and
                        honored to walk alongside you.
                    </p>
                    <div className="ra-cta-actions">
                        <Link to="/appointment" className="ra-btn-white">
                            Book a Free Discovery Call
                        </Link>
                        <Link to="/intake-form" className="ra-btn-ghost-white">
                            Complete Intake Form
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
