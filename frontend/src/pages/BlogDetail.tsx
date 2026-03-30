import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, Calendar, Share2, Facebook, Twitter, Linkedin, Bookmark } from 'lucide-react';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { sanitizeBlogHtml } from '../utils/blogContent';
import { getCollectionItems } from '../utils/collections';
import Reveal from '../components/Reveal';

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

const formatCategory = (category?: string) => {
    if (!category) return 'Reflections';
    const normalized = category.replace(/[-_]+/g, ' ').trim();
    if (!normalized) return 'Reflections';
    return normalized
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

const BlogDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const controller = new AbortController();

        const fetchBlog = async () => {
            try {
                const response = await requestWithApiFallback(() =>
                    axios.get(apiUrl(`/api/blogs/public?limit=100&page=1`), {
                        timeout: 12000,
                        signal: controller.signal,
                    })
                );
                const all = getCollectionItems<Blog>(response.data);
                const found = all.find((b) => String(b.id) === String(id));
                if (found) {
                    setBlog(found);
                } else {
                    setError('Article not found.');
                }
            } catch (err: any) {
                if (err?.name === 'CanceledError') return;
                setError('Could not load this article. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
        return () => controller.abort();
    }, [id]);

    if (loading) {
        return (
            <div className="premium-reader-loading">
                <style>{`
                    .premium-reader-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #faf9f4; color: #003527; font-family: 'Manrope', system-ui, sans-serif; font-size: 1.2rem; }
                `}</style>
                Curating article...
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="premium-reader-error">
                <style>{`
                    .premium-reader-error { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #faf9f4; color: #1b1c19; font-family: 'Manrope', system-ui, sans-serif; }
                    .premium-error-back { margin-top: 24px; color: #003527; text-decoration: none; font-weight: 600; padding: 10px 20px; border: 1px solid #bfc9c3; border-radius: 8px; transition: all 0.2s; }
                    .premium-error-back:hover { background: #003527; color: #fff; }
                `}</style>
                <p>{error || 'Article not found.'}</p>
                <Link to="/blogs" className="premium-error-back">← Return to Archive</Link>
            </div>
        );
    }

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
        <div className="premium-reader-wrapper">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;500;600;700&family=Manrope:wght@400;500;600&display=swap');

                .premium-reader-wrapper {
                    background-color: #faf9f4;
                    min-height: 100vh;
                    font-family: 'Manrope', system-ui, sans-serif;
                    color: #1b1c19;
                    position: relative;
                }

                .premium-reader-topbar {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 24px;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(191, 201, 195, 0.3);
                }

                .premium-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #003527;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }
                
                .premium-back-btn:hover {
                    opacity: 0.7;
                    transform: translateX(-4px);
                }

                .premium-reader-actions {
                    display: flex;
                    gap: 16px;
                }
                
                .premium-action-icon {
                    color: #57605d;
                    cursor: pointer;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                }
                
                .premium-action-icon:hover {
                    color: #003527;
                    background: rgba(0, 53, 39, 0.05);
                }

                .premium-hero {
                    width: 100%;
                    height: 55vh;
                    min-height: 450px;
                    max-height: 700px;
                    position: relative;
                    overflow: hidden;
                }

                .premium-hero img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .premium-article-container {
                    max-width: 840px;
                    margin: -100px auto 0;
                    position: relative;
                    z-index: 10;
                    padding: 0 24px 80px;
                }

                .premium-article-header {
                    background: #ffffff;
                    padding: 48px;
                    border-radius: 12px;
                    box-shadow: 0 24px 48px -12px rgba(27, 28, 25, 0.08);
                    text-align: center;
                    margin-bottom: 64px;
                }

                .premium-category-label {
                    display: inline-block;
                    color: #003527;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin-bottom: 24px;
                    background: #f5f4ef;
                    padding: 6px 14px;
                    border-radius: 99px;
                }

                .premium-title {
                    font-family: 'Newsreader', serif;
                    font-size: clamp(2.5rem, 5vw, 4rem);
                    font-weight: 600;
                    line-height: 1.15;
                    color: #003527;
                    margin: 0 0 32px 0;
                    letter-spacing: -0.02em;
                }
                
                .premium-excerpt {
                    font-size: 1.25rem;
                    line-height: 1.6;
                    color: #404944;
                    max-width: 600px;
                    margin: 0 auto 32px;
                    font-family: 'Newsreader', serif;
                    font-style: italic;
                }

                .premium-meta-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                    color: #57605d;
                    font-size: 0.95rem;
                    border-top: 1px solid #efeee9;
                    padding-top: 24px;
                }
                
                .premium-meta-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .premium-author-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #003527 0%, #064e3b 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-right: 4px;
                }

                /* Content specific stylings */
                .premium-content-body,
                .premium-content-body * {
                    word-break: normal !important;
                    overflow-wrap: normal !important;
                    word-wrap: normal !important;
                    hyphens: none !important;
                }

                .premium-content-body {
                    font-size: 1.125rem;
                    line-height: 1.85;
                    color: #1b1c19;
                }
                
                .premium-content-body p {
                    margin-bottom: 2em;
                }
                
                .premium-content-body h2 {
                    font-family: 'Newsreader', serif;
                    font-size: 2.2rem;
                    color: #003527;
                    margin: 2.5em 0 1em;
                    font-weight: 600;
                    line-height: 1.2;
                }

                .premium-content-body h3 {
                    font-family: 'Newsreader', serif;
                    font-size: 1.6rem;
                    color: #064e3b;
                    margin: 2em 0 0.8em;
                    font-weight: 600;
                }

                .premium-content-body ul, .premium-content-body ol {
                    margin-bottom: 2em;
                    padding-left: 1.5em;
                }

                .premium-content-body li {
                    margin-bottom: 0.5em;
                }
                
                .premium-content-body blockquote {
                    font-family: 'Newsreader', serif;
                    font-size: 1.6rem;
                    line-height: 1.4;
                    color: #6c5d31;
                    margin: 3em -24px 3em 0;
                    padding: 0 0 0 32px;
                    border-left: 4px solid #bdaa77;
                    font-style: italic;
                }

                .premium-content-body img {
                    border-radius: 8px;
                    margin: 2.5em 0;
                    width: 100%;
                    height: auto;
                    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
                }

                .premium-content-body a {
                    color: #003527;
                    text-decoration: none;
                    border-bottom: 1px solid #95d3ba;
                    transition: border-bottom-color 0.2s, background-color 0.2s;
                }

                .premium-content-body a:hover {
                    border-bottom-color: #003527;
                    background-color: rgba(0, 53, 39, 0.05);
                }

                .premium-reading-rail {
                    position: fixed;
                    left: 24px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 2px;
                    height: 200px;
                    background: rgba(191, 201, 195, 0.3);
                    display: none;
                }

                @media (min-width: 1200px) {
                    .premium-reading-rail {
                        display: block;
                    }
                }

                .premium-footer {
                    margin-top: 80px;
                    padding-top: 40px;
                    border-top: 1px solid #efeee9;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 32px;
                }

                .premium-share-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .premium-share-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: #f5f4ef;
                    color: #404944;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .premium-share-btn:hover {
                    background: #003527;
                    color: #fff;
                    transform: translateY(-2px);
                }

                .premium-next-btn {
                    padding: 16px 32px;
                    background: linear-gradient(135deg, #003527, #064e3b);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    transition: all 0.3s;
                    box-shadow: 0 12px 24px -8px rgba(0, 53, 39, 0.4);
                }

                .premium-next-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 32px -8px rgba(0, 53, 39, 0.5);
                }

                @media (max-width: 768px) {
                    .premium-hero { height: 40vh; min-height: 300px; }
                    .premium-article-container { margin-top: -60px; padding: 0 16px 60px; }
                    .premium-article-header { padding: 32px 20px; box-shadow: 0 12px 24px -6px rgba(27, 28, 25, 0.08); }
                    .premium-title { font-size: 2.2rem; margin-bottom: 24px; }
                    .premium-meta-row { flex-direction: column; gap: 12px; align-items: flex-start; }
                    .premium-content-body { font-size: 1.05rem; }
                    .premium-content-body blockquote { margin: 2em 0; font-size: 1.4rem; padding-left: 24px; border-left-width: 3px; }
                }
            `}</style>

            {/* Top Navigation */}
            <div className="premium-reader-topbar">
                <Link to="/blogs" className="premium-back-btn">
                    <ArrowLeft size={18} strokeWidth={2.5} />
                    <span>Archive</span>
                </Link>
                <div className="premium-reader-actions">
                    <div className="premium-action-icon" title="Share">
                        <Share2 size={18} />
                    </div>
                    <div className="premium-action-icon" title="Bookmark">
                        <Bookmark size={18} />
                    </div>
                </div>
            </div>

            {/* Hero Image */}
            <Reveal className="premium-hero" delayMs={100}>
                {blog.image_url ? (
                    <img src={resolveMediaUrl(blog.image_url)} alt={blog.title} />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: '#efeee9' }} />
                )}
            </Reveal>

            {/* Progress Rail for Desktop */}
            <div className="premium-reading-rail"></div>

            <main className="premium-article-container">
                {/* Article Header */}
                <Reveal delayMs={150}>
                    <header className="premium-article-header">
                        <div className="premium-category-label">{formatCategory(blog.category)}</div>
                        <h1 className="premium-title">{blog.title}</h1>
                        
                        {blog.excerpt && (
                            <p className="premium-excerpt">{blog.excerpt}</p>
                        )}

                        <div className="premium-meta-row">
                            <div className="premium-meta-item">
                                <div className="premium-author-avatar">K</div>
                                <span style={{ color: '#1b1c19', fontWeight: 600 }}>Kajal</span>
                                <span style={{ margin: '0 4px', color: '#bfc9c3' }}>|</span>
                                <span>Licensed Therapist</span>
                            </div>
                            <div className="premium-meta-item">
                                <Calendar size={15} />
                                {new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            {blog.reading_time && (
                                <div className="premium-meta-item">
                                    <Clock size={15} />
                                    {blog.reading_time}
                                </div>
                            )}
                        </div>
                    </header>
                </Reveal>

                {/* Content */}
                <Reveal delayMs={200}>
                    <article
                        className="premium-content-body blog-rich-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(blog.content) }}
                    />
                </Reveal>

                {/* Footer / Share Options */}
                <Reveal delayMs={100}>
                    <footer className="premium-footer">
                        <h3 style={{ fontFamily: 'Newsreader', color: '#003527', margin: 0, fontSize: '1.4rem' }}>Share this insight</h3>
                        <div className="premium-share-row">
                            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(blog.title)}`} target="_blank" rel="noopener noreferrer" className="premium-share-btn">
                                <Twitter size={18} />
                            </a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="premium-share-btn">
                                <Facebook size={18} />
                            </a>
                            <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(blog.title)}`} target="_blank" rel="noopener noreferrer" className="premium-share-btn">
                                <Linkedin size={18} />
                            </a>
                        </div>
                        
                        <Link to="/blogs" className="premium-next-btn">
                            Explore the Archive
                        </Link>
                    </footer>
                </Reveal>
            </main>
        </div>
    );
};

export default BlogDetail;
