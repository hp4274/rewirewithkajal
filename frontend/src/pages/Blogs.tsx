import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText, sanitizeBlogHtml } from '../utils/blogContent';
import { getCollectionItems } from '../utils/collections';

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

const formatCategory = (category?: string) => {
    if (!category) return 'Reflections';
    const normalized = category.replace(/[-_]+/g, ' ').trim();
    if (!normalized) return 'Reflections';
    return normalized
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

const Blogs: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeBlog, setActiveBlog] = useState<Blog | null>(null);
    const [activeTopic, setActiveTopic] = useState<string>(ALL_TOPICS);

    // Filter categories that exist dynamically, but also static topics
    // If backend returns distinct categories we could merge them.
    // For now we'll stick to static to mimic the HTML
    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const fetchBlogs = async () => {
            setLoadError(null);
            try {
                const response = await requestWithApiFallback(() =>
                    axios.get(apiUrl('/api/blogs/public?limit=24&page=1'), {
                        timeout: 12000,
                        signal: controller.signal
                    })
                );
                if (!isMounted) return;
                setBlogs(getCollectionItems<Blog>(response.data));
            } catch (error: any) {
                if (!isMounted || error?.name === 'CanceledError') return;
                console.error('Error fetching blogs:', error);
                setBlogs([]);
                const status = Number(error?.response?.status || 0);
                setLoadError(status ? 'Could not load blog posts right now.' : 'Blog request timed out. Please refresh and try again.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchBlogs();

        return () => {
            isMounted = false;
            controller.abort();
        };
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
        return <div className="rb-page-wrapper rbv2" style={{ paddingTop: '100px', textAlign: 'center', minHeight: '100vh', background: 'var(--rb-cream)' }}>Loading mind-expanding insights...</div>;
    }

    const filteredBlogs = activeTopic === ALL_TOPICS 
        ? blogs 
        : blogs.filter(b => b.category && b.category.toLowerCase().includes(activeTopic.toLowerCase()));

    const featuredBlog = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
    const remainingBlogs = filteredBlogs.length > 1 ? filteredBlogs.slice(1) : [];

    const getBlogImageStyle = (index: number) => {
        return "rb-blog-card rb-reveal rb-d1";
    };

    return (
        <div className="rb-page-wrapper rbv2">
            

            {/* HERO SECTION */}
            <header className="rb-blog-hero">
                <div className="rb-blog-hero-bg">
                    <div style={{ position: 'relative', zIndex: 8, paddingTop: '12px', paddingLeft: '18px' }}>
                <Link to="/" className="rbv2-home-link" aria-label="Back to home page">
                    <span className="rbv2-home-link-arrow" aria-hidden="true"><ChevronLeft size={16} strokeWidth={2.4} /></span>
                    <span>Back to Home</span>
                </Link>
            </div>
                    <div className="rb-blog-hero-blob"></div>
                    <div className="rb-blog-hero-blob"></div>
                    <div className="rb-blog-hero-blob"></div>
                </div>
                <div className="rb-blog-hero-content"   >
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
            </header>

            {filteredBlogs.length === 0 ? (
                <div className="rb-featured-section" style={{ textAlign: 'center', paddingBottom: '10rem' }}>
                    <div className="rb-reveal">{loadError || 'More insights are coming soon.'}</div>
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
                                        <div className="rb-featured-cat-badge">{formatCategory(featuredBlog.category)}</div>
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
                                                    <div className="rb-blog-card-cat">{formatCategory(blog.category)}</div>
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
                <div className="rb-modal-overlay" onClick={() => setActiveBlog(null)}>
                    <article className="rb-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="rb-modal-close"
                            aria-label="Close article preview"
                            onClick={() => setActiveBlog(null)}
                        >
                            ×
                        </button>

                        <div className="rb-modal-head">
                            <div className="rb-modal-topic">{formatCategory(activeBlog.category)}</div>
                            <h2 className="rb-modal-title">{activeBlog.title}</h2>
                            <div className="rb-modal-meta">
                                {new Date(activeBlog.created_at).toLocaleDateString()} · {activeBlog.reading_time || '5 min read'}
                            </div>
                        </div>

                        {activeBlog.image_url && (
                            <img
                                src={resolveMediaUrl(activeBlog.image_url)}
                                alt={activeBlog.title}
                                className="rb-modal-image"
                            />
                        )}

                        <div
                            className="blog-rich-content rb-modal-content"
                            dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(activeBlog.content) }}
                        />
                    </article>
                </div>
            )}
        </div>
    );
};

export default Blogs;
