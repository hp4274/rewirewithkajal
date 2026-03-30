import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Users, Activity, Brain, Heart, Instagram, Twitter, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText } from '../utils/blogContent';
import { getCollectionItems } from '../utils/collections';
import AppointmentForm from '../components/AppointmentForm';
import logoMark from '../assets/logo3.png';
import Reveal from '../components/Reveal';

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

const heroSlides = [
    {
        id: 'healing',
        eyebrow: 'Rewire Your Mind',
        lineOne: 'Find Your Calm.',
        lineTwo: 'Heal from Within.',
        description: 'A compassionate space dedicated purely to your mental well-being, helping you gently untangle anxiety and overcome mental barriers.',
        primaryLabel: 'Start Healing',
        primaryPath: '/appointment',
        secondaryLabel: 'Learn More',
        secondaryPath: '/about',
        panelTitle: 'Professional Therapy',
        panelBody: 'Guided therapeutic methods designed to rebuild emotional resilience and bring clarity back into your daily routine.',
        imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
        tags: ['Therapy', 'Anxiety', 'Growth']
    },
    {
        id: 'balance',
        eyebrow: 'Restore Your Life',
        lineOne: 'Reclaim Your',
        lineTwo: 'Peace of Mind.',
        description: 'Through empathetic counseling, we work together to process deeply held emotions and lay the foundation for a healthier life.',
        primaryLabel: 'Book a Session',
        primaryPath: '/appointment',
        secondaryLabel: 'Read Blogs',
        secondaryPath: '/blogs',
        panelTitle: 'Burnout Recovery',
        panelBody: 'Learn sustainable strategies to manage stress, set healthy boundaries, and rediscover your joy in life.',
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80',
        tags: ['Balance', 'Clarity', 'Peace']
    },
    {
        id: 'support',
        eyebrow: 'You Are Not Alone',
        lineOne: 'Navigate Life’s',
        lineTwo: 'Transitions Safely.',
        description: 'Whether you are facing relationship challenges, career changes, or personal loss, therapy provides a secure anchor.',
        primaryLabel: 'Book a Session',
        primaryPath: '/appointment',
        secondaryLabel: 'Our Services',
        secondaryPath: '/about',
        panelTitle: 'Deep Support',
        panelBody: 'We combine evidence-based CBT with somatic practices to offer holistic care tailored to your unique journey.',
        imageUrl: 'https://images.unsplash.com/photo-1471180625745-944903837c22?auto=format&fit=crop&w=800&q=80',
        tags: ['Support', 'Wellness', 'Care']
    }
] as const;

const HomeNavbar: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="home-hero-navbar-wrapper">
            <div className="home-hero-navbar">
                <div className="hhn-logo" onClick={() => navigate('/')} aria-label="Home">
                    <img src={logoMark} alt="Rewire With Kajal" />
                </div>
                <nav className="hhn-links">
                    <button onClick={() => navigate('/about')}>About</button>
                    <button onClick={() => navigate('/blogs')}>Blog</button>
                    <button onClick={() => navigate('/appointment')} className="hhn-book-btn">Book Appointment</button>
                </nav>
                <div className="hhn-socials">
                    <a href="https://instagram.com" aria-label="Instagram"><Instagram size={18} /></a>
                    <a href="https://twitter.com" aria-label="Twitter"><Twitter size={18} /></a>
                    <a href="https://youtube.com" aria-label="YouTube"><Youtube size={18} /></a>
                </div>
            </div>
        </div>
    );
};

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
        icon: Users,
        cardClass: 'rw-service-card-white'
    },
    {
        title: 'Stress Management',
        desc: 'Body-based tools to regulate your nervous system and reclaim calm.',
        icon: Activity,
        cardClass: 'rw-service-card-peach'
    },
    {
        title: 'Mind Rewiring Sessions',
        desc: 'Shift the core beliefs and thought loops that keep you stuck.',
        icon: Brain,
        cardClass: 'rw-service-card-sand'
    },
    {
        title: 'Emotional Healing',
        desc: 'Process grief and emotional pain through trauma-informed care.',
        icon: Heart,
        cardClass: 'rw-service-card-white'
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
            'Yes. Online and in-person sessions are available in Gujarati, English and Hindi, depending on your comfort and schedule.'
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

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);
    const [latestBlogs, setLatestBlogs] = useState<BlogPost[]>([]);
    const [blogsLoading, setBlogsLoading] = useState(true);
    const [activeHeroSlide, setActiveHeroSlide] = useState<number>(0);

    const currentHeroSlide = heroSlides[activeHeroSlide];

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
            } catch {
                if (!canceled) setLatestBlogs([]);
            } finally {
                if (!canceled) setBlogsLoading(false);
            }
        };

        void fetchLatestBlogs();
        return () => {
            canceled = true;
        };
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
        }, 6500);

        return () => {
            window.clearInterval(intervalId);
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
        <div className="rw-home">

            {/* ── HERO ── */}
            <div className="rw-hero">
                <HomeNavbar />
                <div className="rw-hero-panel">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentHeroSlide.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="rw-hero-animated-wrapper"
                            style={{ display: 'flex', flexDirection: 'inherit', gap: 'inherit', width: '100%', alignItems: 'center' }}
                        >
                            <div className="rw-hero-copy">
                                <p className="rw-eyebrow">{currentHeroSlide.eyebrow}</p>
                            <h1>
                                {currentHeroSlide.lineOne}
                                <span>{currentHeroSlide.lineTwo}</span>
                            </h1>
                            <p className="rw-hero-sub">
                                {currentHeroSlide.description}
                            </p>
                            <div className="rw-hero-actions">
                                <button
                                    type="button"
                                    className="rw-btn-solid"
                                    onClick={() => navigate(currentHeroSlide.primaryPath)}
                                >
                                    {currentHeroSlide.primaryLabel}
                                </button>
                                {currentHeroSlide.secondaryLabel && currentHeroSlide.secondaryPath && (
                                    <button
                                        type="button"
                                        className="rw-btn-outline"
                                        onClick={() => navigate(currentHeroSlide.secondaryPath)}
                                    >
                                        {currentHeroSlide.secondaryLabel}
                                    </button>
                                )}
                            </div>
                            <div className="rw-hero-stats">
                                {heroStats.map((stat) => (
                                    <div key={stat.label}>
                                        <div className="rw-stat-value">{stat.value}</div>
                                        <div className="rw-stat-label">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rw-hero-right">
                            <div className="rw-hero-card">
                                <div className="rw-card-visual" aria-hidden="true" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                    <img
                                        src={currentHeroSlide.imageUrl}
                                        alt={currentHeroSlide.panelTitle}
                                        className="rw-card-image"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <h3>{currentHeroSlide.panelTitle}</h3>
                                <p>
                                    {currentHeroSlide.panelBody}
                                </p>
                                <div className="rw-tag-row">
                                    {currentHeroSlide.tags.map((tag) => (
                                        <span key={tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>

                        </div>
                        </motion.div>
                    </AnimatePresence>
                    <div className="rw-hero-slider-nav" aria-label="Hero slider controls">
                        <div className="rw-hero-dots">
                                {heroSlides.map((slide, index) => (
                                    <button
                                        type="button"
                                        key={slide.id}
                                        className={`rw-hero-dot ${index === activeHeroSlide ? 'active' : ''}`}
                                        aria-label={`Go to ${slide.primaryLabel} slide`}
                                        onClick={() => setActiveHeroSlide(index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
            </div>

            {/* ── TICKER ── */}
            <div className="rw-ticker" aria-hidden="true">
                <div className="rw-ticker-track">
                    {[...tickerItems, ...tickerItems].map((item, index) => (
                        <span className="rw-ticker-item" key={`${item}-${index}`}>
                            <span className="rw-dot"></span>
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── WHAT WE ADDRESS ── */}
            <section className="rw-section rw-challenges">
                <Reveal className="rw-section-head rw-center">
                    <p className="rw-kicker">What We Address</p>
                    <h2>
                        Mental Health Challenges
                        <span>We Navigate Together</span>
                    </h2>
                    <p className="rw-section-desc">
                        Understanding the root of your experience is the first step toward
                        meaningful and lasting change.
                    </p>
                </Reveal>

                <div className="rw-challenge-grid">
                    {challengeCards.map((card, index) => (
                        <Reveal
                            className="rw-challenge-card"
                            key={card.title}
                            delayMs={index * 70}
                            style={{
                                backgroundImage: `linear-gradient(150deg, rgba(0,55,62,0.30), rgba(0,55,62,0.65)), url(${card.imageUrl})`
                            }}
                        >
                            <h3>{card.title}</h3>
                            <p>{card.desc}</p>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ── SERVICES ── */}
            <section className="rw-section rw-services">
                <Reveal className="rw-section-head">
                    <p className="rw-kicker">What We Offer</p>
                    <h2>
                        Your Path to
                        <span>Well-being</span>
                    </h2>
                    <p className="rw-section-desc">
                        Discover expert guidance for a healthier mind and balanced life.
                    </p>
                </Reveal>

                <div className="rw-services-grid">
                    <Reveal className="rw-service-featured" delayMs={50}>
                        <div className="rw-featured-badge">1:1</div>
                        <div>
                            <p className="rw-kicker">Signature Care</p>
                            <h3>Individual Counseling</h3>
                            <p>
                                A private and grounded space to work through anxiety,
                                depression, trauma, and identity patterns using structured and
                                compassionate therapeutic methods.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rw-btn-featured"
                            onClick={() => navigate('/appointment')}
                        >
                            Book Sessions
                        </button>
                    </Reveal>

                    {serviceCards.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <Reveal
                                className={`rw-service-card ${service.cardClass}`}
                                key={service.title}
                                delayMs={100 + index * 60}
                            >
                                <div className="rw-service-icon" aria-hidden="true">
                                    <Icon size={24} strokeWidth={2.1} />
                                </div>
                                <h4>{service.title}</h4>
                                <p>{service.desc}</p>
                            </Reveal>
                        );
                    })}
                </div>
            </section>

            {/* ── JOURNEY + FAQ ── */}
            <section className="rw-section">
                <div className="rw-journey-wrap">
                    <Reveal className="rw-journey-copy">
                        <p className="rw-kicker">Your Journey</p>
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
                            className="rw-btn-dark"
                            onClick={() => navigate('/appointment')}
                        >
                            Book Sessions
                        </button>
                    </Reveal>

                    <Reveal delayMs={120}>
                        <div className="rw-faq-list">
                            {faqItems.map((item, index) => {
                                const isOpen = index === openFaqIndex;
                                return (
                                    <article
                                        className={`rw-faq-item${isOpen ? ' open' : ''}`}
                                        key={item.question}
                                    >
                                        <button
                                            type="button"
                                            className="rw-faq-question"
                                            aria-expanded={isOpen}
                                            onClick={() =>
                                                setOpenFaqIndex((prev) => (prev === index ? -1 : index))
                                            }
                                        >
                                            <span>{item.question}</span>
                                            <span
                                                className="rw-faq-toggle"
                                                aria-hidden="true"
                                            >
                                                {isOpen
                                                    ? <ChevronUp size={18} />
                                                    : <ChevronDown size={18} />
                                                }
                                            </span>
                                        </button>
                                        <div className="rw-faq-answer">{item.answer}</div>
                                    </article>
                                );
                            })}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── LATEST BLOGS ── */}
            <section className="rw-section rw-insights-section">
                <Reveal className="rw-section-head rw-center">
                    <p className="rw-kicker">Latest Insights</p>
                    <h2>
                        Thoughts on Mental Wellness
                        <span>for Everyday Life</span>
                    </h2>
                </Reveal>

                {blogsLoading ? (
                    <p className="rw-insights-empty">Loading latest blogs…</p>
                ) : latestBlogs.length === 0 ? (
                    <p className="rw-insights-empty">Latest blogs will appear here shortly.</p>
                ) : (
                    <div className="rw-insights-grid">
                        {featuredBlog && (
                            <Reveal className="rw-insight-featured" delayMs={80}>
                                <div className="rw-insight-cover">
                                    {featuredBlog.image_url ? (
                                        <img
                                            src={resolveMediaUrl(featuredBlog.image_url)}
                                            alt={featuredBlog.title}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <span className="rw-insight-cover-placeholder">Latest Blog</span>
                                    )}
                                </div>
                                <div className="rw-insight-body">
                                    <h3>{featuredBlog.title}</h3>
                                    <p>{getExcerpt(featuredBlog.content, 200)}</p>
                                    <button
                                        type="button"
                                        className="rw-insight-readmore"
                                        onClick={() => navigate('/blogs')}
                                    >
                                        Read more
                                    </button>
                                </div>
                            </Reveal>
                        )}

                        <div className="rw-insight-list">
                            {listBlogs.map((item, index) => {
                                const thumb = resolveMediaUrl(item.image_url || '');
                                return (
                                    <Reveal
                                        className="rw-insight-item"
                                        key={item.id}
                                        delayMs={130 + index * 60}
                                    >
                                        <div className="rw-insight-thumb-wrap">
                                            {thumb ? (
                                                <img
                                                    src={thumb}
                                                    alt={item.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="rw-insight-thumb-image"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="rw-insight-content">
                                            <p className="rw-insight-tag">Latest Blog</p>
                                            <h4>{item.title}</h4>
                                            <p className="rw-insight-snippet">
                                                {getExcerpt(item.content, 110)}
                                            </p>
                                            <button
                                                type="button"
                                                className="rw-insight-readmore"
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
            </section>

            {/* ── BOOK SESSION ── */}
            <section className="rw-section rw-appointment-section" id="book-session">
                <Reveal className="rw-section-head rw-center">
                    <p className="rw-kicker">Take the First Step</p>
                    <h2>
                        Book Your <span>Session</span>
                    </h2>
                </Reveal>
                <AppointmentForm isRefactoredDesign={true} />
            </section>

        </div>
    );
};

export default Home;
