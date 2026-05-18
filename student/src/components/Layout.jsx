import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    User,
    LogOut,
    Menu,
    X,
    GraduationCap,
    Bell,
    ChevronDown,
    Settings,
    Code2,
    ChevronLeft,
    ChevronRight,
    QrCode,
    Calendar, // Import Calendar
    Keyboard,
    Bot,
    Trophy,
    Sparkles,
    Shield,
    ExternalLink,
    Briefcase,
    AlertCircle,
    CreditCard,
    Coins,
    BotIcon,
    Video
} from 'lucide-react';
import {
    AiOutlineDashboard,
    AiOutlineTrophy,
    AiOutlineBook,
    AiOutlineDollarCircle,
    AiOutlineCrown,
    AiOutlineGift,
    AiOutlineUser,
    AiOutlineSetting
} from 'react-icons/ai';
import {
    FcComboChart,
    FcReading,
    FcCalendar,
    FcCustomerSupport,
    FcBriefcase,
    FcMoneyTransfer,
    FcRating,
    FcBusinessman,
    FcSettings,
    FcSportsMode
} from 'react-icons/fc';


import axios from 'axios';
import logoImg from '../assets/logo.jpeg';
import { subscribeToPush } from '../utils/pushNotifications';
import SpotlightModal from './SpotlightModal';
import LiveSupport from './LiveSupport';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [completedTasks, setCompletedTasks] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [dailyRank, setDailyRank] = useState(null);
    const [weeklyRank, setWeeklyRank] = useState(null);
    const [wallet, setWallet] = useState({ totalPoints: 0, totalCoins: 0, level: 1 });

    const navigate = useNavigate();
    const location = useLocation();

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!user?._id) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const { data } = await axios.get(`${API_URL}/api/notifications?studentId=${user._id}`);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user?._id]);

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                await axios.put(`${API_URL}/api/notifications/${notif._id}/read`);
                // Update local state to reflect read status instantly
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error(error);
            }
        }
        if (notif.link) navigate(notif.link);
        setShowNotifications(false);
    };

    useEffect(() => {
        // Fetch user from Local Storage
        const storedUserString = localStorage.getItem('studentUser');
        if (storedUserString) {
            const storedUser = JSON.parse(storedUserString);
            setUser(storedUser);

            // Fetch fresh user data to update permissions
            const fetchLatestUser = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const { data } = await axios.get(`${API_URL}/api/students/${storedUser._id}`);

                    // Preserve the token if it exists in the stored object (though current login response structure doesn't seem to show a separate token field, assuming 'user' object is stored)
                    // Based on login route: res.json({ success:true, user: {...} })
                    // So localStorage likely just holds the user object.

                    if (data) {
                        if (data.status !== 'Active') {
                            localStorage.removeItem('studentUser');
                            navigate('/login', { state: { error: 'Your account is inactive. Please contact support.' } });
                            return;
                        }

                        const updatedUser = {
                            _id: data._id,
                            name: data.name,
                            email: data.email,
                            access: data.access,
                            courseName: data.courseName,
                            // Keep other fields if needed
                            ...data
                        };

                        setUser(updatedUser);
                        localStorage.setItem('studentUser', JSON.stringify(updatedUser));

                        // Subscribe to push notifications globally
                        subscribeToPush(updatedUser._id);
                    }
                } catch (error) {
                    console.error("Failed to refresh user data:", error);
                    if (error.response && error.response.status === 404) {
                        localStorage.removeItem('studentUser');
                        navigate('/login');
                    }
                }
            };
            fetchLatestUser();

        } else {
            navigate('/login');
        }

        // Fetch company settings
        const fetchSettings = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/settings`);
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };
        fetchSettings();
    }, [navigate]);

    // Fetch Stats when user is set
    useEffect(() => {
        if (!user || !user._id) return;

        const fetchStats = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                // 1. Fetch Progress
                // We need courseId first.
                if (user.courseName) {
                    const coursesRes = await axios.get(`${API_URL}/api/courses`);
                    const course = coursesRes.data.find(c => c.title === user.courseName);

                    if (course) {
                        const progressRes = await axios.get(`${API_URL}/api/student/progress/${course._id}/${user._id}`);
                        if (progressRes.data && progressRes.data.progress) {
                            const completed = progressRes.data.progress.filter(p => p.completed).length;
                            setCompletedTasks(completed);
                        }
                    }
                }

            } catch (err) {
                console.error("Failed to fetch stats:", err);
            }
        };

        fetchStats();
    }, [user?._id, user?.courseName]);

    useEffect(() => {
        const fetchRanks = async () => {
            if (!user?._id) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const [weeklyRes, dailyRes] = await Promise.all([
                    axios.get(`${API_URL}/api/students/leaderboard?studentId=${user._id}&period=weekly`),
                    axios.get(`${API_URL}/api/students/leaderboard?studentId=${user._id}&period=daily`)
                ]);

                if (weeklyRes.data.success) {
                    const myInfo = weeklyRes.data.leaderboard.find(s => s.id === user._id);
                    if (myInfo) setWeeklyRank(myInfo);
                }
                if (dailyRes.data.success) {
                    const myInfo = dailyRes.data.leaderboard.find(s => s.id === user._id);
                    if (myInfo) setDailyRank(myInfo);
                }
            } catch (err) { console.error("Failed to fetch ranks:", err); }
        };

        const fetchWallet = async () => {
            if (!user?._id) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/rewards/wallet/${user._id}`);
                if (data.success) {
                    setWallet({
                        totalPoints: data.totalPoints,
                        totalCoins: data.totalCoins,
                        level: data.level
                    });
                }
            } catch (err) { console.error("Failed to fetch wallet:", err); }
        };

        fetchRanks();
        fetchWallet();

        // Real-time synchronization event listener
        const handleSync = () => {
            fetchRanks();
            fetchWallet();
        };
        window.addEventListener('finwise-activity-sync', handleSync);

        const interval = setInterval(() => {
            fetchRanks();
        }, 60000 * 5); // Check every 5 mins
        return () => {
            clearInterval(interval);
            window.removeEventListener('finwise-activity-sync', handleSync);
        };
    }, [user?._id]);

    const handleLogout = async () => {
        localStorage.removeItem('studentUser'); // Clear local session
        navigate('/login');
    };

    const allNavItems = [
        { icon: (p) => <AiOutlineDashboard {...p} />, label: 'Dashboard', path: '/dashboard', accessKey: 'dashboard', end: true },
        { icon: (p) => <AiOutlineTrophy {...p} />, label: 'Leaderboard', path: '/leaderboard', accessKey: 'dashboard' },
        {
            icon: (p) => <AiOutlineBook {...p} />,
            label: 'Learning',
            children: [
                { label: 'My Courses', path: '/courses', accessKey: 'myCourses', icon: (p) => <BookOpen {...p} /> },
                { label: 'Study Materials', path: '/materials', accessKey: 'myCourses', icon: (p) => <GraduationCap {...p} /> },
                { label: 'Typing Practice', path: '/typing-practice', accessKey: 'typingPractice', icon: (p) => <Keyboard {...p} /> }
            ]
        },
        { icon: (p) => <AiOutlineDollarCircle {...p} />, label: 'Payments', path: '/payments', accessKey: 'payments' },
        { icon: (p) => <AiOutlineCrown {...p} />, label: 'Subscription', path: '/subscription', accessKey: 'dashboard' },
        { icon: (p) => <AiOutlineGift {...p} />, label: 'Reward Store', path: '/reward-store', accessKey: 'dashboard' },
        { icon: (p) => <AiOutlineSetting {...p} />, label: 'Settings', path: '/settings', accessKey: 'settings' },
    ];

    // Filter items based on user access + subscription status
    const navItems = allNavItems.map(item => {
        if (item.children) {
            return {
                ...item,
                children: item.children.filter(child => {
                    const hasDefaultAccess = user?.access?.[child.accessKey];
                    const isSubscribed = user?.isSubscribed;

                    // Specific logic for Typing Practice: ONLY Premium/Platinum/Full (Level 3)
                    if (child.accessKey === 'typingPractice') {
                        const GLOBAL_TIERS = { 'Premium': 3, 'Platinum': 3, 'Full': 3, 'Intermediate': 2, 'Gold': 2, 'Basic': 1 };
                        const studentLevel = GLOBAL_TIERS[user?.planTier] || 0;
                        return isSubscribed && studentLevel >= 3;
                    }

                    // My Courses should be accessible if any subscription is active
                    if (isSubscribed && child.accessKey === 'myCourses') {
                        return true;
                    }

                    return hasDefaultAccess;
                })
            };
        }
        return item;
    }).filter(item => {
        if (!user || !user.access) return false;
        if (item.children) {
            return item.children.length > 0;
        }

        // Handle flat items
        const isSubscribed = user?.isSubscribed;
        if (isSubscribed && (item.accessKey === 'payments' || item.accessKey === 'myCourses')) {
            return true;
        }

        return user.access[item.accessKey] !== false;
    });

    const flatNavItems = allNavItems.flatMap(item => item.children ? item.children : [item]);

    const [collapsed, setCollapsed] = useState(false);
    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (label) => {
        setOpenMenus(prev => ({ [label]: !prev[label] }));
    };

    // ... (existing hooks)

    return (
        <div className="h-screen w-full bg-gray-50 flex overflow-hidden">
            <SpotlightModal />
            <LiveSupport />
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 shadow-2xl lg:shadow-none transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } ${collapsed ? 'w-20' : 'w-72'}`}
            >
                {/* Logo Area */}
                <div className={`h-20 flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-6'} border-b border-slate-800 relative shrink-0`}>
                    <div className="flex items-center gap-3">
                        <img
                            src={settings?.logoUrl || logoImg}
                            alt="Finwise Logo"
                            className="h-10 w-10 object-contain rounded-xl drop-shadow-sm shrink-0"
                        />
                        {!collapsed && (
                            <div className="transition-opacity duration-300 overflow-hidden">
                                <span className="block text-lg font-extrabold tracking-tight text-slate-100 leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 whitespace-nowrap">
                                    {settings?.siteTitle || 'Finwise Career Solutions'}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5 block">Student Portal</span>
                            </div>
                        )}
                    </div>

                    {/* Desktop collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-850 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white shadow-sm hover:shadow transition-colors z-50"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    {/* Mobile close */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-800 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {navItems.map((item) => (
                        item.children ? (
                            /* ---- Category / Dropdown group ---- */
                            <div
                                key={item.label}
                                className="space-y-1"
                            >
                                <button
                                    onClick={() => {
                                        if (collapsed) setCollapsed(false);
                                        else toggleMenu(item.label);
                                    }}
                                    title={collapsed ? item.label : ''}
                                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group/catBtn ${openMenus[item.label]
                                        ? 'bg-slate-800/60 shadow-sm ring-1 ring-slate-800/30'
                                        : 'hover:bg-slate-800/40'
                                        }`}
                                >
                                    {/* Left accent bar when open */}
                                    {openMenus[item.label] && !collapsed && (
                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
                                    )}

                                    <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'} relative z-10`}>
                                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${openMenus[item.label]
                                            ? 'bg-slate-800 text-indigo-400 shadow-inner'
                                            : 'bg-slate-800/40 text-slate-400 group-hover/catBtn:bg-slate-800 group-hover/catBtn:text-indigo-450 group-hover/catBtn:shadow-sm'
                                            }`}>
                                            {(() => { const NavIcon = item.icon; return <NavIcon size={18} strokeWidth={openMenus[item.label] ? 2.5 : 2} className="transition-transform duration-300 group-hover/catBtn:scale-110" />; })()}
                                        </div>
                                        {!collapsed && (
                                            <span className={`text-[13px] font-bold tracking-wide transition-colors ${openMenus[item.label] ? 'text-indigo-300' : 'text-slate-400 group-hover/catBtn:text-slate-200'
                                                }`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>

                                    {!collapsed && (
                                        <div className={`p-1 rounded-md transition-colors ${openMenus[item.label] ? 'bg-slate-800 text-indigo-400' : 'bg-transparent text-slate-400 group-hover/catBtn:bg-slate-800'
                                            }`}>
                                            <ChevronDown size={14} className={`transition-transform duration-300 ${openMenus[item.label] ? 'rotate-180' : ''}`} />
                                        </div>
                                    )}
                                </button>

                                {/* Children with connecting line tree */}
                                {!collapsed && (
                                    <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${openMenus[item.label] ? 'max-h-96 opacity-100 mt-1.5' : 'max-h-0 opacity-0'
                                        }`}>
                                        <div className="flex flex-col gap-0.5 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800 before:-z-10 pl-2 pr-1 pb-1">
                                            {item.children.map(child => (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    end={child.end}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={({ isActive }) =>
                                                        `group flex items-center gap-2.5 pl-8 pr-4 py-2.5 rounded-xl transition-all duration-200 relative w-full ${isActive
                                                            ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold shadow-md shadow-orange-500/20'
                                                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 font-medium'
                                                        }`
                                                    }
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            {/* Horizontal connecting tick */}
                                                            <div className={`absolute left-[17px] w-3 h-[2px] rounded-r-full transition-colors ${isActive ? 'bg-white' : 'bg-transparent group-hover:bg-slate-700'
                                                                }`} />
                                                            
                                                            {/* Child Icon */}
                                                            {child.icon && (
                                                                <div className={`transition-colors duration-200 shrink-0 relative z-10 ${
                                                                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-350'
                                                                }`}>
                                                                    {(() => { const ChildIcon = child.icon; return <ChildIcon size={13} className="transition-transform duration-300 group-hover:scale-110" />; })()}
                                                                </div>
                                                            )}

                                                            <span className={`text-[13px] tracking-wide flex-1 relative z-10 transition-transform ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'
                                                                }`}>
                                                                {child.label}
                                                            </span>
                                                            {isActive && (
                                                                <div className="absolute inset-0 bg-white/10 opacity-50 rounded-xl" />
                                                            )}
                                                        </>
                                                    )}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ---- Single flat nav link ---- */
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                onClick={() => setSidebarOpen(false)}
                                title={collapsed ? item.label : ''}
                                className={({ isActive }) =>
                                    `group flex items-center px-3.5 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                                        ? 'active-nav bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold shadow-md shadow-orange-500/20'
                                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 font-medium'
                                    }`
                                }
                            >
                                {/* Left glow bar — visible only when active (via .active-nav parent) */}
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-8 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-[.active-nav]:w-1.5 group-[.active-nav]:opacity-100 transition-all duration-300" />

                                <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3.5'} relative z-10 w-full`}>
                                    <div className="p-1.5 rounded-lg transition-all duration-300 bg-slate-800/40 text-slate-400 group-hover:bg-slate-800 group-hover:text-orange-400 group-[.active-nav]:bg-white/20 group-[.active-nav]:text-white group-[.active-nav]:shadow-inner relative">
                                        {(() => { const NavIcon = item.icon; return <NavIcon size={18} className="transition-transform duration-300 group-hover:scale-110" />; })()}
                                    </div>
                                    {!collapsed && (
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-sm tracking-wide">{item.label}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Subtle gradient overlay when active */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-[.active-nav]:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                            </NavLink>
                        )
                    ))}
                </nav>

                {/* Sidebar Footer - Dedicated Profile Tab Card */}
                {user && (
                    <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 mt-auto shrink-0">
                        <NavLink
                            to="/profile"
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-2 rounded-xl transition-all duration-300 group border ${
                                    isActive
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-400 border-orange-500 text-white shadow-md shadow-orange-500/10'
                                        : 'hover:bg-slate-850/60 border-slate-800 text-slate-350 hover:text-white'
                                }`
                            }
                        >
                            <div className="relative shrink-0">
                                {user.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full object-cover border border-white/20"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-sm border border-slate-700">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
                            </div>

                            {!collapsed && (
                                <div className="flex-1 min-w-0 flex flex-col text-left">
                                    <span className="text-[13px] font-bold truncate uppercase tracking-tight leading-tight text-white">
                                        {user.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 group-[.active-nav]:text-orange-100 font-semibold uppercase tracking-wider mt-0.5">
                                        {user.planTier || 'Basic'} Tier
                                    </span>
                                </div>
                            )}

                            {!collapsed && (
                                <AiOutlineUser size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                            )}
                        </NavLink>
                    </div>
                )}
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Floating Mobile Toggle Button */}
                <button
                    className="lg:hidden fixed top-4 left-4 z-40 bg-white hover:bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-gray-200/80 shadow-md flex items-center justify-center transition-all animate-bounce-subtle"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={20} />
                </button>

                {/* Page Content (Scrollable Area) */}
                <main className={`flex-1 scroll-smooth ${
                    location.pathname.includes('/playground')
                        ? 'p-0 overflow-hidden'
                        : location.pathname.includes('/leaderboard')
                            ? 'p-0 overflow-y-auto'
                            : location.pathname.includes('/dashboard')
                                ? 'p-0 overflow-y-auto xl:overflow-hidden'
                                : 'p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto'
                }`}>
                    <div className={(location.pathname.includes('/playground') || location.pathname.includes('/leaderboard') || location.pathname.includes('/dashboard')) ? 'w-full h-full' : 'max-w-7xl mx-auto'}>
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 pb-safe">
                    <div className="flex items-center justify-around px-2 pb-1 pt-1">
                        {[
                            { icon: (p) => <AiOutlineDashboard {...p} />, label: 'Home', path: '/dashboard', exact: false },
                            { icon: (p) => <AiOutlineBook {...p} />, label: 'Learn', path: '/courses' },
                            { icon: (p) => <AiOutlineTrophy {...p} />, label: 'Ranks', path: '/leaderboard' },
                            { icon: (p) => <AiOutlineUser {...p} />, label: 'Profile', path: '/profile' }
                        ].map((tab) => {
                            const isActive = tab.exact ? location.pathname === tab.path : location.pathname.startsWith(tab.path);
                            return (
                                <button
                                    key={tab.path}
                                    onClick={() => navigate(tab.path)}
                                    className={`flex flex-col items-center justify-center w-full py-2 px-1 transition-colors ${isActive ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-50 font-bold' : 'bg-transparent'}`}>
                                        {(() => { const TabIcon = tab.icon; return <TabIcon size={20} className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm scale-110 text-orange-600' : 'text-slate-450'}`} />; })()}
                                    </div>
                                    <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>


        </div>
    );
};

export default Layout;
