import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomeBlogs.css';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo3.png';

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
                // Fetch the latest blogs
                const response = await axios.get('/api/blogs/public');
                // We only need the top 2 recent ones
                if (response.data && response.data.length > 0) {
                    setBlogs(response.data.slice(0, 2));
                }
            } catch (error) {
                console.error('Error fetching blogs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (loading) return null; // Don't show anything while loading on the home page
    if (blogs.length === 0) return null; // Don't show section if no blogs exist

    const latestBlog = blogs[0];
    const secondLatestBlog = blogs.length > 1 ? blogs[1] : null;

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
                            <img src={latestBlog.image_url ? `${latestBlog.image_url}` : logo} alt={latestBlog.title} className="home-blog-logo" style={latestBlog.image_url ? { width: '100%', height: '100%', objectFit: 'cover' } : {}} />
                        </div>
                        <div className="home-blog-content">
                            <span className="blog-date">{new Date(latestBlog.created_at).toLocaleDateString()}</span>
                            <h3>{latestBlog.title}</h3>
                            <p className="line-clamp-3">{latestBlog.content}</p>
                            <NavLink to="/blogs" className="btn-secondary read-more-btn">Read Article</NavLink>
                        </div>
                    </div>
                )}

                {/* 40% Width - Second Latest Blog */}
                {secondLatestBlog && (
                    <div className="home-blog-card second-latest">
                        <div className="home-blog-image-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', overflow: 'hidden' }}>
                            <img src={secondLatestBlog.image_url ? `${secondLatestBlog.image_url}` : logo} alt={secondLatestBlog.title} className="home-blog-logo" style={secondLatestBlog.image_url ? { width: '100%', height: '100%', objectFit: 'cover' } : {}} />
                        </div>
                        <div className="home-blog-content">
                            <span className="blog-date">{new Date(secondLatestBlog.created_at).toLocaleDateString()}</span>
                            <h3>{secondLatestBlog.title}</h3>
                            <p className="line-clamp-3">{secondLatestBlog.content}</p>
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
