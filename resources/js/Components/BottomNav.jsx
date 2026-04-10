import { Link, usePage } from '@inertiajs/react';

export default function BottomNav({ active = 'home' }) {
    const { cart_count } = usePage().props;

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Link 
                href="/" 
                className={`flex flex-col items-center gap-1 ${active === 'home' ? 'text-shopee-gold font-bold' : 'text-gray-400 font-medium'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                <span className="text-[10px] uppercase tracking-tighter">Home</span>
            </Link>
            <Link href={route('products.search')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${route().current('products.search') ? 'text-shopee' : 'text-gray-400'}`}>
                <div className="mb-0.5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
                </div>
                <span className="text-[10px] uppercase tracking-tighter">Categories</span>
            </Link>
            <Link href={route('cart.index')} className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${route().current('cart.*') ? 'text-shopee' : 'text-gray-400'}`}>
                <div className="mb-0.5 relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    {cart_count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-shopee text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm border border-white">
                            {cart_count}
                        </span>
                    )}
                </div>
                <span className="text-[10px] uppercase tracking-tighter">Cart</span>
            </Link>
            <Link href={route('orders.index')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${route().current('orders.*') ? 'text-shopee' : 'text-gray-400'}`}>
                <div className="mb-0.5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <span className="text-[10px] uppercase tracking-tighter">Orders</span>
            </Link>

            <Link 
                href={route('dashboard')} 
                className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-shopee-gold font-bold' : 'text-gray-400 font-medium'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span className="text-[10px] uppercase tracking-tighter">Account</span>
            </Link>
        </nav>
    );
}
