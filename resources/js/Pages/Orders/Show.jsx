import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';

const statusConfig = {
    pending:   { label: 'Awaiting Payment', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: '⏳' },
    paid:      { label: 'Payment Successful',  color: 'text-emerald-600 bg-emerald-50 border-emerald-100',  icon: '✅' },
    cancelled: { label: 'Cancelled',           color: 'text-rose-500 bg-rose-50 border-rose-100',        icon: '❌' },
    processing:{ label: 'Processing',          color: 'text-sky-600 bg-sky-50 border-sky-100',     icon: '⚙️' },
    shipped:   { label: 'Shipped',             color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: '🚚' },
    delivered: { label: 'Delivered',           color: 'text-slate-600 bg-slate-50 border-slate-100',     icon: '📦' },
};

export default function Show({ order }) {
    const status = statusConfig[order.status] || statusConfig.pending;
    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState(null);

    const handlePay = async () => {
        setPayError(null);
        setPaying(true);
        try {
            if (typeof window.Pi === 'undefined') {
                throw new Error("Buka melalui Pi Browser untuk melakukan pembayaran.");
            }

            // Step 1: Authenticate with payments scope first (required by Pi SDK)
            const scopes = ['username', 'payments'];
            await window.Pi.authenticate(scopes, async (payment) => {
                // Handle any incomplete payment from previous session
                console.log("Incomplete payment found during pay:", payment);
                try {
                    await axios.post(route('pi.approve'), { paymentId: payment.identifier, order_id: order.id });
                } catch (e) { console.error(e); }
            });

            const paymentData = {
                amount: order.total_price,
                memo: `Payment for Order #${order.id} at Bliyyan`,
                metadata: { orderId: order.id }
            };

            await window.Pi.createPayment(paymentData, {
                onReadyForServerApproval: async (paymentId) => {
                    await axios.post(route('pi.approve'), { paymentId, order_id: order.id });
                },
                onReadyForServerCompletion: async (paymentId, txid) => {
                    await axios.post(route('pi.complete'), { paymentId, txid, order_id: order.id });
                    router.reload();
                },
                onCancel: async (paymentId) => {
                    await axios.post(route('pi.cancel'), { paymentId });
                    setPaying(false);
                },
                onError: (error) => {
                    console.error('Pi Payment Error:', error);
                    setPayError('Payment failed: ' + (error?.message || 'Please try again.'));
                    setPaying(false);
                },
            });
        } catch (err) {
            console.error(err);
            setPayError(err.message || 'Failed to initiate Pi payment.');
            setPaying(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-black text-sm uppercase tracking-widest text-slate-800">Order Details</h2>}>
            <Head title={`Order #${order.id}`} />

            <div className="max-w-4xl mx-auto pb-24 md:pb-8">
                <div className="mb-6">
                    <Link href={route('orders.index')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-shopee transition-all inline-flex items-center gap-2 mb-6">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                        Back to Orders
                    </Link>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-shopee"></div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-1">Order Details #{order.id}</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Ordered on {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full border self-start md:self-center ${status.color}`}>
                            {status.label}
                        </span>
                    </div>
                </div>

                {order.tracking_number && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
                        <div className="flex items-center gap-4 mb-6">
                            <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Shipping Information</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Carrier: {order.shipping_courier}</p>
                                <p className="text-sm font-black text-slate-800 tracking-tight">Waybill: {order.tracking_number}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(order.tracking_number);
                                    alert('Tracking number copied!');
                                }}
                                className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:bg-sky-50 px-5 py-2.5 rounded-xl border border-sky-100 transition-all active:scale-95"
                            >
                                Copy Number
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="divide-y divide-gray-50">
                        {order.items.map((item) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-6 px-8 py-6 items-center">
                                <div className="md:col-span-3 flex gap-4">
                                    <div className="w-16 h-16 border border-gray-100 rounded-xl flex-shrink-0 p-1.5 flex items-center justify-center bg-gray-50">
                                        <img
                                            src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `/storage/${item.product.image}`) : `https://dummyimage.com/100x100/f5f5f5/ee4d2d.png&text=${item.product?.name?.charAt(0) || '?'}`}
                                            alt={item.product?.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-800 truncate">{item.product?.name || 'Product unavailable'}</p>
                                        <p className="md:hidden text-xs text-gray-400 mt-1 uppercase tracking-tighter font-bold">{item.quantity} x π {Number(item.price).toFixed(4)}</p>
                                    </div>
                                </div>
                                <div className="hidden md:block text-center text-sm font-black text-slate-600">π {Number(item.price).toFixed(4)}</div>
                                <div className="hidden md:block text-center text-sm font-black text-slate-800">{item.quantity}</div>
                                <div className="text-right text-sm font-black text-shopee">π {Number(item.price * item.quantity).toFixed(4)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 space-y-4 border-b border-gray-50">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Order Subtotal</span>
                            <span className="font-black text-slate-800">π {Number(order.total_price).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Total Payment</span>
                            <span className="text-2xl font-black text-shopee">π {Number(order.total_price).toFixed(4)}</span>
                        </div>
                    </div>
                    <div className="p-8 bg-gray-50/50 flex flex-col sm:flex-row justify-between gap-6 sm:items-center">
                        <div className="text-[10px] font-black text-gray-400 space-y-1 uppercase tracking-widest">
                            <p>Order Time: {new Date(order.created_at).toLocaleString('en-US')}</p>
                            <p>Payment Method: Pi Network</p>
                        </div>
                        <div className="flex gap-4">
                            <Link href={route('orders.index')} className="text-[10px] font-black text-slate-800 border-2 border-gray-200 px-6 py-3 rounded-xl hover:bg-white transition-all uppercase tracking-widest">
                                Orders List
                            </Link>
                            {order.status === 'pending' && (
                                <button
                                    onClick={handlePay}
                                    disabled={paying}
                                    className="bg-shopee text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-shopee-hover transition-all active:scale-95 shadow-lg shadow-shopee/20 disabled:bg-gray-300"
                                >
                                    {paying ? 'Processing...' : 'Pay Now'}
                                </button>
                            )}
                            <Link href={route('dashboard')} className="bg-slate-800 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-800/20">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
