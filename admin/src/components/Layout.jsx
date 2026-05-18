import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MobileScannerModal from './MobileScannerModal';
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
  X,
  Bell,
  Search,
  ChevronDown,
  QrCode,
  Calendar,
  Layers,
  ClipboardList,
  CreditCard,
  Receipt,
  Globe,
  MonitorPlay,
  Video,
  TrendingUp,
  HelpCircle,
  Mic,
  Megaphone,
  Headset,
  Ticket
} from 'lucide-react';


const navCategories = [
  {
    title: 'Dashboard',
    links: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Students Management',
    icon: Users,
    links: [
      { name: 'Students', path: '/students', icon: Users },
      { name: 'Batches', path: '/batches', icon: Layers },
      { name: 'Attendance Scanner', path: '/attendance/qr-scanner', icon: QrCode },
      { name: 'Att. History', path: '/attendance/history', icon: Calendar },
      { name: 'Submissions', path: '/submissions', icon: ClipboardList },
      { name: 'Test Bank', path: '/tests', icon: FileText }
    ]
  },
  {
    title: 'Courses & Learning',
    icon: BookOpen,
    links: [
      { name: 'Courses', path: '/courses', icon: BookOpen },
      { name: 'Trainers', path: '/trainers', icon: Users },
      { name: 'Study Materials', path: '/materials', icon: FileText },
      { name: 'Meetings', path: '/meetings', icon: Calendar }
    ]
  },
  {
    title: 'Interviews Preparation',
    icon: MonitorPlay,
    links: [
      { name: 'Schedule Interview', path: '/interviews/schedule', icon: Calendar },
      { name: 'Settings', path: '/interviews/settings', icon: Settings },
      { name: 'Conduct Mock', path: '/interviews/conduct', icon: FileText },
      { name: 'Mock History', path: '/interviews/history', icon: ClipboardList },
      { name: 'Question Bank', path: '/interviews/questions', icon: HelpCircle },
      { name: 'Analytics', path: '/interviews/analytics', icon: TrendingUp }
    ]
  },
  {
    title: 'Finance',
    icon: CreditCard,
    links: [
      { name: 'Fee Management', path: '/fees', icon: CreditCard },
      { name: 'Subscription Plans', path: '/subscription-settings', icon: Layers },
      { name: 'Subscribers', path: '/subscribers', icon: Users },
      { name: 'Coupons', path: '/coupon-management', icon: Ticket },
      { name: 'Expenses', path: '/expenses', icon: Receipt }
    ]
  },
  {
    title: 'Jobs & Placement Cell',
    icon: Briefcase,
    links: [
      { name: 'Client Jobs', path: '/jobs', icon: Briefcase },
      { name: 'Student Jobs', path: '/student-jobs', icon: Briefcase },
      { name: 'Applications', path: '/applications', icon: FileText }
    ]
  },
  {
    title: 'Marketing & Website',
    icon: Globe,
    links: [
      { name: 'Banners', path: '/banners', icon: Image },
      { name: 'Spotlights', path: '/announcements', icon: Megaphone },
      { name: 'Blogs', path: '/blogs', icon: FileText },
      { name: 'Reviews', path: '/reviews', icon: Users }
    ]
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    links: [
      { name: 'Support Inbox', path: '/support-inbox', icon: Headset },
      { name: 'Inquiries', path: '/inquiries', icon: MessageSquare },
      { name: 'Manage Demos', path: '/demos', icon: MessageSquare }
    ]
  },
  {
    title: 'Settings',
    links: [
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
  }
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [inquiries, setInquiries] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [settings, setSettings] = useState({ siteTitle: 'JobReady', logoUrl: '' });
  const [user, setUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial open category based on current path
  const getInitialCategory = () => {
    for (let i = 0; i < navCategories.length; i++) {
      if (navCategories[i].links.some(link => link.path === location.pathname)) {
        return navCategories[i].title;
      }
    }
    return 'Dashboard';
  };

  const [activeCategory, setActiveCategory] = useState(getInitialCategory());
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Update active category when route changes
  useEffect(() => {
    setActiveCategory(getInitialCategory());
  }, [location.pathname]);

  // Fetch settings, inquiry count, and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Parallel fetch for efficiency
        const [settingsRes, inquiriesRes] = await Promise.all([
          axios.get(`${apiUrl}/api/settings`),
          axios.get(`${apiUrl}/api/inquiries`)
        ]);

        if (settingsRes.data) {
          setSettings(prev => ({ ...prev, ...settingsRes.data }));
        }

        const allInquiries = inquiriesRes.data || [];
        setInquiries(allInquiries.slice(0, 5)); // Keep top 5 latest for dropdown
        const newCount = allInquiries.filter(i => i.status === 'new').length;
        setInquiryCount(newCount);

        // Load user from localStorage instead of Supabase
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };


  const userName = user?.name || 'Administrator';
  const userEmail = user?.email || 'admin@finwisecs.com';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl text-slate-800 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-r border-slate-200/60 ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-indigo-500/10' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
            ) : (
              <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 ring-2 ring-white/50">
                {settings.siteTitle.charAt(0)}
              </div>
            )}
            <div>
              <span className="block text-lg font-extrabold tracking-tight text-slate-800 leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                {settings.siteTitle}
              </span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-0.5 block">
                Admin Portal
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navCategories.map((category, catIndex) => {
            const isCategoryOpen = activeCategory === category.title || hoveredCategory === category.title;

            // Top level links without categories
            if (category.title === 'Dashboard' || category.title === 'Settings') {
              const item = category.links[0];
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-100/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                    }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
                  )}

                  <div className="flex items-center gap-3.5 relative z-10 w-full">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm group-hover:ring-1 group-hover:ring-slate-200/50'}`}>
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <span className="text-sm tracking-wide flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={`relative z-10 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-rose-50 text-rose-500 ring-1 ring-rose-100 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-rose-500/30 group-hover:ring-rose-500'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-50"></div>
                  )}
                </Link>
              )
            }

            // Categories with dropdowns
            return (
              <div
                key={catIndex}
                className={`space-y-1 ${category.title === 'Communication' && inquiryCount > 0 ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
                onMouseEnter={() => setHoveredCategory(category.title)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button
                  onClick={() => setActiveCategory(activeCategory === category.title ? '' : category.title)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group/catBtn ${isCategoryOpen ? 'bg-indigo-50/50 shadow-sm ring-1 ring-indigo-100/30' : 'hover:bg-slate-50'}`}
                >
                  {isCategoryOpen && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl"></span>
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${isCategoryOpen ? 'bg-indigo-100/80 text-indigo-600 shadow-inner' : 'bg-slate-100/50 text-slate-400 group-hover/catBtn:bg-white group-hover/catBtn:text-indigo-500 group-hover/catBtn:shadow-sm group-hover/catBtn:ring-1 group-hover/catBtn:ring-slate-200/50'}`}>
                      {category.icon && <category.icon size={18} strokeWidth={isCategoryOpen ? 2.5 : 2} className="transition-transform duration-300 group-hover/catBtn:scale-110" />}
                    </div>
                    <div className="relative">
                      <span className={`text-[13px] font-bold tracking-wide transition-colors ${isCategoryOpen ? 'text-indigo-700' : 'text-slate-600 group-hover/catBtn:text-slate-900'}`}>{category.title}</span>
                      {category.title === 'Communication' && inquiryCount > 0 && (
                        <span className="absolute -top-1 -right-2.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      )}
                      {category.title === 'Communication' && inquiryCount > 0 && (
                        <span className="absolute -top-1 -right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-sm shadow-red-500/50 border border-white"></span>
                      )}
                    </div>
                  </div>
                  <div className={`p-1 rounded-md transition-colors ${isCategoryOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent text-slate-400 group-hover/catBtn:bg-slate-100'}`}>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCategoryOpen ? 'max-h-96 opacity-100 mt-1.5' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col gap-0.5 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 before:-z-10 pl-2 pr-1 pb-1">
                    {category.links.map((item) => {
                      const isActive = location.pathname === item.path;
                      const hasBadge = item.badge || (item.name === 'Inquiries' && inquiryCount > 0);
                      const badgeValue = item.name === 'Inquiries' && inquiryCount > 0 ? inquiryCount : item.badge;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex items-center justify-between pl-8 pr-4 py-2.5 rounded-xl transition-all duration-200 relative w-full ${isActive
                            ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-500/10'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                            }`}
                        >
                          {/* Connecting Line effect active */}
                          <div className={`absolute left-[17px] w-3 h-[2px] rounded-r-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-slate-300'}`}></div>

                          <div className="flex items-center gap-3 relative w-full z-10">
                            <span className={`text-[13px] tracking-wide flex-1 transition-transform ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>{item.name}</span>
                            {hasBadge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 group-hover:bg-rose-500 group-hover:text-white'}`}>
                                {badgeValue}
                              </span>
                            )}
                          </div>

                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-indigo-50/50 opacity-50 rounded-xl" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Navbar */}
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center gap-5">
            {/* Search Bar */}
            <div className="hidden lg:flex items-center bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all w-72">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-sm ml-3 w-full text-gray-600 placeholder-gray-400"
              />
            </div>

            <div className="flex items-center gap-3 relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors border border-transparent hover:border-blue-100 group"
              >
                <Bell size={20} className={inquiryCount > 0 ? 'group-hover:animate-ping' : ''} />
                {inquiryCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-gradient-to-tr from-rose-500 to-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center shadow-md animate-bounce shadow-red-500/30">
                    {inquiryCount > 99 ? '99+' : inquiryCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{inquiryCount} New</span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {inquiries.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {inquiries.map((inq, idx) => (
                          <div key={idx} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${inq.status === 'new' ? 'bg-indigo-50/30' : ''}`} onClick={() => { setShowNotifications(false); navigate('/inquiries'); }}>
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-semibold text-slate-800 truncate pr-2">{inq.name || 'Anonymous'}</p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(inq.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{inq.message || inq.phone || 'New inquiry received'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                        <Bell size={32} className="mb-2 text-slate-200" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                  {inquiries.length > 0 && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                      <button onClick={() => { setShowNotifications(false); navigate('/inquiries'); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                        View All Inquiries
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 p-1.5 pr-4 text-gray-600 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-200 group"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-100 ring-2 ring-white group-hover:scale-105 transition-transform">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
                    <p className="text-[10px] font-medium text-slate-400">Administrator</p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)}></div>
                    <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-4 duration-200">
                      <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{userEmail}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/settings"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Settings size={18} />
                          Admin Settings
                        </Link>
                        <button
                          onClick={() => { handleLogout(); setShowProfileDropdown(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut size={18} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Scanner FAB */}
      <button
        onClick={() => setShowScanner(true)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-600/40 ring-4 ring-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all group"
      >
        <QrCode size={24} className="relative z-10 transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 bg-indigo-400 rounded-full blur opacity-30 animate-pulse -z-10"></div>
      </button>

      {/* Mobile Scanner Modal Overlay */}
      {showScanner && <MobileScannerModal onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default Layout;
