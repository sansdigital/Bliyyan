import { Link, usePage } from '@inertiajs/react';
import { ToastProvider } from '@/Components/Toast';
import { useState, useEffect } from 'react';

// ─── Inline SVG Icons (no lucide dependency needed) ───────────────────────────
const Icon = ({ d, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={d} />
    </svg>
);

const icons = {
    dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    products:  'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    category:  'M4 6h16M4 10h16M4 14h16M4 18h16',
    groups:    'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    orders:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    reports:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    vouchers:  'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z',
    website:   'M3 12a9 9 0 1118 0 9 9 0 01-18 0m9-9v18M3 12h18M4.5 4.5C6.333 7 7.5 9.5 7.5 12s-1.167 5-2.958 7.5M19.5 4.5C17.667 7 16.5 9.5 16.5 12s1.167 5 2.958 7.5',
    menu:      'M4 6h16M4 12h16m-7 6h7',
    close:     'M6 18L18 6M6 6l12 12',
    chevron:   'M9 5l7 7-7 7',
    user:      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    logout:    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

const navSections = [
    {
        section: null,
        items: [
            { label: 'Dashboard',    icon: 'dashboard', route: 'admin.dashboard',          match: 'admin.dashboard' },
        ]
    },
    {
        section: 'Catalog',
        items: [
            { label: 'Products',       icon: 'products',  route: 'admin.products.index',     match: 'admin.products.*' },
            { label: 'Categories',     icon: 'category',  route: 'admin.categories.index',   match: 'admin.categories.*' },
            { label: 'Groups & Icons',  icon: 'groups',    route: 'admin.category-groups.index', match: 'admin.category-groups.*' },
        ]
    },
    {
        section: 'Transactions',
        items: [
            { label: 'Pi Orders',    icon: 'orders',    route: 'admin.orders.index',       match: 'admin.orders.*' },
            { label: 'Vouchers',     icon: 'vouchers',  route: 'admin.vouchers.index',     match: 'admin.vouchers.*' },
            { label: 'Reports',      icon: 'reports',   route: 'admin.reports.index',      match: 'admin.reports.*' },
        ]
    },
    {
        section: 'General',
        items: [
            { label: 'Go to Website', icon: 'website',   href: '/' },
        ]
    }
];

export default function AdminLayout({ children, user }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            setIsSidebarOpen(!mobile);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Detect active page title
    let pageTitle = 'Admin Panel';
    navSections.forEach(section => {
        section.items.forEach(item => {
            if (item.match && route().current(item.match)) {
                pageTitle = item.label;
            }
        });
    });

    return (
        <ToastProvider>
        <div className="min-h-screen bg-[#F8F9FE] flex font-sans">

            {/* Mobile sidebar overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── SIDEBAR ── */}
            <aside className={`
                fixed inset-y-0 left-0 bg-slate-900 z-50 flex-shrink-0
                flex flex-col border-r border-white/5
                transition-all duration-300 ease-in-out
                ${isSidebarOpen
                    ? 'w-64 translate-x-0'
                    : isMobile ? '-translate-x-full w-64' : 'w-[72px] translate-x-0'}
                lg:static lg:block
            `}>

                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-shopee-gold flex items-center justify-center font-black text-slate-900 text-lg flex-shrink-0 shadow-lg shadow-shopee-gold/30">
                            B
                        </div>
                        {isSidebarOpen && (
                            <span className="text-white font-black text-base tracking-tight whitespace-nowrap overflow-hidden">
                                Bliyyan <span className="text-shopee-gold">Admin</span>
                            </span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
                    {navSections.map((section, si) => (
                        <div key={si} className={si > 0 ? 'mt-6' : ''}>
                            {/* Section label */}
                            {isSidebarOpen && section.section && (
                                <p className="px-3 mb-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                    {section.section}
                                </p>
                            )}
                            {/* Items */}
                            {section.items.map((item, ii) => {
                                const isActive = item.match
                                    ? route().current(item.match)
                                    : false;

                                const cls = `
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-shopee-gold text-slate-900 shadow-lg shadow-shopee-gold/25'
                                        : 'text-white/60 hover:bg-white/8 hover:text-white'}
                                    ${!isSidebarOpen ? 'justify-center' : ''}
                                `;

                                const content = (
                                    <>
                                        <Icon
                                            d={icons[item.icon]}
                                            className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-slate-900' : 'text-white/50 group-hover:text-white'}`}
                                        />
                                        {isSidebarOpen && (
                                            <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
                                        )}
                                    </>
                                );

                                if (item.href) {
                                    return (
                                        <a key={ii} href={item.href} className={cls}>
                                            {content}
                                        </a>
                                    );
                                }

                                return (
                                    <Link key={ii} href={route(item.route)} className={cls}>
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User panel at bottom */}
                <div className={`border-t border-white/10 p-3 flex-shrink-0 ${isSidebarOpen ? '' : 'flex justify-center'}`}>
                    <div className={`flex items-center gap-3 ${isSidebarOpen ? '' : 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-shopee-gold/20 border border-shopee-gold/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-shopee-gold font-black text-sm">{user?.name?.charAt(0) || 'A'}</span>
                        </div>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate">{user?.name}</p>
                                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Administrator</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── MAIN AREA ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Sidebar toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <Icon d={isSidebarOpen && !isMobile ? icons.close : icons.menu} className="w-5 h-5" />
                        </button>
                        <h1 className="text-base font-black text-gray-900 uppercase tracking-tight hidden sm:block">
                            {pageTitle}
                        </h1>
                    </div>

                    {/* Right: profile */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-xl transition-all active:scale-95"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-shopee-gold text-shopee-gold flex items-center justify-center font-black text-sm shadow-md">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-black text-gray-900 leading-none">{user?.name}</p>
                                <p className="text-[10px] text-shopee-gold font-bold uppercase tracking-widest leading-none mt-0.5">Admin</p>
                            </div>
                            <Icon d={icons.chevron} className="w-4 h-4 text-gray-400 hidden sm:block rotate-90" />
                        </button>

                        {/* Dropdown */}
                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Logged in as</p>
                                        <p className="text-sm font-black text-gray-800 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        href={route('profile.edit')}
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-shopee-gold transition-all"
                                    >
                                        <Icon d={icons.user} className="w-4 h-4" />
                                        Edit Profile
                                    </Link>
                                    <Link
                                        href="/"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-shopee-gold transition-all"
                                    >
                                        <Icon d={icons.website} className="w-4 h-4" />
                                        View Website
                                    </Link>
                                    <div className="border-t border-gray-50 mt-1" />
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <Icon d={icons.logout} className="w-4 h-4" />
                                        Sign Out
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#F8F9FE]">
                    {children}
                </main>
            </div>
        </div>
        </ToastProvider>
    );
}
