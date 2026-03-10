import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomeBlogs.css';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo3.png';
import { apiUrl, requestWithApiFallback, resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText } from '../utils/blogContent';
import { getCollectionItems } from '../utils/collections';

interface Blog {
    id: number;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
}

const HomeBlogs: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await requestWithApiFallback(() => axios.get(apiUrl('/api/blogs/public?limit=6&page=1')));
                const incomingBlogs = getCollectionItems<Blog>(response.data);
                setBlogs(incomingBlogs.slice(0, 2));
            } catch (error) {
                console.error('Error fetching blogs:', error);
                setBlogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (loading) {
        return (
            <section className="home-blogs-section container" aria-busy="true" aria-live="polite">
                <div className="section-header text-center">
                    <h2>Latest Insights</h2>
                    <p className="subtitle">Loading latest insights...</p>
                </div>
                <div style={{ height: '220px', borderRadius: '16px', background: 'linear-gradient(90deg, #f5e8de 25%, #fff3ec 37%, #f5e8de 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite' }} />
            </section>
        );
    }
    if (blogs.length === 0) return null; // Don't show section if no blogs exist

    const latestBlog = blogs[0];
    const secondLatestBlog = blogs.length > 1 ? blogs[1] : null;
    const latestImageUrl = latestBlog ? resolveMediaUrl(latestBlog.image_url) : '';
    const secondLatestImageUrl = secondLatestBlog ? resolveMediaUrl(secondLatestBlog.image_url) : '';
    const latestExcerpt = latestBlog ? blogContentToPlainText(latestBlog.content) : '';
    const secondExcerpt = secondLatestBlog ? blogContentToPlainText(secondLatestBlog.content) : '';

    return (
        <section className="home-blogs-section container">
            <div className="section-header text-center">
                <h2>Latest Insights</h2>
                <p className="subtitle">Read our most recent thoughts on mental wellness.</p>
            </div>

            <div className="home-blogs-grid">
                {/* 60% Width - Latest Blog */}
                {latestBlog && (
                    <div className="home-blog-card latest">
                        <div className="home-blog-image-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', overflow: 'hidden' }}>
                            <img
                                src={latestImageUrl || logo}
                                alt={latestBlog.title}
                                loading="lazy"
                                decoding="async"
                                className="home-blog-logo"
                                style={latestImageUrl ? { width: '100%', height: '100%', objectFit: 'cover' } : {}}
                                onError={(e) => { e.currentTarget.src = logo; }}
                            />
                        </div>
                        <div className="home-blog-content">
                            <span className="blog-date">{new Date(latestBlog.created_at).toLocaleDateString()}</span>
                            <h3>{latestBlog.title}</h3>
                            <p className="line-clamp-3">{latestExcerpt}</p>
                            <NavLink to="/blogs" className="btn-secondary read-more-btn">Read Article</NavLink>
                        </div>
                    </div>
                )}

                {/* 40% Width - Second Latest Blog */}
                {secondLatestBlog && (
                    <div className="home-blog-card second-latest">
                        <div className="home-blog-image-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', overflow: 'hidden' }}>
                            <img
                                src={secondLatestImageUrl || logo}
                                alt={secondLatestBlog.title}
                                loading="lazy"
                                decoding="async"
                                className="home-blog-logo"
                                style={secondLatestImageUrl ? { width: '100%', height: '100%', objectFit: 'cover' } : {}}
                                onError={(e) => { e.currentTarget.src = logo; }}
                            />
                        </div>
                        <div className="home-blog-content">
                            <span className="blog-date">{new Date(secondLatestBlog.created_at).toLocaleDateString()}</span>
                            <h3>{secondLatestBlog.title}</h3>
                            <p className="line-clamp-3">{secondExcerpt}</p>
                            <NavLink to="/blogs" className="btn-secondary read-more-btn">Read Article</NavLink>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center" style={{ marginTop: '40px' }}>
                <NavLink to="/blogs" className="btn-primary">View All Blogs</NavLink>
            </div>
        </section>
    );
};

export default HomeBlogs;
