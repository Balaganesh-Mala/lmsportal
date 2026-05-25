import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import LiveSupport from './LiveSupport';

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
  ChevronLeft,
  ChevronRight,
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

const axiosInstance = axios;


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
      { name: 'MCQ Tests', path: '/tests', icon: FileText }
    ]
  },
  {
    title: 'Courses & Learning',
    icon: BookOpen,
    links: [
      { name: 'Courses', path: '/courses', icon: BookOpen },
      { name: 'Trainers', path: '/trainers', icon: Users },
      { name: 'Study Materials', path: '/materials', icon: FileText }
    ]
  },
  {
    title: 'Meetings',
    links: [
      { name: 'Meetings', path: '/meetings', icon: Calendar }
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
      { name: 'Inquiries', path: '/inquiries', icon: MessageSquare }
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
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [inquiries, setInquiries] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [settings, setSettings] = useState({ siteTitle: 'JobReady', logoUrl: '' });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  });

  const hasAccess = (categoryTitle) => {
    if (!user) return true;
    if (user.role === 'Administrator' || user.role === 'Super Admin' || user.role === 'Admin') return true;

    const keyMap = {
      'Dashboard': 'dashboard',
      'Students Management': 'studentsManagement',
      'Courses & Learning': 'coursesLearning',
      'Finance': 'finance',
      'Marketing & Website': 'marketingWebsite',
      'Communication': 'communication',
      'Settings': 'settings'
    };

    const key = keyMap[categoryTitle];
    if (!key) return true;
    return user.access ? !!user.access[key] : false;
  };

  const hasLinkAccess = (linkName) => {
    if (!user) return true;
    if (user.role === 'Administrator' || user.role === 'Super Admin' || user.role === 'Admin') return true;

    const linkKeyMap = {
      'Student List': 'studentsList',
      'Batch Students': 'batchStudents',
      'Courses': 'courses',
      'Trainers': 'trainers',
      'Study Materials': 'studyMaterials',
      'Fee Management': 'feeManagement',
      'Subscription Plans': 'subscriptionPlans',
      'Subscribers': 'subscribers',
      'Coupons': 'coupons',
      'Expenses': 'expenses',
      'Banners': 'banners',
      'Spotlights': 'spotlights',
      'Blogs': 'blogs',
      'Reviews': 'reviews',
      'Support Inbox': 'supportInbox',
      'Inquiries': 'inquiries'
    };

    const key = linkKeyMap[linkName];
    if (!key) return true;
    return user.access ? !!user.access[key] : false;
  };

  const filteredCategories = navCategories
    .filter(category => hasAccess(category.title))
    .map(category => ({
      ...category,
      links: category.links ? category.links.filter(link => hasLinkAccess(link.name)) : []
    }))
    .filter(category => category.links && category.links.length > 0);

  const location = useLocation();
  const navigate = useNavigate();

  // Determine if user has access to the current active path
  const isPathAllowed = (path) => {
    if (path === '/') return hasAccess('Dashboard');
    
    // Find which category this path belongs to
    const category = navCategories.find(cat => cat.links.some(link => link.path === path || path.startsWith(link.path + '/')));
    if (!category) return true; // Default allow for sub-routes or unlisted paths
    
    if (!hasAccess(category.title)) return false;

    // Find the specific link
    const link = category.links.find(link => link.path === path || path.startsWith(link.path + '/'));
    if (link) {
      return hasLinkAccess(link.name);
    }
    
    return true;
  };

  // Perform automatic redirects based on feature access permissions
  useEffect(() => {
    if (!isPathAllowed(location.pathname)) {
      // Find first accessible category and link
      const firstCategoryWithLinks = filteredCategories.find(cat => cat.links && cat.links.length > 0);
      if (firstCategoryWithLinks) {
        const firstLink = firstCategoryWithLinks.links[0];
        navigate(firstLink.path, { replace: true });
        toast.error("Access denied. You do not have permission to view that page.");
      }
    }
  }, [location.pathname, filteredCategories]);

  // Determine initial open category based on current path
  const getInitialCategory = () => {
    for (let i = 0; i < filteredCategories.length; i++) {
      if (filteredCategories[i].links.some(link => link.path === location.pathname)) {
        return filteredCategories[i].title;
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

  // Sync fresh profile from DB on every route transition (page tab change)
  useEffect(() => {
    const syncUser = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const meRes = await axiosInstance.get(`${apiUrl}/api/admin/me`);
        if (meRes.data && meRes.data.success && meRes.data.user) {
          const freshUser = meRes.data.user;
          setUser(freshUser);
          localStorage.setItem('adminUser', JSON.stringify(freshUser));
        }
      } catch (err) {
        console.error("Failed to sync fresh user profile inside Layout transition", err);
      }
    };
    syncUser();
  }, [location.pathname]);

  // Fetch settings, inquiry count, support count, and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Parallel fetch for efficiency
        const [settingsRes, inquiriesRes, supportRes, meRes] = await Promise.all([
          axiosInstance.get(`${apiUrl}/api/settings`),
          axiosInstance.get(`${apiUrl}/api/inquiries`),
          axiosInstance.get(`${apiUrl}/api/support/unread-count`),
          axiosInstance.get(`${apiUrl}/api/admin/me`).catch(err => {
            console.error("Failed to sync fresh user profile inside Layout", err);
            return null;
          })
        ]);

        if (settingsRes.data) {
          setSettings(prev => ({ ...prev, ...settingsRes.data }));
        }

        const allInquiries = inquiriesRes.data || [];
        setInquiries(allInquiries.slice(0, 5)); // Keep top 5 latest for dropdown
        const newCount = allInquiries.filter(i => i.status === 'new').length;
        setInquiryCount(newCount);

        if (supportRes.data) {
          setSupportUnreadCount(supportRes.data.unreadCount || 0);
        }

        // Sync fresh profile from DB if available, otherwise fallback to local storage
        if (meRes && meRes.data && meRes.data.success && meRes.data.user) {
          const freshUser = meRes.data.user;
          setUser(freshUser);
          localStorage.setItem('adminUser', JSON.stringify(freshUser));
        } else {
          const storedUser = localStorage.getItem('adminUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [location.pathname]);

  // Socket.io for live support notifications
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(apiUrl, {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_admin');
    });

    newSocket.on('new_inquiry', (data) => {
      // Re-fetch unread count
      axiosInstance.get(`${apiUrl}/api/support/unread-count`)
        .then(res => {
          if (res.data) {
            setSupportUnreadCount(res.data.unreadCount || 0);
          }
        })
        .catch(err => console.error(err));

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        if (document.hidden || !document.hasFocus()) {
          new Notification('💬 New Support Message', {
            body: `${data.message?.message || 'New support inquiry received'}`,
            icon: '/favicon.ico'
          });
        }
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

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
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 shadow-2xl lg:shadow-none transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${collapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Sidebar Header */}
        <div className={`h-20 flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-6'} border-b border-slate-800 relative shrink-0`}>
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-xl drop-shadow-sm shrink-0" />
            ) : (
              <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 shrink-0">
                {settings.siteTitle.charAt(0)}
              </div>
            )}
            {!collapsed && (
              <div className="transition-opacity duration-300 overflow-hidden">
                <span className="block text-lg font-extrabold tracking-tight text-slate-100 leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 whitespace-nowrap">
                  {settings.siteTitle}
                </span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5 block">Admin Portal</span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white shadow-sm hover:shadow transition-colors z-50"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-800 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredCategories.map((category, catIndex) => {
            const isCategoryOpen = activeCategory === category.title || hoveredCategory === category.title;

            // Top level links without categories
            if (category.title === 'Dashboard' || category.title === 'Settings' || category.title === 'Meetings') {
              const item = category.links[0];
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.name : ''}
                  className={`group flex items-center px-3.5 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                    ? 'active-nav bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 font-medium'
                  }`}
                >
                  {/* Left glow bar — visible only when active */}
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-8 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-[.active-nav]:w-1.5 group-[.active-nav]:opacity-100 transition-all duration-300" />

                  <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3.5'} relative z-10 w-full`}>
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-white/20 text-white shadow-inner' : 'bg-slate-800/40 text-slate-400 group-hover:bg-slate-800 group-hover:text-orange-400 group-hover:shadow-sm'}`}>
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    {!collapsed && (
                      <span className="text-sm tracking-wide flex-1">{item.name}</span>
                    )}
                  </div>

                  {/* Subtle gradient overlay when active */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-[.active-nav]:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                </Link>
              );
            }

            // Categories with dropdowns
            return (
              <div
                key={catIndex}
                className={`space-y-1 ${category.title === 'Communication' && (inquiryCount > 0 || supportUnreadCount > 0) ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
                onMouseEnter={() => !collapsed && setHoveredCategory(category.title)}
                onMouseLeave={() => !collapsed && setHoveredCategory(null)}
              >
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    else setActiveCategory(activeCategory === category.title ? '' : category.title);
                  }}
                  title={collapsed ? category.title : ''}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group/catBtn ${isCategoryOpen
                    ? 'bg-slate-800/60 shadow-sm ring-1 ring-slate-800/30'
                    : 'hover:bg-slate-800/40'
                    }`}
                >
                  {/* Left accent bar when open */}
                  {isCategoryOpen && !collapsed && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
                  )}

                  <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'} relative z-10`}>
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${isCategoryOpen
                      ? 'bg-slate-800 text-indigo-400 shadow-inner'
                      : 'bg-slate-800/40 text-slate-400 group-hover/catBtn:bg-slate-800 group-hover/catBtn:text-indigo-400 group-hover/catBtn:shadow-sm'
                      }`}>
                      {category.icon && <category.icon size={18} strokeWidth={isCategoryOpen ? 2.5 : 2} className="transition-transform duration-300 group-hover/catBtn:scale-110" />}
                    </div>
                    {!collapsed && (
                      <div className="relative">
                        <span className={`text-[13px] font-bold tracking-wide transition-colors ${isCategoryOpen ? 'text-indigo-300' : 'text-slate-400 group-hover/catBtn:text-slate-200'}`}>
                          {category.title}
                        </span>
                        {category.title === 'Communication' && (inquiryCount > 0 || supportUnreadCount > 0) && (
                          <span className="absolute -top-1 -right-2.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        )}
                        {category.title === 'Communication' && (inquiryCount > 0 || supportUnreadCount > 0) && (
                          <span className="absolute -top-1 -right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-sm shadow-red-500/50 border border-white"></span>
                        )}
                      </div>
                    )}
                  </div>

                  {!collapsed && (
                    <div className={`p-1 rounded-md transition-colors ${isCategoryOpen ? 'bg-slate-800 text-indigo-400' : 'bg-transparent text-slate-400 group-hover/catBtn:bg-slate-800'}`}>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </button>

                {/* Children links tree */}
                {!collapsed && (
                  <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCategoryOpen ? 'max-h-96 opacity-100 mt-1.5' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-0.5 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800 before:-z-10 pl-2 pr-1 pb-1">
                      {category.links.map((item) => {
                        const isActive = location.pathname === item.path;
                        const hasBadge = item.badge || 
                          (item.name === 'Inquiries' && inquiryCount > 0) ||
                          (item.name === 'Support Inbox' && supportUnreadCount > 0);
                        const badgeValue = item.name === 'Inquiries' && inquiryCount > 0 
                          ? inquiryCount 
                          : item.name === 'Support Inbox' && supportUnreadCount > 0
                          ? supportUnreadCount
                          : item.badge;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`group flex items-center justify-between pl-8 pr-4 py-2.5 rounded-xl transition-all duration-200 relative w-full ${isActive
                              ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold shadow-md shadow-orange-500/20'
                              : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 font-medium'
                            }`}
                          >
                            {/* Horizontal connecting tick */}
                            <div className={`absolute left-[17px] w-3 h-[2px] rounded-r-full transition-colors ${isActive ? 'bg-white' : 'bg-transparent group-hover:bg-slate-700'}`} />

                            <div className="flex items-center gap-3 relative w-full z-10">
                              <span className={`text-[13px] tracking-wide flex-1 transition-transform ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>
                                {item.name}
                              </span>
                              {hasBadge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm transition-all duration-300 ${isActive ? 'bg-white text-orange-600' : 'bg-rose-50/10 text-rose-450 ring-1 ring-rose-900 group-hover:bg-rose-500 group-hover:text-white'}`}>
                                  {badgeValue}
                                </span>
                              )}
                            </div>

                            {isActive && (
                              <div className="absolute inset-0 bg-white/10 opacity-50 rounded-xl" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>










        {/* Sidebar Footer - Dedicated Profile Tab Card */}
        {user && (
          <div className={`p-4 border-t border-slate-800/80 bg-slate-900/40 mt-auto shrink-0 flex ${collapsed ? 'flex-col items-center gap-3' : 'items-center gap-2'}`}>
            {hasAccess('Settings') ? (
              <Link
                to="/settings"
                title="Admin Settings"
                className="flex items-center gap-3 p-2 rounded-xl border border-slate-800 text-slate-350 hover:text-white transition-all duration-300 hover:bg-slate-850/60 w-full justify-center animate-all"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-sm border border-slate-700">
                    {userInitial}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0 flex flex-col text-left">
                    <span className="text-[13px] font-bold truncate uppercase tracking-tight leading-tight text-white">
                      {userName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      {user.role || 'Administrator'}
                    </span>
                  </div>
                )}
              </Link>
            ) : (
              <div
                title="User Profile"
                className="flex items-center gap-3 p-2 rounded-xl border border-slate-800 text-slate-350 w-full justify-center cursor-default bg-slate-900/10"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-sm border border-slate-700">
                    {userInitial}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0 flex flex-col text-left">
                    <span className="text-[13px] font-bold truncate uppercase tracking-tight leading-tight text-white">
                      {userName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      {user.role || 'Trainer'}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className={`p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 ${collapsed ? 'w-9 h-9 flex items-center justify-center' : ''}`}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Floating Mobile Toggle Button */}
        <button
          className="lg:hidden fixed top-4 left-4 z-40 bg-white hover:bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-gray-200/80 shadow-md flex items-center justify-center transition-all shadow-indigo-500/10"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Live Support Floating Chat Widget for trainers and sub-admins */}
      {user && user.role !== 'Admin' && user.role !== 'Administrator' && user.role !== 'Super Admin' && (
        <LiveSupport />
      )}
    </div>
  );
};

export default Layout;
