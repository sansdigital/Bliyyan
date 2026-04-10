import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { createCartPiPayment } from '@/Utils/PiPayment';
import axios from 'axios';
import { useToast } from '@/Components/Toast';

export default function Index({ auth, items, addresses = [] }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [discount, setDiscount] = useState(0);

    const [selectedAddressId, setSelectedAddressId] = useState(
        addresses.find(a => a.is_default)?.id || (addresses.length > 0 ? addresses[0].id : null)
    );

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.product.price) * item.quantity), 0);
    const total = subtotal - discount;

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;
        try {
            const response = await axios.post(route('voucher.validate'), {
                code: voucherCode,
                amount: subtotal
            });
            setAppliedVoucher(response.data.code);
            setDiscount(response.data.discount);
            toast.success(`Voucher '${response.data.code}' successfully applied!`);
        } catch (error) {
            toast.error(error.response?.data?.error || "Invalid voucher.");
            setAppliedVoucher(null);
            setDiscount(0);
        }
    };

    const handleUpdateQuantity = async (id, quantity) => {
        if (quantity < 1) return;
        try {
            await axios.put(route('cart.update', id), { quantity });
            setAppliedVoucher(null); // Reset voucher on cart change to re-validate
            setDiscount(0);
            router.reload({ only: ['items', 'cart_count'] });
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update quantity.");
        }
    };

    const handleRemove = async (id) => {
        try {
            await axios.delete(route('cart.remove', id));
            toast.info("Product removed from cart.");
            setAppliedVoucher(null);
            setDiscount(0);
            router.reload({ only: ['items', 'cart_count'] });
        } catch (error) {
            toast.error("Failed to remove product.");
        }
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;
        if (!selectedAddressId) {
            toast.error("Please select a shipping address first.");
            return;
        }
        setLoading(true);
        try {
            await createCartPiPayment(appliedVoucher, selectedAddressId);
            toast.success("Payment successful! Your order is being processed.");
            router.visit(route('dashboard'));
        } catch (error) {
            console.error("Checkout failed:", error);
            toast.error(error.response?.data?.error || "Pi transaction failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-black text-sm uppercase tracking-widest text-slate-800">Shopping Cart</h2>}>
            <Head title="Cart" />

            <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 relative pb-24 md:pb-6">
                {items.length === 0 ? (
                    <div className="bg-white p-16 text-center rounded-xl shadow-sm border border-gray-100">
                        <svg className="w-20 h-20 mx-auto text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        <h3 className="text-gray-400 font-bold text-lg mb-2">Your shopping cart is empty.</h3>
                        <Link href={route('dashboard')} className="mt-6 inline-block bg-shopee text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform shadow-lg shadow-shopee/20">Shop Now</Link>
                    </div>
                ) : (
                    <>
                        {/* Shipping Address Selection */}
                        <div className="bg-white shadow-sm rounded-xl p-6 mb-6 border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-shopee"></div>
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Shipping Address</h3>
                            </div>
                            
                            {addresses.length === 0 ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">You don't have a shipping address yet.</p>
                                    <Link href={route('profile.edit')} className="text-[10px] font-black text-white bg-shopee uppercase px-4 py-2 rounded-sm shadow-sm active:scale-95 transition-transform">Add New Address</Link>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-sm font-black text-slate-800">{selectedAddress?.recipient_name}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-xs font-bold text-gray-500">{selectedAddress?.phone_number}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed truncate max-w-xl">
                                            {selectedAddress?.address_line_1}, {selectedAddress?.city}, {selectedAddress?.province} {selectedAddress?.postal_code}
                                        </p>
                                    </div>
                                    <select 
                                        value={selectedAddressId}
                                        onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                                        className="text-[10px] font-black text-shopee bg-shopee/5 border-shopee/20 rounded-sm focus:ring-shopee cursor-pointer uppercase px-2 py-1 h-auto"
                                    >
                                        {addresses.map(addr => (
                                            <option key={addr.id} value={addr.id}>Change to {addr.label} {addr.is_default ? '(Default)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                            <div className="hidden md:grid grid-cols-6 gap-6 border-b border-gray-50 pb-4 mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <div className="col-span-3">Product</div>
                                <div className="text-center">Unit Price</div>
                                <div className="text-center">Quantity</div>
                                <div className="text-right">Total</div>
                            </div>

                            {items.map((item) => (
                                <div key={item.id} className="flex flex-col md:grid md:grid-cols-6 gap-4 items-center mb-6 md:mb-4 border-b border-gray-50 pb-4 last:border-0">
                                    <div className="w-full md:col-span-3 flex gap-4">
                                        <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 p-2 flex items-center justify-center">
                                            <img 
                                                src={item.product.image ? (item.product.image.startsWith('http') ? item.product.image : `/storage/${item.product.image}`) : `https://dummyimage.com/200x200/f5f5f5/ee4d2d.png&text=${item.product.name.replace(/\s+/g, '+')}`} 
                                                alt={item.product.name} 
                                                className="max-h-full max-w-full object-contain" 
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <Link href={route('products.show', item.product.slug)} className="text-sm font-black text-slate-800 hover:text-shopee line-clamp-2 leading-snug">
                                                {item.product.name}
                                            </Link>
                                            <button 
                                                onClick={() => handleRemove(item.id)}
                                                className="text-[9px] font-black text-red-500 uppercase tracking-widest self-start mt-2 border border-red-100 px-3 py-1 rounded-full hover:bg-red-50 transition-all"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto flex justify-between md:contents">
                                        <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-tighter">Price</span>
                                        <div className="text-center text-sm font-black text-slate-600">
                                            π {Number(item.product.price).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto flex justify-between md:contents">
                                        <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-tighter">Qty</span>
                                        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-1 max-w-[100px] md:mx-auto border border-gray-100">
                                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-800 hover:bg-white rounded-lg transition-all font-black">-</button>
                                            <span className="w-8 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-800 hover:bg-white rounded-lg transition-all font-black">+</button>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto flex justify-between md:contents">
                                        <span className="md:hidden text-[10px] text-gray-400 font-black uppercase tracking-tighter">Total</span>
                                        <div className="text-right text-shopee font-black">
                                            π {Number(item.product.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white shadow-sm rounded-sm p-4 mt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-1 max-w-sm gap-2">
                                    <input 
                                        type="text" 
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value)}
                                        placeholder="Enter Voucher Code"
                                        className="flex-1 rounded-xl border-gray-100 bg-gray-50 text-sm focus:ring-shopee focus:border-shopee font-medium"
                                    />
                                    <button 
                                        onClick={handleApplyVoucher}
                                        className="bg-slate-800 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {appliedVoucher && (
                                    <div className="text-xs font-black text-green-600 flex items-center gap-2 uppercase tracking-widest">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                        Voucher '{appliedVoucher}' Applied
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {items.length > 0 && (
                <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 pb-safe">
                    <div className="max-w-4xl mx-auto px-4 py-3">
                        <div className="flex flex-col gap-2 mb-2 border-b border-gray-50 pb-2 md:hidden">
                            <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                <span>Subtotal</span>
                                <span>π {subtotal.toFixed(4)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-[10px] text-green-600 font-black uppercase tracking-tighter">
                                    <span>Voucher Savings</span>
                                    <span>- π {discount.toFixed(4)}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-end gap-4 md:gap-10">
                            <div className="text-right">
                                <div className="hidden md:block mb-1">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mr-4">Subtotal: π {subtotal.toFixed(4)}</span>
                                    {discount > 0 && <span className="text-[10px] text-green-600 font-black uppercase tracking-tighter">Savings: -π {discount.toFixed(4)}</span>}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Payment</span>
                                    <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">π {total.toFixed(4)}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleCheckout}
                                disabled={loading}
                                className="bg-shopee text-white px-10 py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-shopee/20 active:scale-95 transition-all disabled:bg-gray-300"
                            >
                                {loading ? 'Processing...' : 'Checkout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
