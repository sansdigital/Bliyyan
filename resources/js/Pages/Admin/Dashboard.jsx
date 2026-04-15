import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Package,
    ShoppingCart,
    Coins,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    AlertTriangle,
    User,
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell
} from 'recharts';

const STATUS_COLOR = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-600',
};

export default function Dashboard({ auth, stats, order_trends, recent_orders, low_stock_products }) {

    // Comparison calculation
    const salesDiff = stats.today_sales - stats.yesterday_sales;
    const isSalesUp = salesDiff >= 0;
    const salesPercent = stats.yesterday_sales > 0
        ? Math.abs((salesDiff / stats.yesterday_sales) * 100).toFixed(1)
        : (stats.today_sales > 0 ? '100' : '0');

    const statCards = [
        {
            label: 'Total Pi Collected',
            value: `π ${Number(stats.total_pi_earned)}`,
            icon: Coins,
            color: 'text-shopee-gold',
            bg: 'bg-shopee-gold/10',
            innerBg: 'bg-shopee-gold',
            trend: isSalesUp ? `+${salesPercent}%` : `-${salesPercent}%`,
            trendUp: isSalesUp
        },
        {
            label: 'Total Orders',
            value: stats.total_orders,
            icon: ShoppingCart,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            innerBg: 'bg-blue-500'
        },
        {
            label: 'Products',
            value: stats.total_products,
            icon: Package,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            innerBg: 'bg-purple-500'
        },
        {
            label: 'Awaiting Payment',
            value: stats.pending_orders,
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            innerBg: 'bg-orange-500'
        }
    ];

    return (
        <AdminLayout user={auth.user}>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-shopee-gold/5 hover:-translate-y-1 hover:border-shopee-gold/20 group cursor-pointer">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-shopee-gold transition-colors">{stat.label}</p>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:scale-105 origin-left transition-transform">{stat.value}</h3>
                                {stat.trend && (
                                    <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        <span>{stat.trend} today</span>
                                    </div>
                                )}
                            </div>
                            <div className={`h-12 w-12 ${stat.bg} rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                                <div className={`h-8 w-8 ${stat.innerBg} rounded-xl flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart: Order Trends */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">7-Day Order Trend</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Weekly transaction volume</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <TrendingUp className="w-3 h-3 text-shopee-gold" />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Updates</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={order_trends}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        name="Orders"
                                        stroke="#D4AF37"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pi Wallet Balance Card (Replaced Sales Performance) */}
                    <div className="lg:col-span-1 bg-slate-900 rounded-2xl shadow-xl p-6 relative overflow-hidden flex flex-col justify-between group">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-shopee-gold rounded-xl flex items-center justify-center shadow-lg shadow-shopee-gold/20">
                                        <Coins className="w-4 h-4 text-slate-900" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Saldo Pi Aplikasi</h3>
                                </div>
                                <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                                    <span className="text-[8px] font-black text-shopee-gold uppercase tracking-tighter">Live Blockchain</span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Current Balance</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">
                                            π {Number(stats.wallet_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })}
                                        </h2>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Public Address</span>
                                        <span className="text-[10px] font-mono text-shopee-gold font-bold">{stats.wallet_address || 'Not Configured'}</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-shopee-gold/50 w-full animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual decor */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-shopee-gold/5 rounded-full blur-3xl group-hover:bg-shopee-gold/10 transition-colors" />
                        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />

                        <Link href={route('admin.reports.sales')} className="relative z-10 w-full py-3 bg-shopee-gold text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest text-center mt-6 hover:bg-yellow-500 transition-all hover:shadow-lg hover:shadow-shopee-gold/20 active:scale-95">
                            Lihat Laporan Penjualan
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Attractive Recent Orders List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Latest Orders</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Recent transaction activity</p>
                            </div>
                            <Link href={route('admin.orders.index')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-shopee-gold transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {recent_orders.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Search className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No orders yet</p>
                                </div>
                            ) : (
                                recent_orders.map((order) => (
                                    <div key={order.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-shopee-gold/10 group-hover:text-shopee-gold transition-all overflow-hidden border border-gray-200">
                                                {order.user?.image ? (
                                                    <img src={order.user.image} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <User className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 leading-tight">{order.user?.name || 'Guest'}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center text-[10px] font-bold text-gray-400 gap-1 uppercase tracking-tighter">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                    <div className="text-[10px] font-black text-shopee-gold uppercase tracking-tighter">
                                                        {order.items?.length || 0} Items
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900 tracking-tight">π {Number(order.total_price)}</div>
                                            <div className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest mt-1 ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {order.status}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Low Stock Alert Cards */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Stock Alerts</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Products running out</p>
                            </div>
                            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {low_stock_products.length === 0 ? (
                                <div className="p-10 text-center">
                                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">Stock is secure</p>
                                </div>
                            ) : (
                                low_stock_products.map((p) => (
                                    <div key={p.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-yellow-500/30 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                                                <img
                                                    src={p.image ? (p.image.startsWith('http') ? p.image : `/storage/${p.image}`) : `https://dummyimage.com/100x100/f5f5f5/D4AF37.png&text=${p.name.charAt(0)}`}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-black text-slate-800 truncate max-w-[140px] group-hover:text-shopee-gold transition-colors">{p.name}</h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID: {p.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-1 ${p.stock === 0 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                                                }`}>
                                                {p.stock === 0 ? 'Out of Stock' : `${p.stock} Left`}
                                            </div>
                                            <Link href={route('admin.products.index')} className="text-[9px] font-bold text-gray-400 hover:text-shopee-gold uppercase tracking-tighter transition-colors">
                                                Restock Now
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 pt-0">
                            <Link href={route('admin.products.index')} className="w-full py-3 border-2 border-dashed border-gray-100 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest block text-center hover:bg-gray-50 hover:border-shopee-gold/20 hover:text-shopee-gold transition-all">
                                Manage All Products
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
