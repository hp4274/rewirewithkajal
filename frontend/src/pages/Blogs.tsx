import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText } from '../utils/blogContent';
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
    const [activeTopic, setActiveTopic] = useState<string>(ALL_TOPICS);
    const navigate = useNavigate();

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
        return <div className="abt2-wrapper" style={{ paddingTop: '100px', textAlign: 'center', minHeight: '100vh' }}>Loading mind-expanding insights...</div>;
    }

    const filteredBlogs = activeTopic === ALL_TOPICS
        ? blogs
        : blogs.filter(b => b.category && b.category.toLowerCase().includes(activeTopic.toLowerCase()));

    const featuredBlog = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
    const remainingBlogs = filteredBlogs.length > 1 ? filteredBlogs.slice(1) : [];

    return (
        <div className="abt2-wrapper">

            {/* HEADER SECTION */}
            <div style={{
                position: 'relative',
                zIndex: 8,
                paddingTop: '12px',
                paddingLeft: '18px',
                paddingRight: '18px',
                paddingBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    <Link to="/" className="abt2-home-link" aria-label="Back to home page" style={{ margin: 0 }}>
                        <span className="abt2-home-link-arrow" aria-hidden="true"><ChevronLeft size={16} strokeWidth={2.4} /></span>
                        <span>Back to Home</span>
                    </Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', maxWidth: '100%' }}>
                    <div className="blog-premium-filters rb-reveal" style={{ maxWidth: '100%', width: 'max-content' }}>
                        {TOPICS.map(topic => (
                            <button
                                key={topic}
                                className={`blog-premium-filter-pill ${activeTopic === topic ? 'active' : ''}`}
                                onClick={() => setActiveTopic(topic)}
                                style={{ flexShrink: 0 }}
                            >
                                {topic === 'All Topics' ? 'All Posts' : topic}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1 }}></div>
            </div>

            {filteredBlogs.length === 0 ? (
                <div className="rb-featured-section" style={{ textAlign: 'center', paddingBottom: '10rem' }}>
                    <div className="rb-reveal">{loadError || 'More insights are coming soon.'}</div>
                </div>
            ) : (
                <>
                    {/* FEATURED POST */}
                    {featuredBlog && (
                        <section className="blog-premium-featured-section">
                            <div className="blog-premium-featured-inner">
                                <div className="blog-premium-featured-label rb-reveal">Featured Article</div>
                                <a href={`/blogs/${featuredBlog.id}`} className="blog-premium-featured-card rb-reveal" onClick={(e) => { e.preventDefault(); navigate(`/blogs/${featuredBlog.id}`); }}>
                                    <div className="blog-premium-featured-img">
                                        {featuredBlog.image_url ? (
                                            <img src={resolveMediaUrl(featuredBlog.image_url)} alt={featuredBlog.title} />
                                        ) : (
                                            <div className="blog-premium-img-emoji">🧠</div>
                                        )}
                                        <div className="blog-premium-cat-badge">{formatCategory(featuredBlog.category)}</div>
                                    </div>
                                    <div className="blog-premium-featured-body">
                                        <div className="blog-premium-date-time">
                                            {new Date(featuredBlog.created_at).toLocaleDateString()} &middot; {featuredBlog.reading_time || '5 min read'}
                                        </div>
                                        <div className="blog-premium-featured-title">{featuredBlog.title}</div>
                                        <div className="blog-premium-featured-excerpt">
                                            {featuredBlog.excerpt || blogContentToPlainText(featuredBlog.content).substring(0, 160) + '...'}
                                        </div>
                                        <div className="blog-premium-featured-footer">
                                            <div className="blog-premium-author">
                                                <div className="blog-premium-author-avatar">K</div>
                                                <div className="blog-premium-author-info">
                                                    <strong>Kajal</strong>
                                                    <span>Licensed Therapist</span>
                                                </div>
                                            </div>
                                            <span className="blog-premium-read-btn">Read Article <span className="arrow">&rarr;</span></span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </section>
                    )}

                    {/* BLOG GRID */}
                    {remainingBlogs.length > 0 && (
                        <section className="blog-premium-grid-section">
                            <div className="blog-premium-grid-inner">
                                <div className="blog-premium-grid-header rb-reveal">
                                    <h2 className="blog-premium-grid-title">More <em>Insights</em></h2>
                                </div>
                                <div className="blog-premium-grid">
                                    {remainingBlogs.map((blog, index) => {
                                        const backgrounds = [
                                            '#F4E8DB', '#E6EBE0', '#EAE6EB', '#F1EDEE', '#E3ECE9', '#F0E6DD'
                                        ];
                                        const emojis = ['💡', '🌿', '✨', '🤍', '🌱', '🕊️'];

                                        return (
                                            <a href={`/blogs/${blog.id}`} key={blog.id} className="blog-premium-card rb-reveal" onClick={(e) => { e.preventDefault(); navigate(`/blogs/${blog.id}`); }}>
                                                <div className="blog-premium-card-img" style={{ background: blog.image_url ? '#FAF3EC' : backgrounds[index % backgrounds.length] }}>
                                                    {blog.image_url ? (
                                                        <img src={resolveMediaUrl(blog.image_url)} alt={blog.title} loading="lazy" />
                                                    ) : (
                                                        <div className="blog-premium-emoji-fallback" style={{ fontSize: '3rem' }}>{emojis[index % emojis.length]}</div>
                                                    )}
                                                    <div className="blog-premium-card-cat">{formatCategory(blog.category)}</div>
                                                </div>
                                                <div className="blog-premium-card-body">
                                                    <div className="blog-premium-card-meta">
                                                        {new Date(blog.created_at).toLocaleDateString()} &middot; {blog.reading_time || '5 min read'}
                                                    </div>
                                                    <h3 className="blog-premium-card-title">{blog.title}</h3>
                                                    <p className="blog-premium-card-excerpt">
                                                        {blog.excerpt || blogContentToPlainText(blog.content).substring(0, 110) + '...'}
                                                    </p>
                                                    <div className="blog-premium-card-footer">
                                                        <span className="blog-premium-card-author">By Kajal</span>
                                                        <span className="blog-premium-card-arrow">&rarr;</span>
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
        </div>
    );
};

export default Blogs;
