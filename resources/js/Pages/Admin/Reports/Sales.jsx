import AdminLayout from '@/Layouts/AdminLayout';
import AdminModal from '@/Components/AdminModal';
import { Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { 
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    CheckCircle2,
    Truck,
    Download,
    FileText,
    TrendingUp,
    Package
} from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_CONFIG = {
    paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
};

export default function Sales({ auth, orders }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [localOrders] = useState(orders);
    const [viewDetailsModal, setViewDetailsModal] = useState(null);
    const [filterDay, setFilterDay] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterYear, setFilterYear] = useState('all');

    const handlePrint = (order) => {
        const printWindow = window.open('', '_blank');
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
                <title>Bliyyan Sales Report #${String(order.id).padStart(4, '0')}</title>
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
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo-section items-center">
                            <span class="company-name">Bliyyan Sales Report</span>
                        </div>
                    </div>
                </div>
                <div class="flex-grid">
                    <div class="info-box">
                        <div class="section-title">Sold To</div>
                        <div class="info-text">${order.user?.name}</div>
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
                            <th style="text-align: right;">Pi Amount</th>
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
                <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const filteredOrders = useMemo(() => {
        let result = localOrders;
        
        if (filterDay !== 'all') {
            result = result.filter(o => new Date(o.created_at).getDate() === parseInt(filterDay));
        }
        if (filterMonth !== 'all') {
            result = result.filter(o => new Date(o.created_at).getMonth() === parseInt(filterMonth));
        }
        if (filterYear !== 'all') {
            result = result.filter(o => new Date(o.created_at).getFullYear() === parseInt(filterYear));
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
    }, [localOrders, searchQuery, filterDay, filterMonth, filterYear]);

    const handleExportExcel = () => {
        const rows = [];
        let grandTotal = 0;

        filteredOrders.forEach(o => {
            const addr = o.default_address || null;
            const fullName  = addr?.recipient_name || o.user?.name || 'Guest';
            const email     = addr?.email || '-';
            const phone     = addr?.phone_number || '-';
            const cleanAddr = [addr?.address_line_1, addr?.city, addr?.province, addr?.postal_code]
                .filter(Boolean).join(', ') || o.shipping_address || '-';

            const dateObj = new Date(o.created_at);
            const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const username = o.user?.name || '-';

            const items = o.items || [];
            if (items.length === 0) {
                rows.push({
                    'Order ID':  `#${String(o.id).padStart(4, '0')}`,
                    'Username':  username,
                    'Nama':      fullName,
                    'Email':     email,
                    'No HP':     phone,
                    'Date':      dateStr,
                    'Time':      timeStr,
                    'Alamat':    cleanAddr,
                    'Produk':    '-',
                    'Qty':       '-',
                    'Jumlah Pi': Number(o.total_price),
                });
                grandTotal += Number(o.total_price);
            } else {
                items.forEach((item, idx) => {
                    rows.push({
                        'Order ID':  idx === 0 ? `#${String(o.id).padStart(4, '0')}` : '',
                        'Username':  idx === 0 ? username : '',
                        'Nama':      idx === 0 ? fullName : '',
                        'Email':     idx === 0 ? email : '',
                        'No HP':     idx === 0 ? phone : '',
                        'Date':      idx === 0 ? dateStr : '',
                        'Time':      idx === 0 ? timeStr : '',
                        'Alamat':    idx === 0 ? cleanAddr : '',
                        'Produk':    item.product?.name || '-',
                        'Qty':       item.quantity,
                        'Jumlah Pi': idx === 0 ? Number(o.total_price) : '',
                    });
                });
                grandTotal += Number(o.total_price);
            }
        });

        // Total row
        rows.push({
            'Order ID': '', 'Username': '', 'Nama': '', 'Email': '',
            'No HP': '', 'Date': '', 'Time': '', 'Alamat': '',
            'Produk': '', 'Qty': 'TOTAL PI',
            'Jumlah Pi': grandTotal,
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

        const maxWidths = rows.reduce((acc, row) => {
            Object.keys(row).forEach((key, i) => {
                const val = String(row[key]);
                acc[i] = Math.max(acc[i] || 0, val.length, key.length);
            });
            return acc;
        }, []);
        ws['!cols'] = maxWidths.map(w => ({ wch: w + 2 }));

        XLSX.writeFile(wb, `Bliyyan_SalesReport_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel exported successfully!');
    };

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_price), 0);

    return (
        <AdminLayout user={auth.user}>
            <Head title="Laporan Penjualan" />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Laporan Penjualan</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Paid Transactions Only
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Reports</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-slate-800">Sales Report</span>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales Record</p>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-500 transition-colors">{filteredOrders.length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue (Filtered)</p>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-shopee-gold transition-colors">π {totalRevenue.toFixed(2)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-shopee-gold">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
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
                            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10"
                        >
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                        <Calendar className="w-4 h-4 text-shopee-gold" />
                        <select 
                            value={filterDay}
                            onChange={(e) => setFilterDay(e.target.value)}
                            className="bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase py-2 pl-3 pr-8"
                        >
                            <option value="all">Day</option>
                            {Array.from({ length: 31 }, (_, i) => (
                                <option key={i+1} value={i+1}>{i+1}</option>
                            ))}
                        </select>
                        <select 
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase py-2 pl-3 pr-8"
                        >
                            <option value="all">Month</option>
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>
                        <select 
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-slate-50 border-none rounded-lg text-[10px] font-bold uppercase py-2 pl-3 pr-8"
                        >
                            <option value="all">Year</option>
                            {Array.from({ length: 5 }, (_, i) => {
                                const y = new Date().getFullYear() - i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Products</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Revenue</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No sales matches found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-slate-800">#{String(order.id).padStart(4, '0')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800 leading-tight">{order.user?.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{order.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                {order.items.slice(0, 1).map((item, i) => (
                                                    <span key={i} className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{item.product?.name}</span>
                                                ))}
                                                {order.items.length > 1 && (
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">+{order.items.length - 1} more items</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                                                {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900 tracking-tight italic">π {Number(order.total_price)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setViewDetailsModal(order)}
                                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-shopee-gold hover:text-white transition-all shadow-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simulated Pagination */}
            <div className="flex items-center justify-between mt-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Showing {filteredOrders.length} records</p>
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-full bg-blue-500 text-white font-black text-xs">1</button>
                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Order Details Modal (Same as Index for consistency) */}
            {viewDetailsModal && (
                <AdminModal
                    isOpen={!!viewDetailsModal}
                    onClose={() => setViewDetailsModal(null)}
                    title="Transaction Details"
                    subtitle={`Order ID: #${String(viewDetailsModal.id).padStart(4, '0')}`}
                    size="lg"
                >
                    <div className="p-2 space-y-6">
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
                                    <p className="text-[10px] font-medium text-slate-600 leading-relaxed whitespace-pre-line">{viewDetailsModal.shipping_address || '-'}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Truck className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Payment Info</span>
                                </div>
                                <div className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100`}>
                                    Paid
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-tighter">Completed At: {new Date(viewDetailsModal.updated_at).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest">Ordered Items</div>
                            <div className="divide-y divide-gray-50 max-h-[250px] overflow-y-auto">
                                {viewDetailsModal.items.map((item, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-gray-200">
                                                <img src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `/storage/${item.product.image}`) : '/images/placeholder.png'} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800 truncate max-w-[180px]">{item.product?.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Qty: <span className="text-slate-800">{item.quantity}</span> × π {item.price}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-black text-slate-900">π {Number(item.quantity * item.price)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-900 flex justify-between items-center text-white">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Revenue Item</span>
                                <span className="text-xl font-black text-shopee-gold">π {Number(viewDetailsModal.total_price)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setViewDetailsModal(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Close</button>
                            <button className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all" onClick={() => handlePrint(viewDetailsModal)}>
                                <TrendingUp className="w-4 h-4" /> Print Sale Slip
                            </button>
                        </div>
                    </div>
                </AdminModal>
            )}
        </AdminLayout>
    );
}
