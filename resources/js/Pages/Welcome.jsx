import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import BottomNav from '@/Components/BottomNav';
import axios from 'axios';
import { useToast } from '@/Components/Toast';
import { useTranslation } from 'react-i18next';

export default function Welcome({ auth, products, categories, groups = [], wishlist_ids = [] }) {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [searchInput, setSearchInput] = useState('');
    const [localWishlist, setLocalWishlist] = useState(wishlist_ids);
    const [activeGroup, setActiveGroup] = useState(groups[0]?.key || 'bliyyan'); // Default ke pilar pertama
    
    // Auto Slider Logic (Top Sellers / Featured / Newest fallback)
    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderProducts = products?.filter(p => p.is_featured).slice(0, 3);
    const sliderItems = sliderProducts?.length > 0 ? sliderProducts : (products?.slice(0, 3) || []);

    useEffect(() => {
        if (sliderItems.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
            }, 4500); // Ganti slide perlahan setiap 4.5 detik
            return () => clearInterval(timer);
        }
    }, [sliderItems.length]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) router.get(route('products.search'), { q: searchInput.trim() });
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        toast.info(`Bahasa diubah ke ${lng === 'id' ? 'Indonesia' : 'English'}`);
    };

    const toggleWishlist = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!auth.user) {
            toast.warning("Silakan login untuk menyimpan produk ke favorit.");
            return;
        }

        try {
            const response = await axios.post(route('wishlist.toggle'), { product_id: productId });
            if (response.data.status === 'added') {
                setLocalWishlist([...localWishlist, productId]);
                toast.success("Produk disimpan ke wishlist!");
            } else {
                setLocalWishlist(localWishlist.filter(id => id !== productId));
                toast.success("Produk dihapus dari wishlist.");
            }
        } catch (error) {
            toast.error("Gagal mengubah wishlist.");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 flex justify-center w-full font-sans">
            <div className="w-full max-w-[480px] bg-shopee-bg min-h-screen relative shadow-2xl flex flex-col overflow-x-hidden pb-[72px]">
            <Head>
                <title>Bliyyan - Belanja Elektronik dengan Pi Network</title>
                <meta name="description" content="Bliyyan adalah marketplace nomor 1 untuk belanja barang-barang premium (iPhone, MacBook, Laptop) menggunakan mata uang Pi Network secara aman." />
                
                {/* OpenGraph Tags */}
                <meta property="og:title" content="Bliyyan Marketplace - Belanja dengan Pi" />
                <meta property="og:description" content="Dapatkan barang impian Anda menggunakan Pi Network. iPhone, MacBook, dan gadget lainnya tersedia di Bliyyan." />
                <meta property="og:image" content={`${window.location.origin}/images/og-image.png`} />
                <meta property="og:type" content="website" />
                
                {/* Twitter Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Bliyyan - Blanja Premium dengan Pi" />
                <meta name="twitter:description" content="Marketplace Pi Network pertama dan terpercaya di Indonesia." />
            </Head>

            {/* Top Navigation */}
            <nav className="bg-shopee-dark text-white shadow-md sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        {/* Logo & Search */}
                            <Link href="/" className="flex items-center gap-2 transition-transform active:scale-95">
                                <img src="/images/logonet.png" alt="Logo" className="h-7 w-auto drop-shadow-sm" />
                                <span className="text-xl font-black tracking-tighter text-white mt-1">Bliyyan</span>
                            </Link>


                            


                        {/* Guest Actions & Language */}
                        <div className="flex items-center gap-4">
                            {/* Language Switcher */}
                            <div className="flex items-center bg-white/10 rounded-sm p-1">
                                <button 
                                    onClick={() => changeLanguage('id')}
                                    className={`px-1.5 py-0.5 text-[9px] font-black rounded-sm transition-colors ${i18n.language === 'id' ? 'bg-shopee-gold text-shopee' : 'text-white hover:bg-white/10'}`}
                                >
                                    ID
                                </button>
                                <button 
                                    onClick={() => changeLanguage('en')}
                                    className={`px-1.5 py-0.5 text-[9px] font-black rounded-sm transition-colors ${i18n.language === 'en' ? 'bg-shopee-gold text-shopee' : 'text-white hover:bg-white/10'}`}
                                >
                                    EN
                                </button>
                            </div>

                            {auth.user ? (
                                <></>
                            ) : (
                                <div className="hidden"></div>
                            )}
                            
                            <Link href={route('cart.index')} className="relative ml-1 text-white border-white/20 pl-2 py-1 hover:text-shopee-gold transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">0</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Banner Section */}
            <div className="px-2 py-3">
                <div className="grid grid-cols-1 gap-3 h-[200px]">
                    <div className="bg-gradient-to-br from-shopee-gold to-yellow-500 rounded-xl flex flex-col justify-center text-slate-900 relative overflow-hidden shadow-lg h-full group">
                        {sliderItems.length > 0 ? (
                            sliderItems.map((item, idx) => (
                                <Link 
                                    key={`slide-${item.id}`} 
                                    href={route('products.show', item.slug)}
                                    className={`absolute inset-0 p-4 flex flex-col justify-center transition-opacity duration-1000 ease-in-out
                                        ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}
                                    `}
                                >
                                    <div className="relative z-10 flex flex-col justify-center h-full w-[55%]">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="bg-slate-900 text-shopee-gold text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest inline-block shadow-sm">
                                                Penjualan Terlaris
                                            </span>
                                        </div>
                                        <h2 className="text-lg font-black mb-0.5 leading-tight uppercase tracking-tighter line-clamp-2 text-slate-900 drop-shadow-md">
                                            {item.name}
                                        </h2>
                                        <p className="opacity-80 max-w-sm text-[10px] line-clamp-2 mt-0.5 font-medium pr-2">{item.description}</p>
                                        <div className="mt-3 flex items-baseline gap-1 bg-white/70 backdrop-blur-sm w-fit px-3 py-1.5 rounded-sm shadow-sm border border-white/50">
                                            <span className="text-xs italic font-black text-slate-900 opacity-70">π</span>
                                            <span className="text-xl font-black tracking-tighter text-slate-900">{Number(item.price).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Abstract Product Background Image */}
                                    <div className="absolute right-[2%] top-1/2 -translate-y-1/2 w-[40%] h-[65%] flex items-center justify-center opacity-90 pointer-events-none transition-transform duration-[6000ms] ease-out group-hover:scale-110">
                                        <img 
                                            src={item.image ? (item.image.startsWith('http') ? item.image : `/storage/${item.image}`) : `https://dummyimage.com/600x600/f5f5f5/ee4d2d.png&text=${item.name.replace(/\s+/g, '+')}`} 
                                            alt={item.name}
                                            className="w-full h-full object-contain object-center drop-shadow-2xl"
                                        />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="relative z-10 p-5 sm:p-8">
                                <span className="bg-slate-900 text-shopee-gold text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider mb-2 sm:mb-4 inline-block">{t('flash_sale')}</span>
                                <h2 className="text-2xl sm:text-5xl font-black mb-1 sm:mb-2 leading-tight uppercase italic tracking-tighter">Elektronik <br/>{t('pay_with_pi')}</h2>
                                <p className="opacity-90 max-w-md text-[10px] sm:text-base line-clamp-2">Eksklusif di Bliyyan.</p>
                            </div>
                        )}

                        {/* Slider Controls */}
                        {sliderItems.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-white/20 px-2 py-1.5 rounded-full backdrop-blur-sm">
                                {sliderItems.map((_, idx) => (
                                    <button 
                                        key={`dot-${idx}`} 
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-slate-900 shadow-sm' : 'w-2 bg-slate-900/40 hover:bg-slate-900/60'}`}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                        {/* Decorative Math Element */}
                        <div className="absolute right-[-5%] bottom-[-10%] opacity-5 text-[120px] sm:text-[200px] font-black italic select-none pointer-events-none">π</div>
                    </div>
                </div>
                
                {/* Pilar Navigasi Utama (Horizontal Icons) */}
                <div className="mt-8 overflow-x-auto whitespace-nowrap scrollbar-hide -mx-2 px-2 pb-4">
                    <div className="flex gap-6 sm:gap-10 justify-start sm:justify-center min-w-max">
                        {groups.map((group) => (
                            <button 
                                key={group.id}
                                onClick={() => setActiveGroup(group.key)}
                                className="group flex flex-col items-center gap-2 transition-all active:scale-95 flex-shrink-0"
                            >
                                <div className={`w-20 h-10 rounded-xl flex items-center justify-center p-0.5 border-2 transition-all shadow-sm
                                    ${activeGroup === group.key ? 'border-shopee-gold bg-white scale-105' : 'border-transparent bg-white/50 hover:bg-white'}
                                `}>
                                    <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
                                        {group.icon_path ? (
                                            <img src={`/storage/${group.icon_path}`} alt={group.name} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <div className="text-shopee-gold font-black text-lg uppercase italic">
                                                {group.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight transition-colors
                                    ${activeGroup === group.key ? 'text-shopee' : 'text-gray-400 group-hover:text-gray-600'}
                                `}>
                                    {group.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Categories Bar — Dynamic based on activeGroup */}
                <div className="bg-white mt-2 p-4 rounded-xl shadow-sm flex gap-6 items-center overflow-x-auto whitespace-nowrap scrollbar-hide border border-gray-100">
                    <Link href={route('products.search')} className="text-shopee font-black border-b-2 border-shopee pb-1 text-[10px] uppercase tracking-widest flex-shrink-0">
                        {t('all_products')}
                    </Link>
                    {(categories ?? []).filter(cat => cat.category_group?.key === activeGroup).map((cat) => (
                        <Link
                            key={cat.id}
                            href={route('products.category', cat.slug)}
                            className="text-gray-500 hover:text-shopee transition-colors text-[10px] uppercase font-bold tracking-wider flex-shrink-0"
                        >
                            {cat.name}
                            <span className="ml-1 text-[8px] text-gray-300">({cat.products_count})</span>
                        </Link>
                    ))}
                </div>

                {/* Product Grid — Filtered by activeGroup */}
                <div className="mt-10">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <span className="text-[10px] font-black uppercase text-shopee tracking-[0.3em] mb-1 block">Rekomendasi</span>
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter border-l-4 border-shopee pl-3">
                                {groups.find(g => g.key === activeGroup)?.name || 'Pilihan Terbaik'}
                            </h3>
                        </div>
                        <Link href={route('products.search')} className="text-shopee text-[10px] font-bold hover:underline py-1 uppercase tracking-widest">{t('view_all')} &rsaquo;</Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {products?.filter(p => !p.category || p.category.category_group?.key === activeGroup).map((product) => (
                            <Link key={product.id} href={route('products.show', product.slug)} className="bg-white rounded-sm shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-shopee flex flex-col active:scale-95 relative">
                                <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-2">
                                    <img 
                                        src={product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : `https://dummyimage.com/400x400/f5f5f5/ee4d2d.png&text=${product.name.replace(/\s+/g, '+')}`} 
                                        alt={product.name} 
                                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                                    />
                                    {product.is_featured && (
                                        <div className="absolute top-0 left-0 bg-shopee text-white text-[8px] sm:text-[10px] font-bold px-1 py-0.5 rounded-br-sm uppercase leading-none">{t('mall')}</div>
                                    )}
                                    
                                    {/* Wishlist Heart Icon */}
                                    <button 
                                        onClick={(e) => toggleWishlist(e, product.id)}
                                        className="absolute top-1 right-1 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg 
                                            className={`w-4 h-4 transition-colors ${localWishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} 
                                            fill={localWishlist.includes(product.id) ? "currentColor" : "none"} 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-2 sm:p-3 flex flex-col flex-1">
                                    <h4 className="text-[11px] sm:text-sm text-gray-800 line-clamp-2 h-7 sm:h-10 mb-1 sm:mb-2 leading-tight group-hover:text-shopee">
                                        {product.name}
                                    </h4>
                                    <div className="mt-auto">
                                        <div className="flex items-baseline gap-0.5 text-shopee font-bold">
                                            <span className="text-[10px] sm:text-xs italic tracking-tighter">π</span>
                                            <span className="text-xs sm:text-base font-black">{Number(product.price).toFixed(2)}</span>
                                        </div>
                                        <div className="mt-1 text-[9px] text-gray-400 font-medium">
                                            Jakarta Utara
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="bg-white border-t border-gray-200 mt-20 py-12">
                <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h5 className="font-bold text-gray-700 mb-4 text-xs uppercase tracking-widest">Layanan Pelanggan</h5>
                        <ul className="text-gray-500 text-[10px] sm:text-xs space-y-2">
                            <li>{t('help')}</li>
                            <li>Metode Pembayaran Pi</li>
                            <li>{t('track_order')} Bliyyan</li>
                            <li>Gratis Ongkir Pi</li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-bold text-gray-700 mb-4 text-xs uppercase tracking-widest">Tentang Bliyyan</h5>
                        <ul className="text-gray-500 text-[10px] sm:text-xs space-y-2">
                            <li>{t('privacy_policy')}</li>
                            <li>{t('contact_us')}</li>
                            <li>Keamanan Pi</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-100 mt-12 pt-8 text-center text-gray-400 text-[9px] sm:text-[10px]">
                    <p>&copy; {new Date().getFullYear()} Bliyyan. Powered by Sans Digital.</p>
                </div>
            </footer>
            
                <BottomNav active="home" />
            </div>
        </div>
    );
}
