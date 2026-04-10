import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STATS_CONFIG = [
    { key: 'pending',    label: 'Awaiting Payment', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { key: 'processing', label: 'Processing',       icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { key: 'shipped',    label: 'Shipped',          icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011 1v2a1 1 0 01-1 1m-4-4h4m-8 0H3' },
    { key: 'to_review',  label: 'Rate Products',    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
];

const MENU_ITEMS = [
    { label: 'Address Book', link: route('profile.edit'), icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', color: 'bg-blue-500' },
    { label: 'Wishlist',      link: route('wishlist.index'), icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'bg-red-500' },
    { label: 'Cart',          link: route('cart.index'), icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-shopee' },
    { label: 'Security',      link: route('profile.edit'), icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'bg-green-600' },
];

export default function Dashboard({ auth, products, stats }) {
    const { t } = useTranslation();

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Account" />

            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                
                {/* Hero / Profile Card */}
                <div className="bg-gradient-to-r from-shopee to-shopee-hover rounded-2xl shadow-lg p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 shadow-inner">
                            <span className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic">
                                {auth.user.name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{auth.user.name}</h2>
                            <p className="text-white/80 text-xs sm:text-sm font-medium mt-1">{auth.user.email}</p>
                            {auth.user.is_admin && (
                                <span className="mt-2 inline-block bg-white text-shopee text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                    ADMIN ACCESS
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* My Orders Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                            My Orders
                        </h3>
                        <Link href={route('orders.index')} className="text-xs text-shopee font-bold hover:underline">View All Orders &rsaquo;</Link>
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-2">
                        {STATS_CONFIG.map((conf) => (
                            <Link 
                                key={conf.key} 
                                href={route('orders.index')} 
                                className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                            >
                                <div className="relative p-3 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-shopee/5 group-hover:text-shopee transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={conf.icon} />
                                    </svg>
                                    {(stats[conf.key] > 0) && (
                                        <span className="absolute -top-1 -right-1 bg-shopee text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm scale-110">
                                            {stats[conf.key]}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-center font-bold text-gray-500 uppercase tracking-tighter group-hover:text-gray-800">{conf.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Account Services Section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {MENU_ITEMS.map((item) => (
                        <Link 
                            key={item.label}
                            href={item.link}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md hover:border-shopee/30 transition-all group active:scale-95 text-center"
                        >
                            <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-${item.color.split('-')[1]}/20 group-hover:scale-110 transition-transform`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                            </div>
                            <span className="text-xs font-black text-gray-700 uppercase tracking-wide">{item.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Recommendations Section */}
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest border-l-4 border-shopee pl-3">Recommended For You</h3>
                        <Link href="/" className="text-[10px] text-shopee font-bold uppercase tracking-widest hover:underline">View Mall &rsaquo;</Link>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 px-2">
                        {products.map((product) => (
                            <Link key={product.id} href={route('products.show', product.slug)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-all active:scale-95">
                                <div className="relative aspect-square bg-gray-50/50 p-4">
                                    <img 
                                        src={product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : `https://dummyimage.com/400x400/f5f5f5/ee4d2d.png&text=?`} 
                                        alt={product.name} 
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
                                    />
                                    {product.is_featured && (
                                        <div className="absolute top-2 left-2 bg-shopee text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest shadow-sm">MALL</div>
                                    )}
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <h4 className="text-xs font-bold text-gray-800 line-clamp-2 h-8 leading-snug group-hover:text-shopee transition-colors">{product.name}</h4>
                                    <div className="mt-2 flex items-baseline gap-0.5 text-shopee font-black">
                                        <span className="text-[10px] italic">π</span>
                                        <span className="text-sm">{Number(product.price)}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{product.category?.name}</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{product.distributor || 'Official'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
