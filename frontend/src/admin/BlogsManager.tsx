import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, List } from 'lucide-react';
import './LeadsManager.css';
import logo from '../assets/logo3.png';
import { resolveMediaUrl } from '../utils/api';
import { blogContentToPlainText } from '../utils/blogContent';

interface Blog {
    id: number;
    title: string;
    content: string;
    image_url: string;
    is_active: boolean;
    created_at: string;
}

const BlogsManager: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    const [formBlog, setFormBlog] = useState<{ id: number | null, title: string, content: string, image_url: string, is_active: boolean }>({
        id: null, title: '', content: '', image_url: '', is_active: true
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const fetchBlogs = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('/api/blogs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();
            formData.append('image', file);

            const res = await axios.post('/api/blogs/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data.image_url;
        } catch (err: any) {
            console.error('Image upload failed', err);
            alert(`Image Upload Error: ${err.response?.data?.message || err.message}`);
            return null;
        }
    };

    const saveBlog = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            let finalImageUrl = formBlog.image_url;

            if (selectedImage) {
                const uploadedUrl = await uploadImage(selectedImage);
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl;
                } else {
                    alert('Image upload failed. Proceeding without new image.');
                }
            }

            const payload = {
                title: formBlog.title,
                content: formBlog.content,
                image_url: finalImageUrl,
                is_active: formBlog.is_active
            };

            if (formBlog.id) {
                // Update
                await axios.put(`/api/blogs/${formBlog.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Create
                await axios.post('/api/blogs', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Reset form
            setFormBlog({ id: null, title: '', content: '', image_url: '', is_active: true });
            setSelectedImage(null);

            // clear the file input manually by referencing its DOM if needed, but since we rely on selectedImage state, its UI value is handled minimally. (A full reset would involve a ref to the file input).
            const fileInput = document.getElementById('blog-image-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            fetchBlogs();
        } catch (err) {
            console.error(err);
            alert('Failed to save blog');
        }
    };

    const editBlog = (blog: Blog) => {
        setFormBlog({
            id: blog.id,
            title: blog.title,
            content: blog.content,
            image_url: blog.image_url || '',
            is_active: blog.is_active
        });
        setSelectedImage(null);
        const fileInput = document.getElementById('blog-image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setFormBlog({ id: null, title: '', content: '', image_url: '', is_active: true });
        setSelectedImage(null);
        const fileInput = document.getElementById('blog-image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const deleteBlog = async (id: number) => {
        if (!window.confirm('Delete this blog?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/blogs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBlogs();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleBlogStatus = async (blog: Blog) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/blogs/${blog.id}`,
                { ...blog, is_active: !blog.is_active },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchBlogs();
        } catch (err) {
            console.error('Failed to update blog status', err);
        }
    };

    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    if (loading) return <div>Loading blogs...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Manage Blogs</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        className="btn-primary"
                        onClick={() => { setShowForm(!showForm); if (!showForm) cancelEdit(); }}
                    >
                        {showForm ? 'Close Form' : '+ New Blog'}
                    </button>
                    <div className="view-toggle-container">
                        <div className="view-toggle-segment" aria-label="View mode">
                            <button
                                type="button"
                                className={`view-segment-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                aria-pressed={viewMode === 'list'}
                            >
                                <List size={20} />
                            </button>
                            <button
                                type="button"
                                className={`view-segment-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                aria-pressed={viewMode === 'grid'}
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="admin-table-container" style={{ marginBottom: 40, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3>{formBlog.id ? 'Edit Blog' : 'Add New Blog'}</h3>
                    <form onSubmit={saveBlog} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24, maxWidth: 600 }}>
                        <input
                            type="text" placeholder="Blog Title" required
                            value={formBlog.title} onChange={e => setFormBlog({ ...formBlog, title: e.target.value })}
                            style={{ padding: '12px', border: '1px solid #ced4da', borderRadius: '6px', width: '100%' }}
                        />

                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Upload Photo</label>
                            <input
                                id="blog-image-upload"
                                type="file" accept="image/*"
                                onChange={e => setSelectedImage(e.target.files ? e.target.files[0] : null)}
                            />
                            {formBlog.image_url && !selectedImage && (
                                <div style={{ marginTop: 8 }}>
                                    <small>Current Image: {formBlog.image_url}</small>
                                </div>
                            )}
                            {selectedImage && (
                                <div style={{ marginTop: 8 }}>
                                    <small style={{ color: 'var(--primary-brown)' }}>Will upload: {selectedImage.name}</small>
                                </div>
                            )}
                        </div>

                        <textarea
                            placeholder="Blog Content" rows={5} required
                            value={formBlog.content} onChange={e => setFormBlog({ ...formBlog, content: e.target.value })}
                            style={{ padding: '12px', border: '1px solid #ced4da', borderRadius: '6px', width: '100%', resize: 'vertical' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="checkbox"
                                checked={formBlog.is_active}
                                onChange={e => setFormBlog({ ...formBlog, is_active: e.target.checked })}
                                style={{ width: 'auto' }}
                            />
                            Publish immediately (Active)
                        </label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>{formBlog.id ? 'Update Blog Post' : 'Save Blog Post'}</button>
                            {formBlog.id && (
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={cancelEdit}>Cancel Edit</button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-table-container">
                {viewMode === 'list' ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Title</th>
                                <th>Publish Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blogs.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center' }}>No blogs created yet.</td></tr>
                            ) : (
                                blogs.map(blog => (
                                    <tr key={blog.id}>
                                        <td>
                                            <span className={`status-dot ${blog.is_active ? 'green' : 'red'}`}></span>
                                            {blog.is_active ? 'Active' : 'Inactive'}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{blog.title}</td>
                                        <td>{new Date(blog.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', color: 'white', backgroundColor: blog.is_active ? '#e53e3e' : '#38a169', fontWeight: 'bold' }}
                                                    onClick={() => toggleBlogStatus(blog)}
                                                >
                                                    {blog.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button style={{ padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a202c', fontWeight: 'bold' }} onClick={() => { editBlog(blog); setShowForm(true); }}>Edit</button>
                                                <button style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #e53e3e', borderRadius: '4px', cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold' }} onClick={() => deleteBlog(blog.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <div className="leads-grid" style={{ padding: '20px 0' }}>
                        {blogs.length === 0 ? (
                            <div className="no-leads-message">No blogs created yet.</div>
                        ) : (
                            blogs.map(blog => {
                                const imageUrl = resolveMediaUrl(blog.image_url);
                                const excerpt = blogContentToPlainText(blog.content);
                                return (
                                <div key={blog.id} className="lead-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {imageUrl && (
                                        <div style={{ height: '120px', width: '100%', overflow: 'hidden', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#f1f5f9' }}>
                                            <img src={imageUrl} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = logo; }} />
                                        </div>
                                    )}
                                    <div className="lead-card-header" style={{ alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 className="lead-name" style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{blog.title}</h3>
                                            <div className="lead-date" style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                                                Published: {new Date(blog.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <span className={`lead-status-badge status-${blog.is_active ? 'confirmed' : 'declined'}`} style={{ backgroundColor: blog.is_active ? '#f0fff4' : '#fff5f5', color: blog.is_active ? '#38a169' : '#e53e3e' }}>
                                            {blog.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="lead-body" style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', color: '#4a5568', fontSize: '0.9rem' }}>
                                        {excerpt}
                                    </div>
                                    <div className="lead-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                                        <button
                                            style={{ flex: 1, border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', color: 'white', backgroundColor: blog.is_active ? '#e53e3e' : '#38a169', fontWeight: 'bold' }}
                                            onClick={() => toggleBlogStatus(blog)}
                                        >
                                            {blog.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button style={{ flex: 1, padding: '8px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a202c', fontWeight: 'bold' }} onClick={() => { editBlog(blog); setShowForm(true); }}>Edit</button>
                                        <button style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #e53e3e', borderRadius: '6px', cursor: 'pointer', color: '#e53e3e', fontWeight: 'bold', marginTop: '4px' }} onClick={() => deleteBlog(blog.id)}>Delete</button>
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogsManager;
