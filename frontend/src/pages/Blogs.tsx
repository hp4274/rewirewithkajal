import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../assets/logo3.png';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText, sanitizeBlogHtml } from '../utils/blogContent';
import { getCollectionItems } from '../utils/collections';

interface Blog {
    id: number;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
}

const Blogs: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeBlog, setActiveBlog] = useState<Blog | null>(null);

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

    if (loading) return <div className="container text-center" style={{ paddingTop: '100px' }}>Loading amazing thoughts...</div>;

    const featuredBlog = blogs.length > 0 ? blogs[0] : null;
    const remainingBlogs = blogs.length > 1 ? blogs.slice(1) : [];
    const featuredImageUrl = featuredBlog ? resolveMediaUrl(featuredBlog.image_url) : '';
    const featuredPlainText = featuredBlog ? blogContentToPlainText(featuredBlog.content) : '';

    const activeBlogImageUrl = activeBlog ? resolveMediaUrl(activeBlog.image_url) : '';
    const activeBlogSafeHtml = activeBlog ? sanitizeBlogHtml(activeBlog.content) : '';

    return (
        <main className="blogs-page container fade-in" style={{ paddingTop: '100px' }}>
            <div className="blogs-header text-center reveal active">
                <h2>Mental Wealth Blog</h2>
                <p className="subtitle">Insights, experiences, and professional guidance.</p>
            </div>

            {blogs.length === 0 ? (
                <div className="no-blogs reveal active">More insights are coming soon.</div>
            ) : (
                <div className="blogs-content-wrapper">
                    {/* Featured Top Blog - Landscape */}
                    {featuredBlog && (
                        <div className="featured-blog reveal active">
                            <div className="featured-image" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center', width: '100%', height: '300px', overflow: 'hidden', borderRadius: '8px' }}>
                                <img
                                    src={featuredImageUrl || logo}
                                    alt={featuredBlog.title}
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                    style={featuredImageUrl ? { width: '100%', height: '100%', objectFit: 'cover' } : { height: '120px', width: 'auto', objectFit: 'contain' }}
                                    onError={(e) => { e.currentTarget.src = logo; }}
                                />
                            </div>
                            <div className="featured-content">
                                <span className="blog-date">{new Date(featuredBlog.created_at).toLocaleDateString()}</span>
                                <h3>{featuredBlog.title}</h3>
                                <p className="line-clamp-3">{featuredPlainText}</p>
                                <button
                                    className="btn-primary read-more-btn"
                                    onClick={() => setActiveBlog(featuredBlog)}
                                >
                                    Read Full Article
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Remaining Blogs - Masonry Grid */}
                    {remainingBlogs.length > 0 && (
                        <div className="blogs-masonry reveal active">
                            {remainingBlogs.map(blog => {
                                const blogImageUrl = resolveMediaUrl(blog.image_url);
                                const plainTextContent = blogContentToPlainText(blog.content);
                                return (
                                    <article key={blog.id} className="blog-card masonry-item">
                                        <div className="blog-image" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', width: '100%', height: '200px', overflow: 'hidden', borderRadius: '8px', paddingTop: blogImageUrl ? '0' : '20px' }}>
                                            <img
                                                src={blogImageUrl || logo}
                                                alt={blog.title}
                                                loading="lazy"
                                                decoding="async"
                                                style={blogImageUrl ? { width: '100%', height: '100%', objectFit: 'cover' } : { height: '80px', width: 'auto', objectFit: 'contain' }}
                                                onError={(e) => { e.currentTarget.src = logo; }}
                                            />
                                        </div>
                                        <div className="blog-content">
                                            <span className="blog-date">{new Date(blog.created_at).toLocaleDateString()}</span>
                                            <h3>{blog.title}</h3>
                                            <p className="line-clamp-3">{plainTextContent}</p>
                                            <button
                                                className="btn-secondary read-more-btn"
                                                onClick={() => setActiveBlog(blog)}
                                            >
                                                Read Article
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeBlog && (
                <div className="blog-modal-overlay" onClick={() => setActiveBlog(null)}>
                    <article className="blog-modal" onClick={(e) => e.stopPropagation()}>
                        <header className="blog-modal-header">
                            <div>
                                <span className="blog-date">{new Date(activeBlog.created_at).toLocaleDateString()}</span>
                                <h3>{activeBlog.title}</h3>
                            </div>
                            <button className="blog-modal-close" onClick={() => setActiveBlog(null)} aria-label="Close article">
                                x
                            </button>
                        </header>

                        <div className="blog-modal-body">
                            {activeBlogImageUrl && (
                                <div className="blog-modal-image-wrap">
                                    <img
                                        src={activeBlogImageUrl}
                                        alt={activeBlog.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="blog-modal-image"
                                        onError={(e) => { e.currentTarget.src = logo; }}
                                    />
                                </div>
                            )}

                            <div className="blog-modal-content blog-rich-content" dangerouslySetInnerHTML={{ __html: activeBlogSafeHtml }} />
                        </div>
                    </article>
                </div>
            )}
        </main>
    );
};

export default Blogs;
