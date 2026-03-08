import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Blogs.css';
import logo from '../assets/logo3.png';

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
    const [expandedBlogIds, setExpandedBlogIds] = useState<number[]>([]);

    const toggleReadMore = (id: number) => {
        setExpandedBlogIds(prev =>
            prev.includes(id) ? prev.filter(blogId => blogId !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await axios.get('/api/blogs/public');
                setBlogs(response.data);
            } catch (error) {
                console.error('Error fetching blogs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (loading) return <div className="container text-center" style={{ paddingTop: '100px' }}>Loading amazing thoughts...</div>;

    const featuredBlog = blogs.length > 0 ? blogs[0] : null;
    const remainingBlogs = blogs.length > 1 ? blogs.slice(1) : [];

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
                                <img src={featuredBlog.image_url ? `${featuredBlog.image_url}` : logo} alt={featuredBlog.title} style={featuredBlog.image_url ? { width: '100%', height: '100%', objectFit: 'cover' } : { height: '120px', width: 'auto', objectFit: 'contain' }} />
                            </div>
                            <div className="featured-content">
                                <span className="blog-date">{new Date(featuredBlog.created_at).toLocaleDateString()}</span>
                                <h3>{featuredBlog.title}</h3>
                                <p className={expandedBlogIds.includes(featuredBlog.id) ? "" : "line-clamp-3"}>
                                    {featuredBlog.content}
                                </p>
                                <button
                                    className="btn-primary read-more-btn"
                                    onClick={() => toggleReadMore(featuredBlog.id)}
                                >
                                    {expandedBlogIds.includes(featuredBlog.id) ? "Show Less" : "Read Full Article"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Remaining Blogs - Masonry Grid */}
                    {remainingBlogs.length > 0 && (
                        <div className="blogs-masonry reveal active">
                            {remainingBlogs.map(blog => (
                                <article key={blog.id} className="blog-card masonry-item">
                                    <div className="blog-image" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', width: '100%', height: '200px', overflow: 'hidden', borderRadius: '8px', paddingTop: blog.image_url ? '0' : '20px' }}>
                                        <img src={blog.image_url ? `${blog.image_url}` : logo} alt={blog.title} style={blog.image_url ? { width: '100%', height: '100%', objectFit: 'cover' } : { height: '80px', width: 'auto', objectFit: 'contain' }} />
                                    </div>
                                    <div className="blog-content">
                                        <span className="blog-date">{new Date(blog.created_at).toLocaleDateString()}</span>
                                        <h3>{blog.title}</h3>
                                        <p className={expandedBlogIds.includes(blog.id) ? "" : "line-clamp-3"}>
                                            {blog.content}
                                        </p>
                                        <button
                                            className="btn-secondary read-more-btn"
                                            onClick={() => toggleReadMore(blog.id)}
                                        >
                                            {expandedBlogIds.includes(blog.id) ? "Show Less" : "Read Article"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};

export default Blogs;
