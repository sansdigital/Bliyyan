import AdminLayout from '@/Layouts/AdminLayout';
import AdminModal from '@/Components/AdminModal';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '@/Components/Toast';
import { 
    Search,
    Pencil,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    CheckCircle2,
    AlertCircle,
    Truck,
    Download,
    FileText,
    Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_CONFIG = {
    pending:    { label: 'Pending',    color: 'bg-orange-50 text-orange-600 border-orange-100' },
    paid:       { label: 'Paid',       color: 'bg-green-50 text-green-600 border-green-100' },
    processing: { label: 'Processing', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    shipped:    { label: 'Shipped',    color: 'bg-purple-50 text-purple-600 border-purple-100' },
    completed:  { label: 'Completed',  color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-600 border-red-100' },
    chargeback: { label: 'Chargeback', color: 'bg-red-50 text-red-600 border-red-100' },
    refunded:   { label: 'Refunded',   color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
};

export default function Index({ auth, orders }) {
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);
    const [localOrders, setLocalOrders] = useState(orders);
    const [viewDetailsModal, setViewDetailsModal] = useState(null);
    const [trackingModal, setTrackingModal] = useState(null);
    const [filterDay, setFilterDay] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterYear, setFilterYear] = useState('all');

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

    const [stuckPaymentId, setStuckPaymentId] = useState(null);

    const handleSyncStuckPayment = async (paymentId) => {
        setUpdatingId('sync');
        try {
            const response = await axios.post(route('admin.orders.pi-sync'), { payment_id: paymentId });
            toast.success(response.data.success);
            setStuckPaymentId(null);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to sync payment.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRefund = async (orderId) => {
        if (!confirm('Apakah Anda yakin ingin memproses refund Pi untuk pesanan ini? Koin akan langsung dikirim kembali ke wallet user.')) return;
        
        setUpdatingId(orderId);
        setStuckPaymentId(null);
        try {
            const response = await axios.post(route('admin.orders.refund', orderId));
            
            // Update local state for both Order and Payment
            setLocalOrders(prev =>
                prev.map(o => o.id === orderId ? { 
                    ...o, 
                    status: 'refunded',
                    payment: o.payment ? { ...o.payment, status: 'refunded' } : o.payment
                } : o)
            );
            
            if (viewDetailsModal && viewDetailsModal.id === orderId) {
                setViewDetailsModal(prev => ({ 
                    ...prev, 
                    status: 'refunded',
                    payment: prev.payment ? { ...prev.payment, status: 'refunded' } : prev.payment
                }));
            }
            
            toast.success(response.data.success || 'Refund processed successfully.');
        } catch (error) {
            console.error('Refund error:', error);
            const msg = error.response?.data?.error || 'Failed to process refund.';
            
            // Auto detection of stuck payment ID from error message
            const identifierMatch = msg.match(/"identifier":"([^"]+)"/);
            if (identifierMatch && identifierMatch[1]) {
                setStuckPaymentId(identifierMatch[1]);
                toast.warning('Ditemukan transaksi yang tersangkut. Gunakan tombol "Pembersih Antrean" yang muncul.');
            } else {
                toast.error(msg);
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const handlePrint = (order) => {
        const printWindow = window.open('', '_blank');
        
        // Reformat shipping address: move phone number in (brackets) to a new line
        const formattedAddress = (order.shipping_address || '-').replace(/\s*\(([^)]+)\)/, '\n$1');

        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 2px solid #f8fafc;">
                    <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; color: #0f172a;">${item.product?.name}</div>
                    <div style="font-size: 10px; color: #94a3b8; font-weight: 700; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Qty: ${item.quantity} × π ${Number(item.price)}</div>
                </td>
                <td style="padding: 10px 12px; border-bottom: 2px solid #f8fafc; text-align: right; font-weight: 900; color: #0f172a; font-size: 14px;">
                    π ${Number(item.quantity * item.price)}
                </td>
            </tr>
        `).join('');

        const html = `
            <html>
            <head>
                <title>Bliyyan Invoice #${String(order.id).padStart(4, '0')}</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; padding: 40px; background: white; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #0f172a; padding-bottom: 25px; margin-bottom: 30px; }
                    .logo-section { display: flex; align-items: center; gap: 15px; }
                    .logo-img { height: 50px; width: auto; }
                    .company-name { font-size: 28px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -1.5px; }
                    .invoice-title { font-size: 42px; font-weight: 900; text-transform: uppercase; text-align: right; margin: 0; line-height: 0.9; letter-spacing: -2px; }
                    .invoice-details { text-align: right; font-size: 11px; margin-top: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                    .flex-grid { display: flex; gap: 20px; margin-bottom: 30px; }
                    .info-box { flex: 1; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; }
                    .section-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #cbd5e1; letter-spacing: 2px; margin-bottom: 10px; }
                    .info-text { font-size: 13px; font-weight: 700; line-height: 1.5; white-space: pre-line; color: #334155; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; letter-spacing: 1px; }
                    .total-box { background: #0f172a !important; -webkit-print-color-adjust: exact; color: white !important; padding: 25px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; }
                    .total-label { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 2px; }
                    .total-amount { font-size: 28px; font-weight: 900; color: #D4AF37 !important; -webkit-print-color-adjust: exact; }
                    @media print {
                        body { padding: 30px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo-section">
                            <img src="/images/logonet.png" class="logo-img" />
                            <span class="company-name">Bliyyan</span>
                        </div>
                        <div style="font-size: 10px; margin-top: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.4;">
                            Official Pi Network Marketplace<br>
                            Jakarta, Indonesia<br>
                            www.bliyyan.net
                        </div>
                    </div>
                    <div>
                        <h1 class="invoice-title">Invoice</h1>
                        <div class="invoice-details">
                            <span style="color: #0f172a; font-size: 16px;">#${String(order.id).padStart(4, '0')}</span><br>
                            Date: ${new Date(order.created_at).toLocaleDateString()}<br>
                            Status: ${order.status.toUpperCase()}
                        </div>
                    </div>
                </div>

                <div class="flex-grid">
                    <div class="info-box">
                        <div class="section-title">Recipient Info</div>
                        <div class="info-text" style="color: #0f172a; font-size: 15px;">${order.user?.name}</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 700;">${order.user?.email}</div>
                    </div>
                    <div class="info-box">
                        <div class="section-title">Shipping Address</div>
                        <div class="info-text">${formattedAddress}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Product Description</th>
                            <th style="text-align: right;">Total π</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total-box">
                    <span class="total-label">Grand Total</span>
                    <span class="total-amount">π ${Number(order.total_price)}</span>
                </div>

                <div style="margin-top: 50px; text-align: center;">
                    <p style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 3px;">
                        Thank you for your order
                    </p>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const filteredOrders = useMemo(() => {
        let result = localOrders;
        
        // Status Filter
        if (filterStatus !== 'all') {
            result = result.filter(o => o.status === filterStatus);
        }

        // Date Filters
        if (filterDay !== 'all') {
            result = result.filter(o => new Date(o.created_at).getDate() === parseInt(filterDay));
        }
        if (filterMonth !== 'all') {
            result = result.filter(o => new Date(o.created_at).getMonth() === parseInt(filterMonth));
        }
        if (filterYear !== 'all') {
            result = result.filter(o => new Date(o.created_at).getFullYear() === parseInt(filterYear));
        }

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(o => 
                String(o.id).includes(query) || 
                o.user?.name?.toLowerCase().includes(query) ||
                o.user?.email?.toLowerCase().includes(query)
            );
        }
        return result;
    }, [localOrders, filterStatus, searchQuery, filterDay, filterMonth, filterYear]);

    const handleExportExcel = () => {
        const exportData = filteredOrders.map(o => ({
            'Order Id': `#${String(o.id).padStart(4, '0')}`,
            'Billing Name': o.user?.name || 'Guest',
            'Date': new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            'Address': o.shipping_address || '-',
            'Total': `π ${Number(o.total_price)}`
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");
        
        // Auto-width for columns
        const maxWidths = exportData.reduce((acc, row) => {
            Object.keys(row).forEach((key, i) => {
                const val = String(row[key]);
                acc[i] = Math.max(acc[i] || 0, val.length, key.length);
            });
            return acc;
        }, []);
        ws['!cols'] = maxWidths.map(w => ({ wch: w + 2 }));

        XLSX.writeFile(wb, `Bliyyan_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Excel exported successfully!");
    };

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

            {/* Stuck Payment Recovery Alert */}
            {stuckPaymentId && (
                <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl mb-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in duration-300">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 shadow-inner">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Antrean Wallet Pi Tersumbat</h3>
                            <p className="text-sm text-red-600 font-bold leading-relaxed">Ada transaksi yang belum selesai (ID: <span className="font-mono bg-red-100 px-2 rounded">{stuckPaymentId}</span>).<br/>Sistem tidak bisa melakukan refund baru sampai transaksi ini dibereskan.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleSyncStuckPayment(stuckPaymentId)}
                        disabled={updatingId === 'sync'}
                        className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {updatingId === 'sync' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Cleaning...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" /> Bersihkan Antrean
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Enhanced Control Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Search & Export */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-shopee-gold transition-colors" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search by ID or Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                            />
                        </div>
                        <button 
                            onClick={handleExportExcel}
                            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
                        >
                            <Download className="w-4 h-4" /> Export Excel
                        </button>
                    </div>

                    {/* Status Quick Filters */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1 hidden sm:block">Status:</span>
                        {[
                            { id: 'all', label: 'All', color: 'bg-slate-100 text-slate-600' },
                            { id: 'paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
                            { id: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-700' },
                            { id: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
                        ].map(btn => (
                            <button
                                key={btn.id}
                                onClick={() => setFilterStatus(btn.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                    filterStatus === btn.id 
                                    ? `${btn.color} ring-2 ring-offset-1 ring-${btn.color.split('-')[1]}-200` 
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Specific Filters */}
                <div className="pt-4 border-t border-slate-50 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-shopee-gold" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Specific Date:</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Day Dropdown */}
                        <select 
                            value={filterDay}
                            onChange={(e) => setFilterDay(e.target.value)}
                            className="bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase tracking-widest focus:ring-shopee-gold/20 py-2 pl-3 pr-8"
                        >
                            <option value="all">Day</option>
                            {Array.from({ length: 31 }, (_, i) => (
                                <option key={i+1} value={i+1}>{i+1}</option>
                            ))}
                        </select>

                        {/* Month Dropdown */}
                        <select 
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase tracking-widest focus:ring-shopee-gold/20 py-2 pl-3 pr-8"
                        >
                            <option value="all">Month</option>
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>

                        {/* Year Dropdown */}
                        <select 
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase tracking-widest focus:ring-shopee-gold/20 py-2 pl-3 pr-8"
                        >
                            <option value="all">Year</option>
                            {Array.from({ length: 5 }, (_, i) => {
                                const y = new Date().getFullYear() - i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>

                        {(filterDay !== 'all' || filterMonth !== 'all' || filterYear !== 'all' || filterStatus !== 'all') && (
                            <button 
                                onClick={() => {
                                    setFilterDay('all');
                                    setFilterMonth('all');
                                    setFilterYear('all');
                                    setFilterStatus('all');
                                    setSearchQuery('');
                                }}
                                className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline ml-2"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>
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
                                                <div className="flex justify-end gap-2 pr-1 transition-opacity">
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
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter mb-4">{viewDetailsModal.user?.email}</p>
                                
                                <div className="pt-3 border-t border-slate-200/60">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Shipping Address</span>
                                    <p className="text-[10px] font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                                        {viewDetailsModal.shipping_address || '-'}
                                    </p>
                                </div>
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

                        {/* Refund Button for PAID/PROCESSING/SHIPPED */}
                        {['paid', 'processing', 'shipped', 'completed'].includes(viewDetailsModal.status) && (
                            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-800">Dangerous Area</span>
                                    <p className="text-[9px] text-yellow-600 font-bold leading-tight mt-0.5">Kembalikan Pi user untuk pesanan ini.</p>
                                </div>
                                <button 
                                    onClick={() => handleRefund(viewDetailsModal.id)}
                                    disabled={updatingId === viewDetailsModal.id}
                                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {updatingId === viewDetailsModal.id ? 'Processing...' : 'Refund Pi'}
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 no-print">
                            <button 
                                onClick={() => setViewDetailsModal(null)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                Close
                            </button>
                            <button 
                                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2"
                                onClick={() => handlePrint(viewDetailsModal)}
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
