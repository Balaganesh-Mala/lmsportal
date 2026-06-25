import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Image, 
  BookOpen, 
  MessageSquare, 
  Briefcase, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    if (!token) {
        navigate('/admin/login');
        return;
    }

    if (userData) {
        setAdmin(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Banners', path: '/admin/banners', icon: Image },
    { name: 'Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
    { name: 'Jobs', path: '/admin/jobs', icon: Briefcase },
    { name: 'Blogs', path: '/admin/blogs', icon: FileText },
    { name: 'Reviews', path: '/admin/reviews', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-800">
          <span className="text-2xl font-bold tracking-wider">Smart Aspirants Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-900/20 hover:text-red-100 transition-colors mt-8"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
             <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                     {admin?.name?.charAt(0) || 'A'}
                 </div>
                 <span className="text-sm font-medium text-gray-700">
                     {admin?.name || 'Admin'}
                 </span>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
