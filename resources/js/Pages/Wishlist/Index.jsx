import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useToast } from '@/Components/Toast';
import axios from 'axios';
import { useState } from 'react';

export default function Index({ auth, wishlistItems }) {
    const toast = useToast();
    const [items, setItems] = useState(wishlistItems);

    const removeFromWishlist = async (id, productId) => {
        try {
            await axios.post(route('wishlist.toggle'), { product_id: productId });
            setItems(items.filter(item => item.id !== id));
            toast.success("Product removed from wishlist.");
        } catch (error) {
            toast.error("Failed to remove product.");
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Wishlist" />

            <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase border-l-4 border-shopee pl-4">My Wishlist</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1 ml-4">Products you've saved to buy later</p>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white rounded-sm shadow-sm p-20 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 uppercase">Empty Wishlist</h3>
                        <p className="text-gray-500 text-sm mb-8">You haven't saved any products to your wishlist yet.</p>
                        <Link 
                            href={route('dashboard')}
                            className="inline-block bg-shopee text-white px-8 py-3 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-shopee-hover transition-colors shadow-lg shadow-shopee/20"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-sm shadow-sm hover:shadow-md transition-all group border border-transparent hover:border-shopee flex flex-col relative">
                                <Link href={route('products.show', item.product.slug)} className="flex flex-col flex-1">
                                    <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                                        <img 
                                            src={item.product.image ? (item.product.image.startsWith('http') ? item.product.image : `/storage/${item.product.image}`) : `https://dummyimage.com/400x400/f5f5f5/ee4d2d.png&text=${item.product.name.replace(/\s+/g, '+')}`} 
                                            alt={item.product.name} 
                                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                                        />
                                    </div>
                                    <div className="p-3 flex flex-col flex-1">
                                        <h4 className="text-[11px] sm:text-xs text-gray-800 line-clamp-2 h-8 mb-2 leading-tight group-hover:text-shopee font-medium">
                                            {item.product.name}
                                        </h4>
                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="flex items-baseline gap-0.5 text-shopee font-bold">
                                                <span className="text-[10px] italic tracking-tighter">π</span>
                                                <span className="text-sm font-black">{Number(item.product.price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                
                                {/* Quick Remove Button */}
                                <button 
                                    onClick={() => removeFromWishlist(item.id, item.product_id)}
                                    className="absolute top-1 right-1 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500"
                                    title="Remove from Wishlist"
                                >
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
