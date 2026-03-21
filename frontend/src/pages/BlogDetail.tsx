import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Clock, Calendar, User } from 'lucide-react';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { sanitizeBlogHtml } from '../utils/blogContent';
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
    const navigate = useNavigate();
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
            <div className="blog-detail-loading">
                <div className="blog-detail-loading-inner">Loading article...</div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="blog-detail-loading">
                <div className="blog-detail-loading-inner">
                    <p>{error || 'Article not found.'}</p>
                    <Link to="/blogs" className="blog-detail-back-link">← Back to Blog</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="blog-detail-page">
            {/* Nav */}
            <div className="blog-detail-topbar">
                <Link to="/blogs" className="blog-detail-back-link">
                    <ChevronLeft size={18} strokeWidth={2.5} />
                    <span>All Articles</span>
                </Link>
            </div>

            <article className="blog-detail-article">
                {/* Article Header */}
                <header className="blog-detail-header">
                    <div className="blog-detail-category">{formatCategory(blog.category)}</div>
                    <h1 className="blog-detail-title">{blog.title}</h1>
                    {blog.excerpt && (
                        <p className="blog-detail-excerpt">{blog.excerpt}</p>
                    )}
                    <div className="blog-detail-meta">
                        <span className="blog-detail-meta-item">
                            <User size={14} />
                            Kajal · Licensed Therapist
                        </span>
                        <span className="blog-detail-meta-item">
                            <Calendar size={14} />
                            {new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {blog.reading_time && (
                            <span className="blog-detail-meta-item">
                                <Clock size={14} />
                                {blog.reading_time}
                            </span>
                        )}
                    </div>
                </header>

                {/* Hero Image */}
                {blog.image_url && (
                    <div className="blog-detail-hero-img">
                        <img src={resolveMediaUrl(blog.image_url)} alt={blog.title} />
                    </div>
                )}

                {/* Content */}
                <div
                    className="blog-detail-content blog-rich-content"
                    dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(blog.content) }}
                />

                {/* Footer */}
                <footer className="blog-detail-footer">
                    <Link to="/blogs" className="blog-detail-back-btn">
                        ← Back to all articles
                    </Link>
                </footer>
            </article>
        </div>
    );
};

export default BlogDetail;
