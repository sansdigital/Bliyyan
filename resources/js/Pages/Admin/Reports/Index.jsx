import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    BarChart3, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    ShoppingCart, 
    Package, 
    ChevronRight, 
    PieChart, 
    ArrowUpRight,
    Trophy,
    Calendar,
    Target
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    AreaChart,
    Area
} from 'recharts';

export default function Index({ auth, chart_data, top_products, status_stats, revenue }) {
    // Revenue Change Percentage
    const monthlyChange = revenue.last_month > 0 
        ? ((revenue.this_month - revenue.last_month) / revenue.last_month * 100).toFixed(1)
        : 0;

    const stats = [
        { 
            label: "This Month Revenue", 
            value: `π ${revenue.this_month.toFixed(4)}`, 
            sub: `${monthlyChange >= 0 ? '+' : ''}${monthlyChange}% vs last month`,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            trend: monthlyChange >= 0 ? "up" : "down"
        },
        { 
            label: "Total Revenue (All Time)", 
            value: `π ${revenue.total_all_time.toFixed(4)}`, 
            sub: "Paid orders only",
            icon: Target,
            color: "text-shopee-gold",
            bg: "bg-shopee-gold/5",
            trend: "neutral"
        },
        { 
            label: "Successful Transactions", 
            value: status_stats.find(s => s.status === 'paid')?.count || 0, 
            sub: "Completed payments",
            icon: ShoppingCart,
            color: "text-blue-500",
            bg: "bg-blue-50",
            trend: "neutral"
        }
    ];

    return (
        <AdminLayout user={auth.user}>
            <Head title="Sales Reports & Analytics" />

            {/* Breadcrumb Area */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Analytics & Reports</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        <span className="hover:text-shopee-gold cursor-pointer transition-colors">Business</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-slate-800">Performance Reports</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Calendar className="w-4 h-4 text-shopee-gold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Last 30 Days</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${s.bg} ${s.color} transition-transform group-hover:scale-110`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            {s.trend !== "neutral" && (
                                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${s.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                    {s.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(monthlyChange)}%
                                </div>
                            )}
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</h3>
                        <div className="text-2xl font-black text-slate-900 group-hover:text-shopee-gold transition-colors">{s.value}</div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{s.sub}</p>
                        <div className="absolute right-[-5%] bottom-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
                            <s.icon className="w-24 h-24" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-50 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Revenue Trend</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Last 7 days of Pi transactions</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                               <span className="text-[9px] font-black uppercase text-slate-400">Paid Amount</span>
                           </div>
                        </div>
                    </div>
                    
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                                    dy={10} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#1e293b' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorTotal)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white p-8 rounded-3xl border border-slate-50 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Order Status</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-8">Data distribution by status</p>
                    
                    <div className="space-y-6">
                        {status_stats.map((s, i) => (
                            <div key={i} className="group cursor-default">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ring-4 ring-opacity-20 ${s.status === 'paid' ? 'bg-emerald-500 ring-emerald-500' : s.status === 'pending' ? 'bg-orange-500 ring-orange-500' : 'bg-slate-300 ring-slate-300'}`}></div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{s.status}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{s.count}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${s.status === 'paid' ? 'bg-emerald-500' : s.status === 'pending' ? 'bg-orange-500' : 'bg-slate-300'}`}
                                        style={{ width: `${(s.count / Math.max(...status_stats.map(st => st.count))) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversion Advice</h4>
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Most customers are completing payments within <span className="text-emerald-500">2 minutes</span> of checkout.</p>
                        </div>
                        <TrendingUp className="absolute right-[-5%] bottom-[-10%] w-16 h-16 text-slate-100 group-hover:text-emerald-50 group-hover:rotate-12 transition-all" />
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-shopee-gold" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Highest Revenue Products</h3>
                    </div>
                    <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All Marketplace</button>
                </div>
                
                {top_products.length === 0 ? (
                    <div className="py-20 text-center">
                        <BarChart3 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No sales records found for this period</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-8 py-4">Product Profile</th>
                                    <th className="px-8 py-4 text-center">Total Volume</th>
                                    <th className="px-8 py-4 text-right">Revenue Generated</th>
                                    <th className="px-8 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {top_products.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shadow-sm shrink-0">
                                                    <img 
                                                        src={p.product?.image ? (p.product.image.startsWith('http') ? p.product.image : `/storage/${p.product.image}`) : `https://dummyimage.com/100x100/f5f5f5/D4AF37.png&text=${p.product?.name?.charAt(0)}`}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                                        alt="" 
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-slate-800 truncate max-w-[300px] leading-tight group-hover:text-shopee-gold transition-colors">{p.product?.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">SKU: PI-PRD-{p.product?.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-slate-700">{p.total_sold}</span>
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Units Sold</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-shopee-gold font-black text-base italic tracking-tight">π {Number(p.total_revenue).toFixed(4)}</span>
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Successful</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <Link 
                                                href={route('admin.products.index', { search: p.product?.name })}
                                                className="p-2 text-slate-300 hover:text-shopee-gold bg-slate-50 hover:bg-shopee-gold/5 rounded-xl transition-all inline-flex items-center gap-2"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
