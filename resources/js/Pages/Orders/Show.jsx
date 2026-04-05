import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const statusConfig = {
    pending:   { label: 'Menunggu Pembayaran', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '⏳' },
    paid:      { label: 'Pembayaran Berhasil',  color: 'text-green-600 bg-green-50 border-green-200',  icon: '✅' },
    cancelled: { label: 'Dibatalkan',           color: 'text-red-500 bg-red-50 border-red-200',        icon: '❌' },
    processing:{ label: 'Sedang Diproses',      color: 'text-blue-600 bg-blue-50 border-blue-200',     icon: '⚙️' },
    shipped:   { label: 'Dikirim',              color: 'text-purple-600 bg-purple-50 border-purple-200', icon: '🚚' },
    delivered: { label: 'Selesai',              color: 'text-gray-600 bg-gray-50 border-gray-200',     icon: '📦' },
};

export default function Show({ order }) {
    const status = statusConfig[order.status] || statusConfig.pending;

    return (
        <AuthenticatedLayout>
            <Head title={`Pesanan #${order.id}`} />

            <div className="max-w-2xl mx-auto pb-24 md:pb-8">
                {/* Back link */}
                <Link href={route('orders.index')} className="text-shopee text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    Kembali ke Daftar Pesanan
                </Link>

                <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                    {/* Status Banner */}
                    <div className={`p-5 border-b ${status.color} flex items-center gap-3`}>
                        <span className="text-2xl">{status.icon}</span>
                        <div>
                            <p className="font-black text-base">{status.label}</p>
                            <p className="text-xs opacity-70">Pesanan #{order.id} · {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    {order.tracking_number && (
                        <div className="p-5 border-b border-gray-100 bg-white">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Informasi Pengiriman</p>
                            <div className="flex items-start gap-4">
                                <div className="bg-shopee/10 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-shopee" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{order.shipping_courier}</p>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight font-medium">No. Resi: {order.tracking_number}</p>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(order.tracking_number);
                                            alert('Nomor resi disalin!');
                                        }}
                                        className="text-[10px] font-black text-shopee uppercase mt-2 hover:underline"
                                    >
                                        Salin No. Resi
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div className="p-4 divide-y divide-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Detail Produk</p>

                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 py-3">
                                <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded flex-shrink-0 overflow-hidden p-1 flex items-center justify-center">
                                    <img
                                        src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `/storage/${item.product.image}`) : `https://dummyimage.com/100x100/f5f5f5/ee4d2d.png&text=${item.product?.name?.charAt(0) || '?'}`}
                                        alt={item.product?.name}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 leading-snug">{item.product?.name || 'Produk tidak tersedia'}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.quantity} barang × π {Number(item.price).toFixed(4)}</p>
                                </div>
                                <p className="text-sm font-bold text-shopee flex-shrink-0 text-right">
                                    π {Number(item.price * item.quantity).toFixed(4)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 space-y-2 text-sm border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ringkasan Pembayaran</p>
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal ({order.items.reduce((a, b) => a + b.quantity, 0)} barang)</span>
                            <span>π {Number(order.total_price).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Biaya Layanan Pi</span>
                            <span className="text-green-600">Gratis</span>
                        </div>
                        <div className="flex justify-between font-black text-gray-800 text-base pt-2 border-t border-gray-200">
                            <span>Total Dibayar</span>
                            <span className="text-shopee">π {Number(order.total_price).toFixed(4)}</span>
                        </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="p-4 flex gap-3">
                        <Link href={route('dashboard')} className="flex-1 border border-shopee text-shopee text-center py-2.5 rounded-sm text-sm font-bold hover:bg-shopee/5 transition-colors">
                            Lanjut Belanja
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
