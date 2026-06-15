import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    IndianRupee, TrendingUp, TrendingDown, Users, Wallet, AlertCircle,
    Loader, FileText, GraduationCap, MessageSquare, Layers,
    CalendarCheck, Clock, CheckCircle2, PhoneCall, UserCheck,
    BarChart2, BookOpen, ChevronRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B', '#0EA5E9', '#F97316'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Shared helpers ─────────────────────────────────────────────────────────

const Spinner = () => (
    <div className="flex items-center justify-center min-h-[40vh]">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

const EmptyState = ({ message = 'No data yet' }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-slate-400 text-sm gap-2">
        <BarChart2 size={28} className="opacity-30" />
        {message}
    </div>
);

function StatCard({ title, value, sub, icon: Icon, iconColor, iconBg, trend, trendPositive }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendPositive ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                        {trendPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend}
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ user: propUser }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const [studentsRes, batchRes, inquiriesRes, financeRes, meetingsRes] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/students/list`),
                    axios.get(`${API_URL}/api/batches`),
                    axios.get(`${API_URL}/api/inquiries`),
                    axios.get(`${API_URL}/api/finance/dashboard?filter=month`),
                    axios.get(`${API_URL}/api/admin/meetings`),
                ]);

                const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data : [];
                const batches = batchRes.status === 'fulfilled' ? (batchRes.value.data.batches || []) : [];
                const inquiries = inquiriesRes.status === 'fulfilled' ? inquiriesRes.value.data : [];
                const finance = financeRes.status === 'fulfilled' ? financeRes.value.data.summaryStats : {};
                const meetings = meetingsRes.status === 'fulfilled' ? meetingsRes.value.data : [];

                const now = new Date();
                const upcoming = (Array.isArray(meetings) ? meetings : []).filter(m => new Date(m.dateTime || m.date) > now);
                const newInq = inquiries.filter(i => i.status === 'new').length;

                // Recent items
                const recentStudents = [...students]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);
                const recentInquiries = [...inquiries]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);

                // A batch is "running now" when today is between its startDate and endDate
                const activeBatches = batches.filter(b => {
                    const start = new Date(b.startDate);
                    const end = new Date(b.endDate);
                    return start <= now && end >= now;
                }).length;
                const upcomingBatches = batches.filter(b => new Date(b.startDate) > now).length;

                setStats({
                    totalStudents: students.length,
                    activeBatches,
                    upcomingBatches,
                    newInquiries: newInq,
                    feesThisMonth: finance.totalFeesCollected || 0,
                    pendingFees: finance.pendingFees || 0,
                    upcomingMeetings: upcoming.length,
                    recentStudents,
                    recentInquiries,
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const navigate = useNavigate();

    const handleCardClick = (path, permissionKey) => {
        if (!user) return;
        const isAuthorized =
            user.role === 'Administrator' ||
            user.role === 'Super Admin' ||
            user.role === 'Admin' ||
            !permissionKey ||
            (user.access && !!user.access[permissionKey]);

        if (isAuthorized) {
            navigate(path);
        } else {
            toast.error("Access denied. You do not have permission to view that page.");
        }
    };

    if (loading) return <Spinner />;
    if (!stats) return <EmptyState message="Could not load overview" />;

    const user = propUser || (() => {
        try {
            const stored = localStorage.getItem('adminUser');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error(e);
            return null;
        }
    })();

    const hasPermission = (key) => {
        if (!user) return true;
        if (user.role === 'Administrator' || user.role === 'Super Admin' || user.role === 'Admin') return true;

        if (key === 'students') return user.access ? !!user.access.dashboardStudents : false;
        if (key === 'finance') return user.access ? !!user.access.dashboardFinance : false;
        if (key === 'inquiries') return user.access ? !!user.access.dashboardInquiries : false;
        if (key === 'meetings') return true; // Meetings always visible
        return false;
    };

    const kpis = [
        { title: 'Total Students', value: stats.totalStudents, icon: GraduationCap, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50', sub: 'All enrolled', key: 'students', path: '/students', permissionKey: 'studentsList' },
        { title: 'Active Batches', value: stats.activeBatches, icon: Layers, iconColor: 'text-violet-600', iconBg: 'bg-violet-50', sub: `${stats.upcomingBatches} upcoming`, key: 'students', path: '/batches', permissionKey: 'batchStudents' },
        { title: 'New Inquiries', value: stats.newInquiries, icon: MessageSquare, iconColor: 'text-rose-600', iconBg: 'bg-rose-50', sub: 'Awaiting response', trend: 'New', trendPositive: false, key: 'inquiries', path: '/inquiries', permissionKey: 'inquiries' },
        { title: 'Fees This Month', value: `₹${stats.feesThisMonth.toLocaleString()}`, icon: IndianRupee, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', trend: 'Collected', trendPositive: true, key: 'finance', path: '/fees', permissionKey: 'feeManagement' },
        { title: 'Upcoming Meetings', value: stats.upcomingMeetings, icon: CalendarCheck, iconColor: 'text-sky-600', iconBg: 'bg-sky-50', sub: 'Scheduled ahead', key: 'meetings', path: '/meetings', permissionKey: '' },
    ];

    const allowedKpis = kpis.filter(k => hasPermission(k.key));

    return (
        <div className="space-y-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {allowedKpis.map((k, i) => (
                    <div
                        key={i}
                        onClick={() => handleCardClick(k.path, k.permissionKey)}
                        className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <StatCard {...k} />
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            {(hasPermission('students') || hasPermission('inquiries')) && (
                <div className={`grid grid-cols-1 ${hasPermission('students') && hasPermission('inquiries') ? 'lg:grid-cols-2' : ''} gap-6`}>
                    {/* Recent Enrollments */}
                    {hasPermission('students') && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><GraduationCap size={16} className="text-indigo-500" /> Recent Enrollments</h3>
                                <span className="text-xs text-slate-400">Last 5</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats.recentStudents.length > 0 ? stats.recentStudents.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 px-6 py-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {s.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{s.courseName || 'No course'}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 shrink-0">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</span>
                                    </div>
                                )) : <div className="px-6 py-8 text-center text-slate-400 text-sm">No students yet</div>}
                            </div>
                        </div>
                    )}

                    {/* Recent Inquiries */}
                    {hasPermission('inquiries') && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={16} className="text-rose-500" /> Recent Inquiries</h3>
                                <span className="text-xs text-slate-400">Last 5</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats.recentInquiries.length > 0 ? stats.recentInquiries.map((inq, i) => (
                                    <div key={i} className="flex items-center gap-3 px-6 py-3">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${inq.status === 'new' ? 'bg-rose-500' : inq.status === 'contacted' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{inq.name || 'Anonymous'}</p>
                                            <p className="text-xs text-slate-400 truncate">{inq.phone || inq.email || '—'}</p>
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${inq.status === 'new' ? 'bg-rose-50 text-rose-600' : inq.status === 'contacted' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {inq.status || 'new'}
                                        </span>
                                    </div>
                                )) : <div className="px-6 py-8 text-center text-slate-400 text-sm">No inquiries yet</div>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── FINANCE TAB ─────────────────────────────────────────────────────────────

function FinanceTab() {
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all');
    const [data, setData] = useState({ summaryStats: { totalFeesCollected: 0, pendingFees: 0, pendingCount: 0, totalExpenses: 0, netProfit: 0, overdueFees: 0 }, charts: { incomeVsExpenseData: [], expenseCategoryData: [] } });

    useEffect(() => { fetchData(); }, [timeFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/finance/dashboard?filter=${timeFilter}`);
            setData(res.data);
        } catch (e) { toast.error('Failed to load finance data'); }
        finally { setLoading(false); }
    };

    const downloadReport = () => {
        const doc = new jsPDF();
        doc.setFontSize(20); doc.setTextColor(40, 40, 40);
        doc.text('Financial Overview Report', 14, 22);
        doc.setFontSize(11); doc.setTextColor(100, 100, 100);
        const filterText = timeFilter === 'month' ? 'This Month' : timeFilter === 'year' ? 'This Year' : 'All Time';
        doc.text(`Generated on: ${new Date().toLocaleDateString()} | Filter: ${filterText}`, 14, 30);
        autoTable(doc, {
            startY: 40,
            head: [['Financial Metric', 'Amount (INR)']],
            body: [
                ['Total Fees Collected', `Rs. ${data.summaryStats.totalFeesCollected.toLocaleString()}`],
                ['Total Expenses', `Rs. ${data.summaryStats.totalExpenses.toLocaleString()}`],
                ['Net Profit', `Rs. ${data.summaryStats.netProfit.toLocaleString()}`],
            ],
            theme: 'grid', headStyles: { fillColor: [59, 130, 246] },
        });
        if (data.charts.expenseCategoryData.length > 0) {
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 15,
                head: [['Expense Category', 'Amount (INR)']],
                body: data.charts.expenseCategoryData.map(c => [c.name, `Rs. ${c.value.toLocaleString()}`]),
                theme: 'striped', headStyles: { fillColor: [239, 68, 68] },
            });
        }
        doc.save(`Financial_Report_${filterText.replace(' ', '_')}.pdf`);
        toast.success('Report downloaded successfully');
    };

    if (loading) return <Spinner />;
    const { summaryStats, charts } = data;

    const summaryCards = [
        { title: 'Total Fees Collected', value: `₹${summaryStats.totalFeesCollected.toLocaleString()}`, trend: 'All time', isPositive: true, icon: IndianRupee, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
        { title: 'Total Expenses', value: `₹${summaryStats.totalExpenses.toLocaleString()}`, trend: 'All time', isPositive: true, icon: Wallet, color: 'text-red-500', bgColor: 'bg-red-50' },
        { title: 'Net Profit', value: `₹${summaryStats.netProfit.toLocaleString()}`, trend: 'Estimated', isPositive: summaryStats.netProfit >= 0, icon: summaryStats.netProfit >= 0 ? TrendingUp : TrendingDown, color: summaryStats.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500', bgColor: summaryStats.netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Financial Overview</h2>
                    <p className="text-sm text-slate-500 mt-1">Track fees, expenses, and profitability.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-700 py-2 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium shadow-sm">
                        <option value="all">All Time</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <button onClick={downloadReport} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <FileText size={16} /> Download Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {summaryCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}><Icon className={`w-6 h-6 ${stat.color}`} /></div>
                                <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${stat.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                    {stat.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {stat.trend}
                                </div>
                            </div>
                            <div className="mt-5">
                                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Income vs Expenses</h3>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Last 6 Months</span>
                    </div>
                    <div className="h-[300px]">
                        {charts.incomeVsExpenseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={charts.incomeVsExpenseData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={v => `₹${v / 1000}k`} />
                                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="income" name="Income" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState message="Not enough data to graph" />}
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Expense Breakdown</h3>
                    <div className="h-[240px] relative">
                        {charts.expenseCategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie data={charts.expenseCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {charts.expenseCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <EmptyState message="No expenses yet" />}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm text-slate-500">Total</span>
                            <span className="text-xl font-bold text-slate-900">₹{charts.expenseCategoryData.reduce((a, c) => a + c.value, 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3 max-h-[120px] overflow-y-auto pr-2">
                        {charts.expenseCategoryData.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-slate-600 font-medium truncate w-24">{cat.name}</span>
                                </div>
                                <span className="text-slate-900 font-semibold">₹{cat.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── STUDENTS TAB ────────────────────────────────────────────────────────────

function StudentsTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const [studentsRes, attendanceRes] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/students/list`),
                    axios.get(`${API_URL}/api/attendance/today`),
                ]);
                const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data : [];
                const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data : [];

                // Course-wise enrollment
                const courseMap = {};
                students.forEach(s => {
                    const c = s.courseName || 'Unassigned';
                    courseMap[c] = (courseMap[c] || 0) + 1;
                });
                const courseData = Object.entries(courseMap)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);

                const presentToday = Array.isArray(attendance)
                    ? attendance.filter(a => a.status === 'present').length
                    : 0;

                const recentStudents = [...students]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 8);

                setData({
                    total: students.length,
                    active: students.filter(s => s.access && Object.values(s.access).some(Boolean)).length,
                    presentToday,
                    absentToday: Array.isArray(attendance) ? attendance.filter(a => a.status === 'absent').length : 0,
                    courseData,
                    recentStudents,
                });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return <Spinner />;
    if (!data) return <EmptyState message="Could not load student data" />;

    return (
        <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 max-w-2xl gap-4">
                <StatCard title="Total Students" value={data.total} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" sub="All enrolled" />
                <StatCard title="Active Students" value={data.active} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" sub="Has portal access" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course-wise enrollment bar chart */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2"><BookOpen size={16} className="text-indigo-500" /> Course-wise Enrollment</h3>
                    <div className="h-[260px]">
                        {data.courseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={data.courseData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} width={100} />
                                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" name="Students" fill="#6366F1" radius={[0, 4, 4, 0]} maxBarSize={24}>
                                        {data.courseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState message="No enrollment data yet" />}
                    </div>
                </div>

                {/* Recent Enrollments table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><GraduationCap size={16} className="text-indigo-500" />Recent Enrollments</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50">
                                <th className="px-6 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-left">Course</th>
                                <th className="px-4 py-3 text-left">Joined</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.recentStudents.map((s, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {s.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-medium text-slate-800 truncate max-w-[100px]">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 truncate max-w-[120px]">{s.courseName || '—'}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                                        </td>
                                    </tr>
                                ))}
                                {data.recentStudents.length === 0 && (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No students yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── INQUIRIES TAB ───────────────────────────────────────────────────────────

function InquiriesTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_URL}/api/inquiries`);
                const inquiries = res.data || [];

                // Status counts
                const statusMap = { new: 0, contacted: 0, converted: 0, closed: 0 };
                const courseMap = {};
                inquiries.forEach(inq => {
                    const s = inq.status || 'new';
                    if (statusMap[s] !== undefined) statusMap[s]++;
                    else statusMap[s] = 1;
                    const c = inq.course || inq.interestedCourse || 'General';
                    courseMap[c] = (courseMap[c] || 0) + 1;
                });

                const funnelData = [
                    { name: 'New', count: statusMap.new, color: '#EF4444' },
                    { name: 'Contacted', count: statusMap.contacted, color: '#F59E0B' },
                    { name: 'Converted', count: statusMap.converted, color: '#10B981' },
                    { name: 'Closed', count: statusMap.closed || 0, color: '#64748B' },
                ];

                const courseData = Object.entries(courseMap)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 6);

                const recent = [...inquiries]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10);

                setData({ total: inquiries.length, funnelData, courseData, recent, statusMap });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return <Spinner />;
    if (!data) return <EmptyState message="Could not load inquiry data" />;

    const statusConfig = {
        new: { label: 'New', color: 'bg-rose-50 text-rose-600' },
        contacted: { label: 'Contacted', color: 'bg-amber-50 text-amber-600' },
        converted: { label: 'Converted', color: 'bg-emerald-50 text-emerald-600' },
        closed: { label: 'Closed', color: 'bg-slate-100 text-slate-500' },
    };

    return (
        <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Inquiries" value={data.total} icon={MessageSquare} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
                <StatCard title="New / Pending" value={data.statusMap.new} icon={AlertCircle} iconColor="text-rose-600" iconBg="bg-rose-50" sub="Needs response" trend="Action needed" trendPositive={false} />
                <StatCard title="Contacted" value={data.statusMap.contacted} icon={PhoneCall} iconColor="text-amber-600" iconBg="bg-amber-50" sub="In progress" />
                <StatCard title="Converted" value={data.statusMap.converted} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" sub="Enrolled successfully" trend="Enrolled" trendPositive={true} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Funnel */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-5">Inquiry Pipeline</h3>
                    <div className="h-[240px]">
                        {data.funnelData.some(f => f.count > 0) ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={data.funnelData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        {data.funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState message="No inquiries yet" />}
                    </div>
                </div>

                {/* Course Interest Pie */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-5">Course Interest</h3>
                    <div className="flex gap-4 items-center">
                        <div className="h-[200px] w-[200px] shrink-0">
                            {data.courseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart>
                                        <Pie data={data.courseData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none">
                                            {data.courseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <EmptyState message="No data" />}
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px]">
                            {data.courseData.map((c, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-slate-600 truncate">{c.name}</span>
                                    </div>
                                    <span className="font-semibold text-slate-900 shrink-0 ml-2">{c.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Inquiries Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Recent Inquiries</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50">
                            <th className="px-6 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Phone</th>
                            <th className="px-4 py-3 text-left">Course</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Date</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.recent.map((inq, i) => {
                                const sc = statusConfig[inq.status] || statusConfig.new;
                                return (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-800">{inq.name || '—'}</td>
                                        <td className="px-4 py-3 text-slate-500">{inq.phone || '—'}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">{inq.course || inq.interestedCourse || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>{sc.label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                            {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.recent.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No inquiries yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── ROOT DASHBOARD ──────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'finance', label: 'Finance', icon: IndianRupee },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
];

export default function Dashboard() {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const stored = localStorage.getItem('adminUser');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error(e);
            return null;
        }
    });

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${API_URL}/api/admin/me`);
                if (res.data && res.data.success && res.data.user) {
                    const freshUser = res.data.user;
                    setCurrentUser(freshUser);
                    localStorage.setItem('adminUser', JSON.stringify(freshUser));
                }
            } catch (err) {
                console.error("Failed to sync user profile inside Dashboard", err);
            }
        };
        fetchMe();
    }, []);

    const hasAccess = (tabId) => {
        if (!currentUser) return true;
        if (currentUser.role === 'Administrator' || currentUser.role === 'Super Admin' || currentUser.role === 'Admin') return true;

        if (tabId === 'overview') return currentUser.access ? !!currentUser.access.dashboardOverview : true;
        if (tabId === 'finance') return currentUser.access ? !!currentUser.access.dashboardFinance : false;
        if (tabId === 'students') return currentUser.access ? !!currentUser.access.dashboardStudents : false;
        if (tabId === 'inquiries') return currentUser.access ? !!currentUser.access.dashboardInquiries : false;
        return false;
    };

    const allowedTabs = TABS.filter(tab => hasAccess(tab.id));

    const [activeTab, setActiveTab] = useState('overview');

    // Automatically keep activeTab selection bounded within allowedTabs when permissions change
    useEffect(() => {
        const allowed = TABS.filter(tab => hasAccess(tab.id));
        if (allowed.length > 0) {
            const isCurrentTabAllowed = allowed.some(t => t.id === activeTab);
            if (!isCurrentTabAllowed) {
                setActiveTab(allowed[0].id);
            }
        }
    }, [currentUser]);

    return (
        <div className="space-y-8">
            {/* Main Header / Tab Navigation */}
            {allowedTabs.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6 mb-2">
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
                        {allowedTabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 ${isActive
                                        ? 'bg-white text-indigo-700 shadow-md ring-1 ring-slate-200/50'
                                        : 'text-slate-500 hover:text-indigo-600 hover:bg-white/40'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Tab Content */}
            <div>
                {activeTab === 'overview' && <OverviewTab user={currentUser} />}
                {activeTab === 'finance' && <FinanceTab />}
                {activeTab === 'students' && <StudentsTab />}
                {activeTab === 'inquiries' && <InquiriesTab />}
            </div>
        </div>
    );
}
