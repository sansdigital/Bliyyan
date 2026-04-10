import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const statusConfig = {
    pending:   { label: 'Awaiting Payment', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    paid:      { label: 'Payment Successful',  color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    cancelled: { label: 'Cancelled',           color: 'text-rose-500 bg-rose-50 border-rose-100' },
    processing:{ label: 'Processing',          color: 'text-sky-600 bg-sky-50 border-sky-100' },
    shipped:   { label: 'Shipped',             color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    delivered: { label: 'Delivered',           color: 'text-slate-600 bg-slate-50 border-slate-100' },
};

export default function Index({ orders }) {
    return (
        <AuthenticatedLayout header={<h2 className="font-black text-sm uppercase tracking-widest text-slate-800">My Orders</h2>}>
            <Head title="Orders" />

                {orders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
                        <svg className="w-20 h-20 mx-auto text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        <h3 className="text-gray-400 font-bold text-lg mb-2">No orders yet</h3>
                        <p className="text-gray-400 text-sm mt-1 mb-6">Find your favorite products and start shopping!</p>
                        <Link href={route('dashboard')} className="bg-shopee text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform shadow-lg shadow-shopee/20">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.pending;
                            return (
                                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                                    {/* Order Header */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-4 h-4 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                            </svg>
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Order #{order.id}</span>
                                            <span className="text-gray-200">|</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Order Items */}
                                    <div className="divide-y divide-gray-50">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl flex-shrink-0 overflow-hidden p-2 flex items-center justify-center">
                                                    <img
                                                        src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `/storage/${item.product.image}`) : `https://dummyimage.com/100x100/f5f5f5/ee4d2d.png&text=${item.product?.name?.charAt(0) || '?'}`}
                                                        alt={item.product?.name}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-slate-800 truncate">{item.product?.name || 'Product unavailable'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">{item.quantity} x π {Number(item.price).toFixed(4)}</p>
                                                </div>
                                                <p className="text-sm font-black text-shopee flex-shrink-0">
                                                    π {Number(item.price * item.quantity).toFixed(4)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tracking Info */}
                                    {order.tracking_number && (
                                        <div className="mx-6 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-5 h-5 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Track Order:</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{order.shipping_courier} - {order.tracking_number}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(order.tracking_number);
                                                    alert('Tracking number copied!');
                                                }}
                                                className="text-[9px] font-black text-shopee uppercase hover:bg-shopee/5 px-3 py-1.5 rounded-lg transition-all border border-shopee/10"
                                            >
                                                Copy Tracking
                                            </button>
                                        </div>
                                    )}

                                    {/* Order Footer */}
                                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-gray-50/20">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Total: <span className="font-black text-shopee text-xl ml-2 normal-case">π {Number(order.total_price).toFixed(4)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {order.status === 'pending' && (
                                                <Link
                                                    href={route('orders.show', order.id)}
                                                    className="flex items-center gap-2 text-[10px] text-white font-black bg-shopee px-5 py-2.5 rounded-xl hover:bg-shopee-hover transition-all active:scale-95 shadow-md shadow-shopee/20 uppercase tracking-widest"
                                                >
                                                    Pay
                                                </Link>
                                            )}
                                            <Link
                                                href={route('orders.show', order.id)}
                                                className="text-[10px] text-shopee font-black border-2 border-shopee/20 px-5 py-2.5 rounded-xl hover:bg-shopee/5 transition-all uppercase tracking-widest"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
