import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Users, BookOpen, Clock, ChevronLeft } from 'lucide-react';
import Reveal from '../components/Reveal';

const stats = [
    { value: '200+', label: 'Clients Helped' },
    { value: '8', label: 'Years in Practice' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '3', label: 'Languages (EN + HI + GU)' }
];

const philosophyPillars = [
    {
        icon: <HeartHandshake size={24} />,
        title: 'Non-Judgment',
        desc: 'A space free from shame, where every part of you is welcome exactly as it is.'
    },
    {
        icon: <Users size={24} />,
        title: 'Collaboration',
        desc: 'We work as partners. Your insights guide the direction as much as mine.'
    },
    {
        icon: <BookOpen size={24} />,
        title: 'Evidence-Based',
        desc: 'Grounded in research while remaining warm, adaptive, and deeply human.'
    },
    {
        icon: <Clock size={24} />,
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
    }, []);

    return (
        <div className="abt2-wrapper">
            <div style={{ position: 'relative', zIndex: 8, paddingBottom: '10px', paddingLeft: '18px' }}>
                <Link to="/" className="abt2-home-link" aria-label="Back to home page">
                    <span className="abt2-home-link-arrow" aria-hidden="true"><ChevronLeft size={16} strokeWidth={2.4} /></span>
                    <span>Back to Home</span>
                </Link>
            </div>

            <section className="abt2-hero">
                <Reveal className="abt2-hero-img-col" delayMs={100}>
                    <div className="abt2-hero-img-wrapper">
                        <img
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Profile"
                            loading="eager"
                        />
                    </div>
                    <div className="abt2-hero-quote">
                        <p>
                            &quot;Healing is not about becoming someone new. It is about coming home to
                            who you have always been.&quot;
                        </p>
                        <span>- Kajal&apos;s core belief</span>
                    </div>
                </Reveal>
                <Reveal className="abt2-hero-text-col" delayMs={300}>
                    <div className="abt2-kicker">The Story Behind the Space</div>
                    <h1>
                        I&apos;m Kajal.
                        <em>Your Guide to Healing.</em>
                    </h1>
                    <p className="abt2-hero-desc">
                        A licensed therapist with 8+ years of experience helping individuals
                        untangle anxiety, heal from within, and step into their most authentic
                        selves.
                    </p>
                </Reveal>
            </section>

            <section className="abt2-stats">
                {stats.map((stat, index) => (
                    <Reveal className="abt2-stat-item" key={stat.label} delayMs={index * 150}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                    </Reveal>
                ))}
            </section>

            <section className="abt2-story">
                <Reveal className="abt2-story-content" delayMs={150}>
                    <div className="abt2-kicker">My Story</div>
                    <h2>
                        A Journey That Began With
                        <em>My Own Healing</em>
                    </h2>
                    <div className="abt2-story-text">
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
                    </div>
                    <div className="abt2-profile-card">
                        <div className="abt2-avatar">K</div>
                        <div className="abt2-profile-details">
                            <strong>Kajal</strong>
                            <span>Licensed Therapist - Rewire with Kajal</span>
                        </div>
                    </div>
                </Reveal>
                <div className="abt2-story-images">
                    <div className="abt2-img-wrap main">
                        <img src={storyImages[0].image} alt={storyImages[0].title} loading="lazy" />
                        <span className="abt2-img-label">{storyImages[0].title}</span>
                    </div>
                    <div className="abt2-img-wrap sub">
                        <img src={storyImages[1].image} alt={storyImages[1].title} loading="lazy" />
                        <span className="abt2-img-label">{storyImages[1].title}</span>
                    </div>
                    <div className="abt2-img-wrap sub">
                        <img src={storyImages[2].image} alt={storyImages[2].title} loading="lazy" />
                        <span className="abt2-img-label">{storyImages[2].title}</span>
                    </div>
                </div>
            </section>

            <section className="abt2-philosophy">
                <div className="abt2-phil-inner">
                    <div className="abt2-phil-header">
                        <div className="abt2-kicker">My Philosophy</div>
                        <h2>
                            Therapy Is a Space to
                            <em>Be, Not Just Perform</em>
                        </h2>
                        <p>
                            I do not believe in one-size-fits-all therapy. Every person brings a
                            different constellation of experiences, fears, and strengths. My role is
                            not to fix you, but to help you see yourself clearly.
                        </p>
                    </div>
                    <div className="abt2-phil-grid">
                        {philosophyPillars.map((pillar, index) => (
                            <Reveal className="abt2-phil-card" key={pillar.title} delayMs={index * 150}>
                                <div className="abt2-phil-icon">{pillar.icon}</div>
                                <h3>{pillar.title}</h3>
                                <p>{pillar.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="abt2-creds">
                <div className="abt2-creds-layout">
                    <div className="abt2-creds-left">
                        <div className="abt2-kicker">Credentials</div>
                        <h2>
                            Built on
                            <em>Solid Foundations</em>
                        </h2>
                        <p>
                            A blend of academic rigor and continuous lifelong learning across
                            multiple disciplines of psychology.
                        </p>
                    </div>
                    <div className="abt2-creds-list">
                        {credentials.map((cred, index) => (
                            <Reveal className="abt2-cred-item" key={`${cred.year}-${cred.title}`} delayMs={index * 100}>
                                <div className="abt2-cred-year">{cred.year}</div>
                                <div className="abt2-cred-detail">
                                    <h3>{cred.title}</h3>
                                    <p>{cred.institute}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="abt2-mod">
                <div className="abt2-mod-inner">
                    <div className="abt2-mod-header">
                        <div className="abt2-kicker">Therapeutic Modalities</div>
                        <h2>
                            How We
                            <em>Work Together</em>
                        </h2>
                    </div>
                    <div className="abt2-mod-grid">
                        {modalities.map((mod, index) => (
                            <Reveal className="abt2-mod-card" key={mod.name} delayMs={index * 150}>
                                <div className="abt2-mod-num">{String(index + 1).padStart(2, '0')}</div>
                                <span>{mod.tag}</span>
                                <h3>{mod.name}</h3>
                                <p>{mod.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="abt2-test">
                <div className="abt2-test-inner">
                    <div className="abt2-kicker">Client Stories</div>
                    <h2>
                        Words From
                        <em>Those I&apos;ve Helped</em>
                    </h2>
                    <div className="abt2-test-grid">
                        {testimonials.map((test, index) => (
                            <Reveal
                                className={`abt2-test-card ${test.featured ? 'featured' : ''}`}
                                key={test.name}
                                delayMs={index * 150}
                            >
                                <div className="abt2-test-stars">★★★★★</div>
                                <p className="abt2-test-quote">&quot;{test.quote}&quot;</p>
                                <div className="abt2-test-author">
                                    <div className="abt2-test-avatar">{test.name.charAt(0)}</div>
                                    <div>
                                        <strong>{test.name}</strong>
                                        <span>{test.detail}</span>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="abt2-cta">
                <Reveal className="abt2-cta-inner">
                    <h2>Ready to Begin?</h2>
                    <p>
                        Taking the first step can feel daunting, but you don&apos;t have to do it
                        alone. Let&apos;s explore if we&apos;re the right fit for your healing journey.
                    </p>
                    <div className="abt2-cta-actions">
                        <Link to="/appointment" className="abt2-btn-primary">
                            Book a Consultation
                        </Link>
                        <Link to="/intake-form" className="abt2-btn-secondary">
                            Complete Intake Form
                        </Link>
                    </div>
                </Reveal>
            </section>
        </div>
    );
};

export default AboutPage;
