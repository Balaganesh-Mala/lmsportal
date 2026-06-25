import React, { useState } from 'react';
import { Plus, Trash, Edit, Image as ImageIcon, X, Save } from 'lucide-react';

const Banners = () => {
    // Mock Data
    const [banners, setBanners] = useState([
        {
            _id: '1',
            type: 'image',
            imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
            title: 'Master Your Future',
            subtitle: 'Join Smart Aspirants Skills Center',
            link: '/courses',
            active: true
        },
        {
            _id: '2',
            type: 'video',
            videoUrl: 'https://cdn.coverr.co/videos/coverr-typing-on-computer-keyboard-4663/1080p.mp4', 
            title: 'Hands-on Training',
            subtitle: 'Practical Learning',
            link: '/career',
            active: true
        }
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [currentBanner, setCurrentBanner] = useState(null);

    const handleEdit = (banner) => {
        setCurrentBanner(banner);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setCurrentBanner({
            _id: Date.now().toString(), // Temp ID
            type: 'image', // default
            imageUrl: '',
            videoUrl: '',
            title: '',
            subtitle: '',
            link: '',
            active: true
        });
        setIsEditing(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this banner?')) {
            setBanners(banners.filter(b => b._id !== id));
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        // Check if updating or adding
        const exists = banners.find(b => b._id === currentBanner._id);
        if (exists) {
            setBanners(banners.map(b => b._id === currentBanner._id ? currentBanner : b));
        } else {
            setBanners([...banners, currentBanner]);
        }
        setIsEditing(false);
        setCurrentBanner(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Banners Management</h1>
                    <p className="text-gray-500 text-sm">Manage your homepage hero sliders</p>
                 </div>
                 <button 
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                 >
                    <Plus size={20} /> Add New Banner
                 </button>
            </div>

            {/* List View */}
            {!isEditing ? (
                <div className="grid grid-cols-1 gap-6">
                    {banners.map((banner) => (
                        <div key={banner._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-full md:w-64 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                {banner.type === 'video' ? (
                                    <video src={banner.videoUrl} className="w-full h-full object-cover" muted />
                                ) : (
                                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded uppercase font-bold">
                                    {banner.type}
                                </div>
                            </div>
                            
                            <div className="flex-grow text-center md:text-left">
                                <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>
                                <p className="text-gray-500">{banner.subtitle}</p>
                                <p className="text-indigo-600 text-sm mt-1">{banner.link}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleEdit(banner)}
                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Edit size={20} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(banner._id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {banners.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                            <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No banners found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Edit/Create Form */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            {currentBanner._id && banners.find(b => b._id === currentBanner._id) ? 'Edit Banner' : 'Create Banner'}
                        </h2>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <select 
                                    value={currentBanner.type}
                                    onChange={(e) => setCurrentBanner({...currentBanner, type: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select 
                                    value={currentBanner.active}
                                    onChange={(e) => setCurrentBanner({...currentBanner, active: e.target.value === 'true'})}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {currentBanner.type === 'video' ? 'Video URL (MP4)' : 'Image URL'}
                            </label>
                            <input 
                                type="url"
                                required
                                value={currentBanner.type === 'video' ? currentBanner.videoUrl : currentBanner.imageUrl}
                                onChange={(e) => currentBanner.type === 'video' ? setCurrentBanner({...currentBanner, videoUrl: e.target.value}) : setCurrentBanner({...currentBanner, imageUrl: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input 
                                type="text"
                                required
                                value={currentBanner.title}
                                onChange={(e) => setCurrentBanner({...currentBanner, title: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. Master Your Future"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                            <input 
                                type="text"
                                required
                                value={currentBanner.subtitle}
                                onChange={(e) => setCurrentBanner({...currentBanner, subtitle: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. Join the best coding bootcamp"
                            />
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Link (CTA)</label>
                            <input 
                                type="text"
                                required
                                value={currentBanner.link}
                                onChange={(e) => setCurrentBanner({...currentBanner, link: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. /courses"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="w-1/2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex justify-center items-center gap-2"
                            >
                                <Save size={18} /> Save Banner
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Banners;
