import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const statusConfig = {
    pending:   { label: 'Menunggu Pembayaran', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    paid:      { label: 'Pembayaran Berhasil',  color: 'text-green-600 bg-green-50 border-green-200' },
    cancelled: { label: 'Dibatalkan',           color: 'text-red-500 bg-red-50 border-red-200' },
    processing:{ label: 'Sedang Diproses',      color: 'text-blue-600 bg-blue-50 border-blue-200' },
    shipped:   { label: 'Dikirim',              color: 'text-purple-600 bg-purple-50 border-purple-200' },
    delivered: { label: 'Selesai',              color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export default function Index({ orders }) {
    return (
        <AuthenticatedLayout>
            <Head title="Pesanan Saya" />

            <div className="max-w-4xl mx-auto pb-24 md:pb-8">
                <h1 className="text-xl font-bold text-gray-800 mb-4">Pesanan Saya</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-sm shadow-sm p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        <h3 className="text-gray-500 font-medium text-lg">Belum ada pesanan</h3>
                        <p className="text-gray-400 text-sm mt-1 mb-6">Temukan produk pilihan Anda dan mulai berbelanja!</p>
                        <Link href={route('dashboard')} className="bg-shopee text-white px-6 py-2.5 rounded-sm font-bold text-sm active:scale-95 transition-transform">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.pending;
                            return (
                                <div key={order.id} className="bg-white rounded-sm shadow-sm overflow-hidden">
                                    {/* Order Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-4 h-4 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                            </svg>
                                            <span className="text-xs text-gray-500 font-medium">Pesanan #{order.id}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Order Items */}
                                    <div className="divide-y divide-gray-50">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                                                <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded flex-shrink-0 overflow-hidden p-1 flex items-center justify-center">
                                                    <img
                                                        src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `/storage/${item.product.image}`) : `https://dummyimage.com/100x100/f5f5f5/ee4d2d.png&text=${item.product?.name?.charAt(0) || '?'}`}
                                                        alt={item.product?.name}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{item.product?.name || 'Produk tidak tersedia'}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.quantity} x π {Number(item.price).toFixed(4)}</p>
                                                </div>
                                                <p className="text-sm font-bold text-shopee flex-shrink-0">
                                                    π {Number(item.price * item.quantity).toFixed(4)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tracking Info */}
                                    {order.tracking_number && (
                                        <div className="mx-4 mb-3 p-3 bg-shopee/5 rounded-sm border border-shopee/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Lacak Pesanan:</span>
                                                <span className="text-[11px] font-medium text-gray-500 uppercase">{order.shipping_courier} - {order.tracking_number}</span>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(order.tracking_number);
                                                    alert('Nomor resi disalin!');
                                                }}
                                                className="text-[10px] font-black text-shopee uppercase hover:underline"
                                            >
                                                Salin Resi
                                            </button>
                                        </div>
                                    )}

                                    {/* Order Footer */}
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 bg-gray-50/30">
                                        <div className="text-sm text-gray-500">
                                            Total: <span className="font-black text-shopee text-base ml-1">π {Number(order.total_price).toFixed(4)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.status === 'pending' && (
                                                <Link
                                                    href={route('orders.show', order.id)}
                                                    className="flex items-center gap-1.5 text-xs text-shopee-dark font-black bg-shopee border border-shopee px-3 py-1.5 rounded hover:bg-shopee-hover transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                        <path d="M11 2v4.22h-.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1H11v8.83c0 .61.49 1.1 1.1 1.1s1.1-.49 1.1-1.1V8.42h2.23c2.4 0 4.35 1.95 4.35 4.35s-1.95 4.35-4.35 4.35h-.8v2.2h.8c3.61 0 6.55-2.94 6.55-6.55s-2.94-6.55-6.55-6.55H13.2V2H11z"/>
                                                    </svg>
                                                    Bayar
                                                </Link>
                                            )}
                                            <Link
                                                href={route('orders.show', order.id)}
                                                className="text-xs text-shopee font-bold border border-shopee px-3 py-1.5 rounded hover:bg-shopee hover:text-white transition-colors"
                                            >
                                                Lihat Detail
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
