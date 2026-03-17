import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText, sanitizeBlogHtml } from '../utils/blogContent';
import { getCollectionItems } from '../utils/collections';
import logo from '../assets/logo3.png';
import '../styles/blog-redesign.css';

interface Blog {
    id: number;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
    category?: string;
    excerpt?: string;
    reading_time?: string;
}

const ALL_TOPICS = "All Topics";
const TOPICS = [
    ALL_TOPICS,
    "Anxiety",
    "Relationships",
    "Self-Growth",
    "Trauma",
    "Mindfulness"
];

const Blogs: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeBlog, setActiveBlog] = useState<Blog | null>(null);
    const [activeTopic, setActiveTopic] = useState<string>(ALL_TOPICS);

    // Filter categories that exist dynamically, but also static topics
    // If backend returns distinct categories we could merge them.
    // For now we'll stick to static to mimic the HTML
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await requestWithApiFallback(() => axios.get(apiUrl('/api/blogs/public?limit=24&page=1')));
                setBlogs(getCollectionItems<Blog>(response.data));
            } catch (error) {
                console.error('Error fetching blogs:', error);
                setBlogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    // Reveal Animation effect on mount and category change
    useEffect(() => {
        const reveals = document.querySelectorAll('.rb-reveal');
        reveals.forEach(el => el.classList.remove('visible'));
        
        setTimeout(() => {
            reveals.forEach(el => el.classList.add('visible'));
        }, 150);
    }, [activeTopic, loading]);

    if (loading) {
        return <div className="rb-page-wrapper" style={{ paddingTop: '100px', textAlign: 'center', minHeight: '100vh', background: 'var(--rb-cream)' }}>Loading mind-expanding insights...</div>;
    }

    const filteredBlogs = activeTopic === ALL_TOPICS 
        ? blogs 
        : blogs.filter(b => b.category && b.category.toLowerCase().includes(activeTopic.toLowerCase()));

    const featuredBlog = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
    const remainingBlogs = filteredBlogs.length > 1 ? filteredBlogs.slice(1) : [];

    const getBlogImageStyle = (index: number) => {
        if (index % 5 === 0) return "rb-blog-card wide rb-reveal rb-d1";
        if (index % 4 === 0) return "rb-blog-card dark rb-reveal rb-d2";
        if (index % 3 === 0) return "rb-blog-card sand-bg rb-reveal rb-d3";
        return "rb-blog-card rb-reveal rb-d1";
    };

    return (
        <div className="rb-page-wrapper">
            {/* HERO SECTION */}
            <header className="rb-blog-hero">
                <div className="rb-blog-hero-bg">
                    <div className="rb-blog-hero-blob"></div>
                    <div className="rb-blog-hero-blob"></div>
                    <div className="rb-blog-hero-blob"></div>
                </div>
                <div className="rb-blog-hero-content">
                    <div className="rb-blog-eyebrow">
                        <span className="rb-blog-eyebrow-line"></span>
                        Mental Wellness Insights
                        <span className="rb-blog-eyebrow-line"></span>
                    </div>
                    <h1 className="rb-blog-hero-title">The <em>Rewire</em> Blog</h1>
                    <p className="rb-blog-hero-sub">Honest, research-backed writing on anxiety, healing, relationships, and the everyday art of taking care of your mind.</p>
                    
                    <div className="rb-blog-filters rb-reveal">
                        {TOPICS.map(topic => (
                            <button 
                                key={topic}
                                className={`rb-filter-pill ${activeTopic === topic ? 'active' : ''}`}
                                onClick={() => setActiveTopic(topic)}
                            >
                                {topic === 'All Topics' ? 'All Posts' : topic}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="rb-blog-hero-wave">
                    <svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
                        <path d="M0,50 C400,100 1000,0 1440,50 L1440,100 L0,100 Z" fill="#FFFCF8"/>
                    </svg>
                </div>
            </header>

            {filteredBlogs.length === 0 ? (
                <div className="rb-featured-section" style={{ textAlign: 'center', paddingBottom: '10rem' }}>
                    <div className="rb-reveal">More insights are coming soon.</div>
                </div>
            ) : (
                <>
                    {/* FEATURED POST */}
                    {featuredBlog && (
                        <section className="rb-featured-section">
                            <div className="rb-featured-inner">
                                <div className="rb-featured-label rb-reveal">Featured Article</div>
                                <a href="#!" className="rb-featured-card rb-reveal rb-d1" onClick={(e) => { e.preventDefault(); setActiveBlog(featuredBlog); }}>
                                    <div className="rb-featured-img">
                                        {featuredBlog.image_url ? (
                                            <img src={resolveMediaUrl(featuredBlog.image_url)} alt={featuredBlog.title} />
                                        ) : (
                                            <div className="rb-featured-img-emoji">🧠</div>
                                        )}
                                        <div className="rb-featured-img-overlay"></div>
                                        <div className="rb-featured-cat-badge">{featuredBlog.category || 'Therapy'}</div>
                                        <div className="rb-featured-reading-time">{featuredBlog.reading_time || '5 min read'}</div>
                                    </div>
                                    <div className="rb-featured-body">
                                        <div className="rb-featured-date">{new Date(featuredBlog.created_at).toLocaleDateString()}</div>
                                        <div className="rb-featured-title">{featuredBlog.title}</div>
                                        <div className="rb-featured-excerpt">
                                            {featuredBlog.excerpt || blogContentToPlainText(featuredBlog.content).substring(0, 150) + '...'}
                                        </div>
                                        <div className="rb-featured-footer">
                                            <div className="rb-author-chip">
                                                <div className="rb-author-avatar">K</div>
                                                <div>
                                                    <div className="rb-author-name">Kajal</div>
                                                    <div className="rb-author-role">Licensed Therapist</div>
                                                </div>
                                            </div>
                                            <button className="rb-read-btn">Read Full Article <span className="rb-read-btn-arrow">→</span></button>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </section>
                    )}

                    {/* BLOG GRID */}
                    {remainingBlogs.length > 0 && (
                        <section className="rb-blog-grid-section">
                            <div className="rb-blog-grid-inner">
                                <div className="rb-blog-grid-header rb-reveal">
                                    <div className="rb-grid-label">More <em>Articles</em></div>
                                </div>
                                <div className="rb-blog-grid">
                                    {remainingBlogs.map((blog, index) => {
                                        // Some pseudo-random colors for the missing images
                                        const gradients = [
                                            'linear-gradient(145deg,#A8C8D8,#6898B8)',
                                            'linear-gradient(145deg,#6B5040,#3B2E24)',
                                            'linear-gradient(145deg,#D8B0C0,#A87888)',
                                            'linear-gradient(145deg,#C8D8B0,#88A868)',
                                            'linear-gradient(145deg,#B8D0C0,#78A888)',
                                            'linear-gradient(145deg,#F4C090,#D08050)'
                                        ];
                                        const emojis = ['🔌', '🌊', '💞', '🪞', '🌱', '✨'];
                                        
                                        return (
                                            <a href="#!" key={blog.id} className={getBlogImageStyle(index + 1)} onClick={(e) => { e.preventDefault(); setActiveBlog(blog); }}>
                                                <div className="rb-blog-card-img" style={{ background: blog.image_url ? '#FAF3EC' : gradients[index % gradients.length] }}>
                                                    {blog.image_url ? (
                                                        <img src={resolveMediaUrl(blog.image_url)} alt={blog.title} />
                                                    ) : (
                                                        <div style={{fontSize: '3.5rem', color: 'white'}}>{emojis[index % emojis.length]}</div>
                                                    )}
                                                    <div className="rb-blog-card-cat">{blog.category || 'Reflections'}</div>
                                                </div>
                                                <div className="rb-blog-card-body">
                                                    <div className="rb-blog-card-date">{new Date(blog.created_at).toLocaleDateString()} · {blog.reading_time || '5 min read'}</div>
                                                    <div className="rb-blog-card-title">{blog.title}</div>
                                                    <div className="rb-blog-card-excerpt">
                                                        {blog.excerpt || blogContentToPlainText(blog.content).substring(0, 100) + '...'}
                                                    </div>
                                                    <div className="rb-blog-card-footer">
                                                        <span className="rb-blog-card-read">By Kajal</span>
                                                        <span className="rb-blog-card-arrow">→</span>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* QUICK MODAL VIEW FOR READING */}
            {activeBlog && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(59,46,36,0.9)', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
                }} onClick={() => setActiveBlog(null)}>
                    <article style={{
                        background: 'var(--rb-cream)', borderRadius: '24px', maxWidth: '800px', width: '100%', 
                        maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.3)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setActiveBlog(null)} style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent',
                            border: '1px solid rgba(59,46,36,0.2)', borderRadius: '50%', width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                            cursor: 'pointer', color: 'var(--rb-brown)', transition: 'all 0.3s'
                        }}>×</button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ color: 'var(--rb-amber)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                                {activeBlog.category || 'Therapy'}
                            </div>
                            <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', color: 'var(--rb-brown)', lineHeight: '1.2', marginBottom: '1rem' }}>
                                {activeBlog.title}
                            </h2>
                            <div style={{ color: 'var(--rb-text-muted)', fontSize: '0.9rem' }}>
                                {new Date(activeBlog.created_at).toLocaleDateString()} · {activeBlog.reading_time || '5 min read'}
                            </div>
                        </div>

                        {activeBlog.image_url && (
                            <img src={resolveMediaUrl(activeBlog.image_url)} alt={activeBlog.title} 
                                style={{ width: '100%', height: 'auto', borderRadius: '16px', marginBottom: '2rem', objectFit: 'cover', maxHeight: '400px' }} />
                        )}

                        <div className="blog-rich-content" dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(activeBlog.content) }} 
                            style={{ lineHeight: '1.8', color: 'var(--rb-brown)', fontSize: '1.1rem', fontFamily: 'var(--bs-body-font-family)' }} />
                    </article>
                </div>
            )}
        </div>
    );
};

export default Blogs;
