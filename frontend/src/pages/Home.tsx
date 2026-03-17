import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText } from '../utils/blogContent';
import { getCollectionItems } from '../utils/collections';
import AppointmentForm from '../components/AppointmentForm';

type BlogPost = {
    id: number;
    title: string;
    content: string;
    image_url?: string;
    created_at?: string;
};

const heroStats = [
    { value: '200+', label: 'Lives Transformed' },
    { value: '8', label: 'Years Experience' },
    { value: '98%', label: 'Client Satisfaction' }
];

const challengeCards = [
    {
        title: 'Anxiety',
        desc: 'Constant worry and nervousness that interferes with daily activities. We help you find your calm center.',
        imageUrl:
            'https://www.hdfcergo.com/images/default-source/wellness-corner/understanding-illness-anxiety-disorder_m.jpg'
    },
    {
        title: 'Depression',
        desc: 'Persistent feelings of sadness, loss of interest, and lack of energy. Reclaim the color in your life.',
        imageUrl:
            'https://neurowellnessspa.com/wp-content/uploads/2022/09/iStock-1301034661.jpeg'
    },
    {
        title: 'Burnout',
        desc: 'Physical and emotional exhaustion typically caused by prolonged stress. Discover how to recharge sustainably.',
        imageUrl:
            'https://www.darlingdowns.health.qld.gov.au/__data/assets/image/0014/105161/20211122-burnout-864x486px.jpg'
    },
    {
        title: 'Overthinking',
        desc: 'Dwelling on thoughts repeatedly, causing stress and decision paralysis. Learn to break the mental loops.',
        imageUrl:
            'https://cdn.powerofpositivity.com/wp-content/uploads/2022/08/Psychologist-Explains-Eight-Habits-to-Stop-Overthinking.jpg'
    }
];

const serviceCards = [
    {
        title: 'Relationship Guidance',
        desc: 'Rebuild trust, communication, and emotional safety in key relationships.',
        icon: 'RL',
        cardClass: 'rh-service-card-standard'
    },
    {
        title: 'Stress Management',
        desc: 'Body-based tools to regulate your nervous system and reclaim calm.',
        icon: 'SM',
        cardClass: 'rh-service-card-accent'
    },
    {
        title: 'Mind Rewiring Sessions',
        desc: 'Shift the core beliefs and thought loops that keep you stuck.',
        icon: 'MR',
        cardClass: 'rh-service-card-sand'
    },
    {
        title: 'Emotional Healing',
        desc: 'Process grief and emotional pain through trauma-informed care.',
        icon: 'EH',
        cardClass: 'rh-service-card-standard'
    }
];

const faqItems = [
    {
        question: 'What happens during a mind rewiring session?',
        answer:
            'Mind rewiring combines CBT methods, mindfulness, and somatic awareness to help you notice and gradually shift limiting thought patterns at your pace.'
    },
    {
        question: 'How long does therapy usually take?',
        answer:
            'The timeline is different for everyone. Some clients feel meaningful change in 6 to 8 sessions, while others choose longer support based on their goals.'
    },
    {
        question: 'Is my personal information confidential?',
        answer:
            'Yes. Your sessions and information are handled with strict confidentiality and professional ethics, except in situations of immediate safety risk.'
    },
    {
        question: 'Do you offer online sessions?',
        answer:
            'Yes. Online and in-person sessions are available in English and Hindi, depending on your comfort and schedule.'
    }
];

const tickerItems = [
    'Anxiety and Stress',
    'Relationship Healing',
    'Trauma Recovery',
    'Mind Rewiring',
    'Emotional Healing',
    'Self Worth and Identity',
    'Life Transitions'
];

type RevealProps = {
    children: React.ReactNode;
    className?: string;
    delayMs?: number;
    style?: React.CSSProperties;
};

const Reveal: React.FC<RevealProps> = ({ children, className = '', delayMs = 0, style }) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.14 }
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={ref}
            className={`rh-reveal ${className}`.trim()}
            style={{ transitionDelay: `${delayMs}ms`, ...style }}
        >
            {children}
        </div>
    );
};

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);
    const [latestBlogs, setLatestBlogs] = useState<BlogPost[]>([]);
    const [blogsLoading, setBlogsLoading] = useState(true);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);

    useEffect(() => {
        let canceled = false;

        const fetchLatestBlogs = async () => {
            setBlogsLoading(true);
            try {
                const response = await requestWithApiFallback(() =>
                    axios.get(apiUrl('/api/blogs/public?limit=4&page=1'))
                );

                if (canceled) return;
                const items = getCollectionItems<BlogPost>(response.data);
                setLatestBlogs(items.slice(0, 4));
            } catch (error) {
                if (!canceled) {
                    setLatestBlogs([]);
                }
            } finally {
                if (!canceled) {
                    setBlogsLoading(false);
                }
            }
        };

        void fetchLatestBlogs();

        return () => {
            canceled = true;
        };
    }, []);

    const featuredBlog = latestBlogs.length > 0 ? latestBlogs[0] : null;
    const listBlogs = latestBlogs.length > 1 ? latestBlogs.slice(1, 4) : [];

    const getExcerpt = (content: string, maxLength = 170) => {
        const plain = blogContentToPlainText(content || '');
        if (plain.length <= maxLength) return plain;
        return `${plain.slice(0, maxLength).trim()}...`;
    };

    return (
        <div className="rh-home">
            <section className="rh-hero">
                <div className="rh-hero-bg">
                    <div className="rh-hero-blob rh-blob-one"></div>
                    <div className="rh-hero-blob rh-blob-two"></div>
                    <div className="rh-hero-blob rh-blob-three"></div>
                </div>

                <div className="rh-shell rh-hero-grid">
                    <Reveal className="rh-hero-copy">
                        <p className="rh-eyebrow">Dedicated Mental Health Guidance</p>
                        <h1>
                            Find Your Peace.
                            <span>Rewire Your Mind.</span>
                        </h1>
                        <p className="rh-hero-sub">
                            A safe, compassionate space to untangle anxiety, heal relationships,
                            and reconnect with the version of you that feels steady and alive.
                        </p>

                        <div className="rh-hero-actions">
                            <button
                                type="button"
                                className="rh-btn-solid"
                                onClick={() => navigate('/appointment')}
                            >
                                Book Sessions
                            </button>
                        </div>

                        <div className="rh-hero-stats">
                            {heroStats.map((stat) => (
                                <div key={stat.label}>
                                    <div className="rh-stat-value">{stat.value}</div>
                                    <div className="rh-stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </Reveal>

                    <Reveal className="rh-hero-card-wrap" delayMs={120}>
                        <article className="rh-hero-card">
                            <div className="rh-avatar">K</div>
                            <h3>Kajal</h3>
                            <p>
                                Licensed therapist specializing in anxiety, relationships,
                                and meaningful emotional recovery.
                            </p>
                            <div className="rh-tag-row">
                                <span>CBT</span>
                                <span>Mindfulness</span>
                                <span>Somatic</span>
                                <span>Trauma Informed</span>
                            </div>
                        </article>

                        <div className="rh-floating-pill rh-pill-bottom">
                            <strong>Highly Rated</strong>
                            <span>Trusted by 150+ clients</span>
                        </div>
                    </Reveal>
                </div>

                <div className="rh-hero-wave" aria-hidden="true">
                    <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z" fill="#fffdf9" />
                    </svg>
                </div>
            </section>

            <div className="rh-ticker" aria-hidden="true">
                <div className="rh-ticker-track">
                    {[...tickerItems, ...tickerItems].map((item, index) => (
                        <span className="rh-ticker-item" key={`${item}-${index}`}>
                            <span className="rh-dot"></span>
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            <section className="rh-section rh-challenges">
                <div className="rh-shell">
                    <Reveal className="rh-section-head rh-center">
                        <p className="rh-kicker">What We Address</p>
                        <h2>
                            Mental Health Challenges
                            <span>We Navigate Together</span>
                        </h2>
                        <p>
                            Understanding the root of your experience is the first step toward
                            meaningful and lasting change.
                        </p>
                    </Reveal>

                    <div className="rh-challenge-grid">
                        {challengeCards.map((card, index) => (
                            <Reveal
                                className="rh-challenge-card"
                                key={card.title}
                                delayMs={index * 70}
                                style={{
                                    backgroundImage: `linear-gradient(150deg, rgba(53, 39, 31, 0.28), rgba(53, 39, 31, 0.62)), url(${card.imageUrl})`
                                }}
                            >
                                <h3>{card.title}</h3>
                                <p>{card.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rh-section rh-services">
                <div className="rh-shell">
                    <Reveal className="rh-services-top">
                        <div>
                            <p className="rh-kicker">What We Offer</p>
                            <h2 className="rh-services-title-animate">
                                Curated Paths to
                                <span>Rediscover Your Strength</span>
                            </h2>
                            <p>
                                Personalized therapy tracks built for your current phase,
                                your goals, and your pace.
                            </p>
                        </div>
                    </Reveal>

                    <div className="rh-services-grid">
                        <Reveal className="rh-service-card-featured" delayMs={50}>
                            <div className="rh-featured-badge">1:1</div>
                            <div className="rh-featured-content">
                                <p className="rh-kicker rh-kicker-on-dark">Signature Care</p>
                                <h3>Individual Counseling</h3>
                                <p>
                                    A private and grounded space to work through anxiety,
                                    depression, trauma, and identity patterns using structured and
                                    compassionate therapeutic methods.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rh-btn-solid rh-btn-solid-on-amber"
                                onClick={() => navigate('/appointment')}
                            >
                                Book Sessions
                            </button>
                        </Reveal>

                        {serviceCards.map((service, index) => (
                            <Reveal
                                className={`rh-service-card ${service.cardClass}`}
                                key={service.title}
                                delayMs={120 + index * 65}
                            >
                                <div className="rh-service-icon">{service.icon}</div>
                                <h4>{service.title}</h4>
                                <p>{service.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rh-section rh-journey" id="rh-journey">
                <div className="rh-shell rh-journey-grid">
                    <Reveal>
                        <p className="rh-kicker">Your Journey</p>
                        <h2>
                            Therapy Starts with
                            <span>One Brave Conversation</span>
                        </h2>
                        <p>
                            Therapy is not about fixing what is broken. It is about understanding,
                            healing, and moving toward the life that feels true to you.
                        </p>
                        <p>
                            If you feel stuck, overwhelmed, emotionally tired, or disconnected,
                            counseling gives you tools, clarity, and support to move forward.
                        </p>
                        <button
                            type="button"
                            className="rh-btn-dark"
                            onClick={() => navigate('/appointment')}
                        >
                            Book Sessions
                        </button>
                    </Reveal>

                    <Reveal className="rh-faq" delayMs={120}>
                        {faqItems.map((item, index) => {
                            const isOpen = index === openFaqIndex;
                            return (
                                <article className={`rh-faq-item ${isOpen ? 'open' : ''}`} key={item.question}>
                                    <button
                                        type="button"
                                        className="rh-faq-question"
                                        aria-expanded={isOpen}
                                        onClick={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))}
                                    >
                                        <span>{item.question}</span>
                                        <span className="rh-faq-toggle" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </span>
                                    </button>
                                    <div className="rh-faq-answer">{item.answer}</div>
                                </article>
                            );
                        })}
                    </Reveal>
                </div>
            </section>

            <section className="rh-section rh-insights">
                <div className="rh-shell">
                    <Reveal className="rh-section-head rh-center">
                        <p className="rh-kicker">Latest Insights</p>
                        <h2>
                            Thoughts on Mental Wellness
                            <span>for Everyday Life</span>
                        </h2>
                    </Reveal>

                    {blogsLoading ? (
                        <div className="rh-insights-loading">Loading latest blogs...</div>
                    ) : latestBlogs.length === 0 ? (
                        <div className="rh-insights-loading">Latest blogs will appear here shortly.</div>
                    ) : (
                        <div className="rh-insights-grid">
                            {featuredBlog && (
                                <Reveal className="rh-insight-featured" delayMs={80}>
                                    <div className="rh-insight-cover">
                                        {featuredBlog.image_url ? (
                                            <img
                                                src={resolveMediaUrl(featuredBlog.image_url)}
                                                alt={featuredBlog.title}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <span className="rh-insight-badge">Latest Blog</span>
                                        )}
                                    </div>
                                    <div className="rh-insight-body">
                                        <h3>{featuredBlog.title}</h3>
                                        <p>{getExcerpt(featuredBlog.content, 200)}</p>
                                        <button
                                            type="button"
                                            className="rh-insight-readmore"
                                            onClick={() => navigate('/blogs')}
                                        >
                                            Read more
                                        </button>
                                    </div>
                                </Reveal>
                            )}

                            <div className="rh-insight-list">
                                {listBlogs.map((item, index) => {
                                    const thumb = resolveMediaUrl(item.image_url || '');
                                    return (
                                        <Reveal className="rh-insight-item" key={item.id} delayMs={130 + index * 60}>
                                            <div className="rh-insight-thumb-wrap">
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt={item.title}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="rh-insight-thumb-image"
                                                    />
                                                ) : (
                                                    <div className="rh-insight-thumb rh-insight-soft-peach"></div>
                                                )}
                                            </div>
                                            <div className="rh-insight-content">
                                                <p className="rh-insight-tag">Latest Blog</p>
                                                <h4>{item.title}</h4>
                                                <p className="rh-insight-snippet">{getExcerpt(item.content, 110)}</p>
                                                <button
                                                    type="button"
                                                    className="rh-insight-readmore"
                                                    onClick={() => navigate('/blogs')}
                                                >
                                                    Read more
                                                </button>
                                            </div>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="rh-section rh-appointment-section" id="book-session">
                <div className="rh-shell">
                    <Reveal className="rh-section-head rh-center">
                        <p className="rh-kicker">Take the First Step</p>
                        <h2>
                            Book Your <span>Session</span>
                        </h2>
                    </Reveal>
                    <AppointmentForm />
                </div>
            </section>
        </div>
    );
};

export default Home;
