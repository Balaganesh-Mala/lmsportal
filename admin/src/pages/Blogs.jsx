import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, X, FileText, Image as ImageIcon, Save, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Blogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        author: 'Smart Aspirants Team',
        category: 'Career Advice',
        image: null
    });
    const [previewUrl, setPreviewUrl] = useState('');

    const categories = ['Career Advice', 'Technology', 'Design', 'Development', 'Success Stories', 'Other'];

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/blogs`);
            setBlogs(res.data);
        } catch (err) {
            console.error('Error fetching blogs:', err);
            toast.error('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const openModal = (blog = null) => {
        if (blog) {
            setSelectedBlog(blog);
            setFormData({
                title: blog.title,
                excerpt: blog.excerpt,
                content: blog.content,
                author: blog.author,
                category: blog.category,
                image: null
            });
            setPreviewUrl(blog.imageUrl);
        } else {
            setSelectedBlog(null);
            setFormData({
                title: '',
                excerpt: '',
                content: '',
                author: 'Smart Aspirants Team',
                category: 'Career Advice',
                image: null
            });
            setPreviewUrl('');
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
    
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('excerpt', formData.excerpt);
            data.append('content', formData.content);
            data.append('author', formData.author);
            data.append('category', formData.category);
            if (formData.image) {
                data.append('image', formData.image);
            }
    
            if (selectedBlog) {
                await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/blogs/${selectedBlog._id}`, data, {
                     headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Blog updated successfully');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/blogs`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Blog created successfully');
            }
            setShowModal(false);
            fetchBlogs();
        } catch (err) {
            console.error('Error saving blog:', err);
            toast.error(err.response?.data?.msg || 'Error saving blog');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Blog Post?',
            text: 'Are you sure you want to delete this blog post? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/blogs/${id}`);
            toast.success('Blog deleted');
            setBlogs(blogs.filter(b => b._id !== id));
        } catch (err) {
            toast.error('Failed to delete blog');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                     <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
                     <p className="text-gray-500 text-sm mt-1">Create and manage your blog posts</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300"
                >
                    <Plus size={20} /> New Post
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader size={40} className="animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map((blog) => (
                        <div key={blog._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-48 relative overflow-hidden bg-gray-100">
                                <img 
                                    src={blog.imageUrl} 
                                    alt={blog.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                                    {blog.category}
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{blog.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{blog.excerpt}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xs text-gray-400">{new Date(blog.createdAt).toLocaleDateString()}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openModal(blog)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(blog._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {blogs.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <FileText size={48} className="mb-3 opacity-50" />
                            <p>No blog posts found. Create your first one!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedBlog ? 'Edit Blog Post' : 'New Blog Post'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input 
                                            type="text" 
                                            name="title" 
                                            value={formData.title} 
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            required 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select 
                                            name="category" 
                                            value={formData.category} 
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                        <input 
                                            type="text" 
                                            name="author" 
                                            value={formData.author} 
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            required 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                                        <input 
                                            type="file" 
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            required={!selectedBlog}
                                        />
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="h-40 object-contain rounded-lg shadow-sm" />
                                        ) : (
                                            <>
                                                <ImageIcon size={32} className="text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500">Click to upload image</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (Short Summary)</label>
                                <textarea 
                                    name="excerpt" 
                                    value={formData.excerpt} 
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                    required
                                    maxLength="500"
                                    placeholder="Brief description for the card view..."
                                ></textarea>
                                <p className="text-right text-xs text-gray-400 mt-1">{formData.excerpt.length}/500</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML Support)</label>
                                <textarea 
                                    name="content" 
                                    value={formData.content} 
                                    onChange={handleInputChange}
                                    rows="12"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                                    required
                                    placeholder="Write your article here..."
                                ></textarea>
                                <p className="text-xs text-gray-500 mt-2">✨ Tip: You can use HTML tags for formatting (e.g., &lt;b&gt;, &lt;h2&gt;, &lt;p&gt;).</p>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100 items-center gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                    {saving ? 'Saving...' : 'Save Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blogs;
