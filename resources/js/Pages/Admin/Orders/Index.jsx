import AdminLayout from '@/Layouts/AdminLayout';
import AdminModal from '@/Components/AdminModal';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '@/Components/Toast';
import { 
    Search, 
    Plus, 
    Pencil, 
    Trash2, 
    Eye, 
    CreditCard, 
    Wallet, 
    Package, 
    ChevronLeft, 
    ChevronRight,
    Calendar,
    User,
    CheckCircle2,
    XCircle,
    Info,
    Truck
} from 'lucide-react';

const STATUS_CONFIG = {
    pending:    { label: 'Pending',    color: 'bg-orange-50 text-orange-600 border-orange-100' },
    paid:       { label: 'Paid',       color: 'bg-green-50 text-green-600 border-green-100' },
    processing: { label: 'Processing', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    shipped:    { label: 'Shipped',    color: 'bg-purple-50 text-purple-600 border-purple-100' },
    completed:  { label: 'Completed',  color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-600 border-red-100' },
    chargeback: { label: 'Chargeback', color: 'bg-red-50 text-red-600 border-red-100' },
    refund:     { label: 'Refund',     color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
};

export default function Index({ auth, orders }) {
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);
    const [localOrders, setLocalOrders] = useState(orders);
    const [viewDetailsModal, setViewDetailsModal] = useState(null);
    const [trackingModal, setTrackingModal] = useState(null);

    const handleStatusUpdate = async (orderId, newStatus, trackingNum = null, courier = null) => {
        setUpdatingId(orderId);
        try {
            await axios.patch(route('admin.orders.status', orderId), { 
                status: newStatus,
                tracking_number: trackingNum,
                shipping_courier: courier
            });
            
            setLocalOrders(prev =>
                prev.map(o => o.id === orderId ? { 
                    ...o, 
                    status: newStatus,
                    tracking_number: trackingNum,
                    shipping_courier: courier
                } : o)
            );
            toast.success(`Order #${String(orderId).padStart(4, '0')} updated successfully.`);
        } catch (error) {
            toast.error('Failed to update order.');
        } finally {
            setUpdatingId(null);
            setTrackingModal(null);
        }
    };

    const filteredOrders = useMemo(() => {
        let result = localOrders;
        if (filterStatus !== 'all') {
            result = result.filter(o => o.status === filterStatus);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(o => 
                String(o.id).includes(query) || 
                o.user?.name?.toLowerCase().includes(query) ||
                o.user?.email?.toLowerCase().includes(query)
            );
        }
        return result;
    }, [localOrders, filterStatus, searchQuery]);

    const Pagination = () => {
        // Since orders is likely just a plain array here (based on previous code), 
        // we'll simulate pagination logic if it's an array, or use standard Inertia props if it's a paginator.
        // For Bliyyan, it looks like 'orders' passed is a plain array in localOrders.
        return (
            <div className="flex items-center justify-between mt-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Showing {filteredOrders.length} records
                </p>
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-500/20">
                        1
                    </button>
                    <button className="w-8 h-8 rounded-full border border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 transition-all">
                        2
                    </button>
                    <button className="w-8 h-8 rounded-full border border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 transition-all">
                        3
                    </button>
                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Orders Management" />

            {/* Breadcrumb Area */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Orders</h2>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="hover:text-shopee-gold cursor-pointer transition-colors">Ecommerce</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-slate-800">Orders</span>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-64 group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400 group-focus-within:text-shopee-gold transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                    />
                </div>
                <button className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> Add New Order
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Billing Name</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Payment Status</th>
                                <th className="px-6 py-4 text-center">Payment Method</th>
                                <th className="px-6 py-4 text-center">View Details</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No matching orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-slate-800">#{String(order.id).padStart(4, '0')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-700 leading-tight">{order.user?.name || 'Guest'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                                                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-slate-900 tracking-tight">π {Number(order.total_price)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors ${statusConf.color}`}>
                                                    {statusConf.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                                    <span className="text-shopee-gold font-black italic text-lg leading-none cursor-default" title="Pi Network">π</span>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">Pi Wallet</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => setViewDetailsModal(order)}
                                                    className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-500/10 transition-all active:scale-90"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                                                        onClick={() => {
                                                            // For status management
                                                            if (order.status === 'shipped') setTrackingModal(order);
                                                            else toast.info('Status management in progress.');
                                                        }}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-1.5 text-red-300 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination />

            {/* View Details Modal */}
            {viewDetailsModal && (
                <AdminModal
                    isOpen={!!viewDetailsModal}
                    onClose={() => setViewDetailsModal(null)}
                    title="Order Summary"
                    subtitle={`Order ID: #${String(viewDetailsModal.id).padStart(4, '0')}`}
                    size="lg"
                >
                    <div className="p-2 space-y-6">
                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4 text-shopee-gold" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Customer Info</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 leading-tight">{viewDetailsModal.user?.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{viewDetailsModal.user?.email}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Truck className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Status Info</span>
                                </div>
                                <div className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${STATUS_CONFIG[viewDetailsModal.status]?.color}`}>
                                    {STATUS_CONFIG[viewDetailsModal.status]?.label}
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-tighter">
                                    Placed on: {new Date(viewDetailsModal.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                Ordered Items
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                                {viewDetailsModal.items.map((item, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-gray-200">
                                                <img src={item.product?.image || '/images/placeholder.png'} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800 truncate max-w-[180px]">{item.product?.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                                    Qty: <span className="text-slate-800">{item.quantity}</span> × π {item.price}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900">π {Number(item.quantity * item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-900 flex justify-between items-center text-white">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Amount</span>
                                <span className="text-xl font-black text-shopee-gold">π {Number(viewDetailsModal.total_price)}</span>
                            </div>
                        </div>

                        {/* Shipping Details if exist */}
                        {viewDetailsModal.tracking_number && (
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Shipping Info</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-emerald-600">
                                    <span>Courier: {viewDetailsModal.shipping_courier}</span>
                                    <span>Tracking No: {viewDetailsModal.tracking_number}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setViewDetailsModal(null)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                Close
                            </button>
                            <button 
                                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2"
                                onClick={() => {
                                    window.print(); // Simple print or specific PDF action
                                }}
                            >
                                <Eye className="w-4 h-4" /> Print Invoice
                            </button>
                        </div>
                    </div>
                </AdminModal>
            )}

            {/* Tracking / Status Modal (reused from old code) */}
            {trackingModal && (
                <AdminModal
                    isOpen={!!trackingModal}
                    onClose={() => setTrackingModal(null)}
                    title="Shipping Update"
                    size="md"
                >
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        handleStatusUpdate(trackingModal.id, 'shipped', formData.get('tracking_number'), formData.get('shipping_courier'));
                    }} className="p-2 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Courier</label>
                            <input name="shipping_courier" defaultValue={trackingModal.shipping_courier || 'J&T Express'} className="w-full rounded-xl border-gray-200 text-sm" required />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tracking Number</label>
                            <input name="tracking_number" defaultValue={trackingModal.tracking_number} className="w-full rounded-xl border-gray-200 text-sm" required />
                        </div>
                        <button type="submit" className="w-full py-3 bg-shopee-gold text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-shopee-gold/20 transition-all">
                            Update Shipping Detail
                        </button>
                    </form>
                </AdminModal>
            )}
        </AdminLayout>
    );
}
