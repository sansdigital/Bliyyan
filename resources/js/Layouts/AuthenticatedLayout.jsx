import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import BottomNav from '@/Components/BottomNav';
import { ToastProvider } from '@/Components/Toast';

export default function AuthenticatedLayout({ children, header }) {
    const { auth, cart_count } = usePage().props;
    const user = auth.user;
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.get(route('products.search'), { q: searchQuery.trim() });
        }
    };

    return (
        <ToastProvider>
        <div className="min-h-screen bg-zinc-100 flex justify-center w-full font-sans">
            <div className="w-full max-w-[480px] bg-gray-50 min-h-screen relative shadow-2xl flex flex-col overflow-x-hidden pb-[72px]">
            {/* Top Navigation */}
            <nav className="bg-shopee-dark text-white shadow-md sticky top-0 z-50">
                <div className="mx-auto w-full px-4">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo & Search */}
                        <div className="flex flex-1 items-center gap-3">
                            <Link href="/" className="flex items-center gap-2 transition-transform active:scale-95">
                                <img src="/images/logonet.png" alt="Logo" className="h-7 w-auto drop-shadow-sm" />
                                <span className="text-xl font-black tracking-tighter text-white mt-1">Bliyyan</span>
                            </Link>




                        </div>

                        {/* User Profile & Cart */}
                        <div className="flex flex-shrink-0 items-center gap-2">
                            <div className="flex items-center gap-1.5 text-white">
                                <Link 
                                    href={route('cart.index')}
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors relative"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                    {(cart_count > 0) && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-white text-shopee text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border shadow-sm">{cart_count}</span>
                                    )}
                                </Link>

                                <div className="hidden"></div>

                                {user ? (
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity p-1">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs uppercase">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                                            </button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            {user.is_admin && (
                                                <Dropdown.Link href={route('admin.dashboard')} className="font-bold text-shopee">
                                                    Kelola Bliyyan
                                                </Dropdown.Link>
                                            )}
                                            <Dropdown.Link href={route('profile.edit')}>Akun Saya</Dropdown.Link>
                                            <Dropdown.Link href={route('logout')} method="post" as="button">Keluar</Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Link href={route('login')} className="text-xs font-bold hover:underline">MASUK</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow-sm border-b border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <div className="w-full px-4 py-3">
                        {header}
                    </div>
                </header>
            )}

            <main className="w-full flex-grow px-4 py-4">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto py-10">
                <div className="w-full px-4 text-center text-gray-400 text-[10px]">
                    <p>&copy; 2026 Bliyyan.com Indonesia.</p>
                </div>
            </footer>

            {/* Mobile Bottom Navigation */}
            <BottomNav active={
                (route().current('dashboard') || route().current('profile.edit')) ? 'profile' :
                route().current('cart.index') ? 'cart' :
                (route().current('orders.index') || route().current('orders.show')) ? 'orders' :
                (route().current('products.search') || route().current('products.category')) ? 'categories' :
                'home'
            } />
            </div>
        </div>
        </ToastProvider>
    );
}
