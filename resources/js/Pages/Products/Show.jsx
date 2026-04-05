import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { createPiPayment } from '@/Utils/PiPayment';
import { useState } from 'react';
import axios from 'axios';
import { useToast } from '@/Components/Toast';

export default function Show({ auth, product, can_review, active_order_id, addresses = [], is_wishlisted = false }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);
    const [wishlisted, setWishlisted] = useState(is_wishlisted);

    // Gallery State
    const [mainImage, setMainImage] = useState(
        product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : null
    );

    const [selectedAddressId, setSelectedAddressId] = useState(
        addresses.find(a => a.is_default)?.id || (addresses.length > 0 ? addresses[0].id : null)
    );

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    const toggleWishlist = async () => {
        if (!auth.user) {
            toast.warning("Silakan login untuk menyimpan produk ke favorit.");
            return;
        }

        try {
            const response = await axios.post(route('wishlist.toggle'), { product_id: product.id });
            setWishlisted(response.data.status === 'added');
            toast.success(response.data.message);
        } catch (error) {
            toast.error("Gagal mengubah wishlist.");
        }
    };

    const handlePurchase = async () => {
        if (auth.user.is_admin) {
            toast.warning("Admin tidak diperbolehkan melakukan pembelian.");
            return;
        }
        if (!selectedAddressId) {
            toast.error("Pilih alamat pengiriman terlebih dahulu.");
            return;
        }
        setLoading(true);
        try {
            await createPiPayment(product.id, null, selectedAddressId);
            toast.success(`Pembelian ${product.name} berhasil! Silakan cek menu Pesanan.`);
            router.visit(route('dashboard'));
        } catch (error) {
            console.error("Pembelian gagal:", error);
            toast.error("Terjadi kesalahan saat memproses pembayaran Pi.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (auth.user.is_admin) {
            toast.warning("Admin tidak diperbolehkan menambahkan ke keranjang.");
            return;
        }
        setCartLoading(true);
        try {
            await axios.post(route('cart.add'), { product_id: product.id, quantity: 1 });
            toast.success("Produk berhasil ditambahkan ke keranjang!");
            router.reload({ only: ['cart_count'] });
        } catch (error) {
            toast.error(error.response?.data?.error || "Gagal menambahkan produk ke keranjang.");
        } finally {
            setCartLoading(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head>
                <title>{`${product.name} - Bliyyan Marketplace`}</title>
                <meta name="description" content={product.description?.substring(0, 160) || `Beli ${product.name} dengan mata uang Pi Network hanya di Bliyyan.`} />
                
                {/* OpenGraph Tags */}
                <meta property="og:title" content={product.name} />
                <meta property="og:description" content={product.description?.substring(0, 160)} />
                <meta property="og:image" content={product.image?.startsWith('http') ? product.image : `${window.location.origin}/storage/${product.image}`} />
                <meta property="og:type" content="product" />
                <meta property="og:url" content={window.location.href} />
                
                {/* Twitter Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={product.name} />
                <meta name="twitter:description" content={product.description?.substring(0, 160)} />
                <meta name="twitter:image" content={product.image?.startsWith('http') ? product.image : `${window.location.origin}/storage/${product.image}`} />
            </Head>

            <div className="max-w-6xl mx-auto py-2 sm:py-6">
                <nav className="flex text-xs text-gray-500 mb-4 px-2" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-1">
                        <li><Link href={route('dashboard')} className="hover:text-shopee">Bliyyan</Link></li>
                        <li className="flex items-center">
                            <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
                            <span className="hover:text-shopee cursor-pointer font-bold">{product.category?.name}</span>
                        </li>
                    </ol>
                </nav>

                <div className="bg-white rounded-sm shadow-sm md:flex p-4">
                    {/* Image Section */}
                    <div className="md:w-2/5 p-2 shrink-0">
                        <div className="aspect-square bg-gray-50 flex items-center justify-center p-4 rounded-sm border border-gray-100 mb-4 overflow-hidden relative group">
                            <img 
                                src={mainImage || `https://dummyimage.com/800x800/f5f5f5/ee4d2d.png&text=${product.name.replace(/\s+/g, '+')}`} 
                                alt={product.name} 
                                className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                        
                        {/* Gallery Thumbnails */}
                        {product.images?.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <button 
                                    onClick={() => setMainImage(product.image?.startsWith('http') ? product.image : `/storage/${product.image}`)}
                                    className={`w-16 h-16 rounded border-2 shrink-0 p-1 flex items-center justify-center bg-white transition-all ${mainImage?.includes(product.image) ? 'border-shopee' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={product.image?.startsWith('http') ? product.image : `/storage/${product.image}`} alt="Main" className="max-h-full max-w-full object-contain" />
                                </button>
                                {product.images.map((img) => {
                                    const fullPath = img.image_path.startsWith('http') ? img.image_path : `/storage/${img.image_path}`;
                                    return (
                                        <button 
                                            key={img.id}
                                            onClick={() => setMainImage(fullPath)}
                                            className={`w-16 h-16 rounded border-2 shrink-0 p-1 flex items-center justify-center bg-white transition-all ${mainImage === fullPath ? 'border-shopee' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={fullPath} alt="Gallery" className="max-h-full max-w-full object-contain" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="md:w-3/5 p-4 md:pl-10">
                        <div className="flex items-center gap-2 mb-2">
                            {product.is_featured && (
                                <span className="bg-shopee text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase">Mall</span>
                            )}
                            <h1 className="text-xl font-medium text-gray-800 leading-tight">
                                {product.name}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-6 py-2 border-y border-gray-50">
                            <div className="flex items-center gap-0.5">
                                <span className="text-shopee font-bold border-b border-shopee">4.9</span>
                                <div className="flex text-shopee">★★★★★</div>
                            </div>
                            <div className="border-l pl-4">
                                <span className="text-gray-800 font-medium">102</span> Penilaian
                            </div>
                            <div className="border-l pl-4">
                                <span className="text-gray-800 font-medium">543</span> Terjual
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 mb-8 rounded-sm">
                            <div className="flex items-baseline gap-2 text-shopee">
                                <span className="text-sm">π</span>
                                <span className="text-3xl font-bold">{Number(product.price).toFixed(4)}</span>
                            </div>
                        </div>

                        <div className="space-y-6 mb-8 py-4 border-y border-gray-50">
                            <div className="flex text-sm">
                                <span className="w-24 text-gray-400 font-medium uppercase text-[11px] tracking-tight">Pengiriman</span>
                                {addresses.length > 0 ? (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-3.5 h-3.5 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                            <span className="text-gray-800 font-bold">{selectedAddress?.recipient_name}</span>
                                            <span className="text-gray-400">|</span>
                                            <span className="text-gray-600">{selectedAddress?.phone_number}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate max-w-md mb-2">
                                            {selectedAddress?.address_line_1}, {selectedAddress?.city}
                                        </p>
                                        <select 
                                            value={selectedAddressId}
                                            onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                                            className="text-[10px] font-black text-shopee bg-transparent border-none focus:ring-0 p-0 h-auto uppercase tracking-widest cursor-pointer"
                                        >
                                            {addresses.map(addr => (
                                                <option key={addr.id} value={addr.id}>Kirim ke {addr.label} {addr.is_default ? '(Utama)' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <p className="text-xs text-red-400 font-bold uppercase mb-2">Alamat belum diatur</p>
                                        <Link href={route('profile.edit')} className="text-[10px] font-black text-shopee uppercase border border-shopee px-2 py-1 rounded-sm">Set Alamat Pengiriman</Link>
                                    </div>
                                )}
                            </div>
                            <div className="flex text-sm">
                                <span className="w-24 text-gray-400 font-medium uppercase text-[11px] tracking-tight">Kuantitas</span>
                                <span className="text-gray-800 font-bold">1 <span className="text-gray-400 font-normal ml-2">(Tersedia {product.stock})</span></span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {auth.user?.is_admin ? (
                                <Link 
                                    href={route('admin.products.edit', product.id)}
                                    className="flex-1 bg-slate-800 text-white px-6 py-3 rounded-sm font-bold uppercase transition-all flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-95 shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    Kelola Data Produk
                                </Link>
                            ) : (
                                <>
                                    <button 
                                        onClick={toggleWishlist}
                                        className={`flex-1 border bg-white px-6 py-3 rounded-sm font-medium transition-all flex items-center justify-center gap-2 ${wishlisted ? 'border-red-500 text-red-500' : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400'}`}
                                    >
                                        <svg className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        {wishlisted ? 'Favorit Saya' : 'Tambah Favorit'}
                                    </button>
                                    <button 
                                        onClick={handleAddToCart}
                                        disabled={cartLoading}
                                        className="flex-1 border border-shopee text-shopee bg-shopee/5 px-6 py-3 rounded-sm font-medium hover:bg-shopee/10 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:border-gray-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                        {cartLoading ? 'Menambahkan...' : 'Masukkan Keranjang'}
                                    </button>
                                    <button 
                                        onClick={handlePurchase}
                                        disabled={loading}
                                        className="flex-1 bg-shopee text-white px-6 py-3 rounded-sm font-medium hover:bg-shopee-hover transition-colors flex items-center justify-center disabled:bg-gray-300"
                                    >
                                        {loading ? 'Memproses...' : 'Beli Sekarang'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="mt-4 bg-white p-6 shadow-sm rounded-sm mb-4">
                    <h3 className="text-lg bg-gray-50 p-3 -mx-6 -mt-6 mb-6 font-medium text-gray-800 uppercase tracking-tight">Spesifikasi Produk</h3>
                    <div className="space-y-4 max-w-2xl px-2">
                        <div className="flex text-sm">
                            <span className="w-40 text-gray-500">Merek</span>
                            <span className="text-gray-800">Premium Tech</span>
                        </div>
                        <div className="flex text-sm">
                            <span className="w-40 text-gray-500">Kondisi</span>
                            <span className="text-gray-800">Baru (Segel)</span>
                        </div>
                        <div className="flex text-sm border-t pt-4">
                            <span className="w-full text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {product.description}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white p-6 shadow-sm rounded-sm mb-20 md:mb-10">
                    <h3 className="text-lg bg-gray-50 p-3 -mx-6 -mt-6 mb-6 font-medium text-gray-800 uppercase tracking-tight">Penilaian Produk</h3>
                    
                    <div className="flex flex-col md:flex-row gap-8 mb-10 items-center md:items-start p-6 bg-shopee/5 rounded-sm border border-shopee/10">
                        <div className="text-center">
                            <div className="text-4xl font-black text-shopee">{product.average_rating} <span className="text-lg text-gray-400 font-normal">/ 5</span></div>
                            <div className="flex text-shopee mt-2 text-xl">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-5 h-5 ${i < Math.round(product.average_rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">{product.reviews.length} Ulasan</p>
                        </div>
                        
                        <div className="flex-1 flex flex-wrap gap-2 justify-center md:justify-start">
                            {['Semua', '5 Bintang', '4 Bintang', '3 Bintang', '2 Bintang', '1 Bintang'].map((label) => (
                                <button key={label} className="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-medium hover:border-shopee hover:text-shopee transition-colors bg-white">
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Form */}
                    {can_review && (
                        <ReviewForm product={product} orderId={active_order_id} />
                    )}

                    {/* Reviews List */}
                    <div className="divide-y divide-gray-100">
                        {product.reviews.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 italic text-sm">Belum ada ulasan untuk produk ini.</div>
                        ) : (
                            product.reviews.map((review) => (
                                <div key={review.id} className="py-6 flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 font-bold">
                                        {review.user?.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-gray-800">{review.user?.name}</div>
                                        <div className="flex text-shopee mt-1 scale-75 origin-left">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-sm text-gray-700 leading-relaxed italic">"{review.comment}"</p>
                                        <div className="mt-2 text-[10px] text-gray-400 font-medium">{new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Buy Bar */}
            {!auth.user?.is_admin && (
                <div className="fixed bottom-[56px] left-0 right-0 bg-white border-t border-gray-100 p-2 flex gap-2 md:hidden z-40 pb-safe">
                    <button 
                        onClick={handleAddToCart}
                        disabled={cartLoading}
                        className="flex flex-col items-center justify-center border border-shopee text-shopee w-16 h-12 rounded-sm bg-shopee/5 active:bg-shopee/10 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        <span className="text-[8px] font-bold uppercase truncate px-1">{cartLoading ? '...' : 'Keranjang'}</span>
                    </button>
                    <button 
                        onClick={handlePurchase}
                        disabled={loading}
                        className="flex-1 bg-shopee text-white h-12 rounded-sm font-bold uppercase text-sm shadow-lg active:scale-95 transition-transform disabled:bg-gray-300"
                    >
                        {loading ? 'Memproses...' : 'Beli Sekarang'}
                    </button>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function ReviewForm({ product, orderId }) {
    const toast = useToast();
    const { data, setData, post, processing, reset, errors } = useForm({
        rating: 5,
        comment: '',
        order_id: orderId
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('products.review', product.id), {
            onSuccess: () => {
                reset();
                toast.success('Ulasan Anda berhasil dikirim!');
            },
            onError: (err) => {
                toast.error(Object.values(err)[0] || 'Gagal mengirim ulasan.');
            }
        });
    };

    return (
        <div className="mb-10 p-6 border border-shopee/20 bg-shopee/5 rounded-sm">
            <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-4">Berikan Ulasan Anda</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rating Bintang</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setData('rating', star)}
                                className={`p-1 transition-transform active:scale-90 ${data.rating >= star ? 'text-shopee' : 'text-gray-300'}`}
                            >
                                <svg className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Komentar Ulasan</label>
                    <textarea
                        value={data.comment}
                        onChange={(e) => setData('comment', e.target.value)}
                        className="w-full rounded-sm border-gray-200 focus:ring-shopee focus:border-shopee text-sm"
                        placeholder="Bagaimana kualitas produk ini? Beritahukan pembeli lainnya..."
                        rows="3"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="bg-shopee text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-shopee-hover transition-colors disabled:bg-gray-300"
                >
                    {processing ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
            </form>
        </div>
    );
}
