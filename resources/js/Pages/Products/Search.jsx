import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ProductCard({ product }) {
    const { t } = useTranslation();
    return (
        <Link href={route('products.show', product.slug)} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg hover:border-shopee/20 transition-all duration-300 active:scale-95">
            <div className="relative aspect-square bg-gray-50/50 p-3 sm:p-4 overflow-hidden">
                <img
                    src={product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : `https://dummyimage.com/400x400/f5f5f5/ee4d2d.png&text=${product.name.replace(/\s+/g, '+')}`}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
                {product.is_featured && (
                    <div className="absolute top-0 left-0 bg-shopee text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-br-sm uppercase leading-none">{t('mall')}</div>
                )}
            </div>
            <div className="p-2 sm:p-3 flex flex-col flex-1">
                <h3 className="text-[11px] sm:text-sm text-gray-800 line-clamp-2 h-8 sm:h-10 mb-1 sm:mb-2 leading-tight group-hover:text-shopee transition-colors">
                    {product.name}
                </h3>
                <div className="mt-auto">
                    <div className="flex items-baseline gap-0.5 text-shopee font-bold">
                        <span className="text-[10px] sm:text-xs italic tracking-tighter">π</span>
                        <span className="text-xs sm:text-base font-black">{Number(product.price)}</span>
                    </div>
                    <div className="mt-1 text-[9px] text-gray-400 font-medium truncate uppercase tracking-tighter flex items-center justify-between">
                        <span>{product.distributor || 'Official Store'}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function Search({ products = [], categories = [], query, active_category }) {
    const { t } = useTranslation();
    const [searchInput, setSearchInput] = useState(query || '');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.get(route('products.search'), { q: searchInput.trim() });
        }
    };

    const pageTitle = active_category
        ? `Category: ${active_category.name}`
        : query
            ? `Results for "${query}"`
            : 'All Products';

    return (
        <AuthenticatedLayout>
            <Head title={pageTitle} />

            <div className="pb-24 sm:pb-8 max-w-4xl mx-auto">
                {/* Modern Search Bar */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search products..."
                            className="w-full rounded-2xl border-none bg-white py-3.5 px-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-shopee/10 shadow-sm group-hover:shadow-md transition-all placeholder:text-gray-300"
                        />
                        <button 
                            type="submit" 
                            className="absolute right-2 top-2 bottom-2 bg-shopee flex items-center justify-center px-4 rounded-xl text-slate-900 hover:bg-shopee-hover transition-all active:scale-90"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Categories Chip Slider */}
                <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-2 px-2">
                    <Link
                        href={route('products.search')}
                        className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border transition-all ${!active_category && !query ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white text-gray-400 border-gray-100 hover:border-shopee hover:text-shopee shadow-sm'}`}
                    >
                        All
                    </Link>
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={route('products.category', cat.slug)}
                            className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border transition-all ${active_category?.id === cat.id ? 'bg-shopee text-slate-900 border-shopee shadow-lg shadow-shopee/20' : 'bg-white text-gray-400 border-gray-100 hover:border-shopee hover:text-shopee shadow-sm'}`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between mb-6 px-1">
                    <h1 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-shopee rounded-full"></span>
                        {pageTitle}
                    </h1>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{products.length} Items</span>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-50 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        <div className="relative">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                            </div>
                            <h3 className="text-slate-800 font-black text-lg uppercase tracking-tight">No products found</h3>
                            {query && <p className="text-gray-400 text-xs mt-2 font-medium tracking-tight">We couldn't find anything matching "<strong>{query}</strong>"</p>}
                            <Link href="/" className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:gap-6 gap-3">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
