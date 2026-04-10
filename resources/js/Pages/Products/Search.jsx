import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function ProductCard({ product }) {
    return (
        <Link href={route('products.show', product.slug)} className="bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow group border border-transparent hover:border-shopee overflow-hidden flex flex-col active:scale-95">
            <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-2">
                <img
                    src={product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : `https://dummyimage.com/400x400/f5f5f5/ee4d2d.png&text=${product.name.replace(/\s+/g, '+')}`}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                />
                {product.is_featured && (
                    <div className="absolute top-0 left-0 bg-shopee text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-sm uppercase">Mall</div>
                )}
            </div>
            <div className="p-2 flex flex-col flex-1">
                <h3 className="text-xs text-gray-800 line-clamp-2 h-8 mb-1 leading-snug group-hover:text-shopee">
                    {product.name}
                </h3>
                <div className="mt-auto">
                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-tight mb-1">
                        {product.category?.name}
                    </div>
                    <div className="flex items-baseline gap-0.5 text-shopee font-bold">
                        <span className="text-[10px]">π</span>
                        <span className="text-sm font-black">{Number(product.price)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Stok: {product.stock}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{product.distributor || 'Official'}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function Search({ products, categories, query, active_category }) {
    const [searchInput, setSearchInput] = useState(query || '');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.get(route('products.search'), { q: searchInput.trim() });
        }
    };

    const pageTitle = active_category
        ? `Kategori: ${active_category.name}`
        : query
            ? `Hasil pencarian "${query}"`
            : 'Semua Produk';

    return (
        <AuthenticatedLayout>
            <Head title={pageTitle} />

            <div className="pb-4">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Cari produk..."
                            className="w-full rounded-sm border border-gray-200 py-2 px-4 pr-12 text-sm focus:outline-none focus:border-shopee-gold shadow-sm"
                        />
                        <button type="submit" className="absolute right-1 top-1 bottom-1 bg-shopee-gold text-shopee px-3 rounded-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Horizontal Category Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-4 px-4">
                    <Link
                        href={route('products.search')}
                        className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${!active_category && !query ? 'bg-shopee text-white border-shopee' : 'text-gray-500 border-gray-200 bg-white'}`}
                    >
                        Semua
                    </Link>
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={route('products.category', cat.slug)}
                            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${active_category?.id === cat.id ? 'bg-shopee text-white border-shopee' : 'text-gray-500 border-gray-200 bg-white'}`}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>

                {/* Page Title + Count */}
                <div className="flex items-center justify-between mb-4">
                    <h1 className="font-black text-gray-800 text-sm uppercase tracking-tight border-l-4 border-shopee pl-3">{pageTitle}</h1>
                    <span className="text-[10px] text-gray-400 font-medium">{products.length} produk</span>
                </div>

                {products.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                        <svg className="w-14 h-14 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <h3 className="text-gray-500 font-bold text-sm">Tidak ada produk ditemukan</h3>
                        {query && <p className="text-gray-400 text-xs mt-1">untuk pencarian "<strong>{query}</strong>"</p>}
                        <Link href={route('dashboard')} className="mt-4 inline-block text-shopee font-bold text-sm hover:underline">
                            Kembali ke Beranda
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
