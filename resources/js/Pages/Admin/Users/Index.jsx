import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useToast } from '@/Components/Toast';
import { 
    Search,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Users,
    Download,
    Mail,
    Calendar,
    Phone,
    MapPin,
    Wallet
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Index({ auth, users }) {
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [localUsers, setLocalUsers] = useState(users);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const handleDelete = (userId) => {
        if (!confirm('Apakah Anda yakin ingin menghapus pelanggan ini beserta semua datanya secara permanen?')) return;
        
        router.delete(route('admin.users.destroy', userId), {
            onSuccess: () => {
                setLocalUsers(prev => prev.filter(u => u.id !== userId));
                toast.success('Customer deleted successfully.');
            },
            onError: (err) => {
                toast.error('Failed to delete customer.');
            }
        });
    };

    const handleExportExcel = () => {
        const exportData = filteredUsers.map(u => {
            const addr = u.default_address;
            const fullAddress = addr ? [addr.address_line_1, addr.city, addr.province, addr.postal_code].filter(Boolean).join(', ') : '-';
            
            return {
                'User ID': `#${String(u.id).padStart(4, '0')}`,
                'Username': u.name || '-',
                'Name': addr?.recipient_name || '-',
                'No Telp': addr?.phone_number || '-',
                'Pi UID': u.pi_uid || '-',
                'Email': addr?.email || '-',
                'Alamat': fullAddress,
                'Total Orders': u.orders_count || 0,
                'Join Date': new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bliyyan_Customers");
        
        const maxWidths = exportData.reduce((acc, row) => {
            Object.keys(row).forEach((key, i) => {
                const val = String(row[key]);
                acc[i] = Math.max(acc[i] || 0, val.length, key.length);
            });
            return acc;
        }, []);
        ws['!cols'] = maxWidths.map(w => ({ wch: w + 2 }));

        XLSX.writeFile(wb, `Bliyyan_Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Excel exported successfully!");
    };

    const filteredUsers = useMemo(() => {
        let result = localUsers;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u => {
                const addr = u.default_address;
                return (
                    String(u.id).includes(query) || 
                    (u.name && u.name.toLowerCase().includes(query)) ||
                    (u.pi_uid && u.pi_uid.toLowerCase().includes(query)) ||
                    (addr?.recipient_name && addr.recipient_name.toLowerCase().includes(query)) ||
                    (addr?.phone_number && addr.phone_number.includes(query)) ||
                    (addr?.email && addr.email.toLowerCase().includes(query))
                );
            });
        }
        return result;
    }, [localUsers, searchQuery]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    return (
        <AdminLayout user={auth.user}>
            <Head title="Customer Management" />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Customers</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> User Database
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span className="hover:text-shopee-gold cursor-pointer transition-colors">Ecommerce</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-slate-800">Customers</span>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400 group-focus-within:text-shopee-gold transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                    />
                </div>
                <button 
                    onClick={handleExportExcel}
                    className="w-full md:w-auto px-6 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
                >
                    <Download className="w-4 h-4" /> Export Excel
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="px-6 py-4 whitespace-nowrap">User ID</th>
                                <th className="px-6 py-4 whitespace-nowrap">Username</th>
                                <th className="px-6 py-4 whitespace-nowrap">Name</th>
                                <th className="px-6 py-4 whitespace-nowrap">No Telp</th>
                                <th className="px-6 py-4 whitespace-nowrap">Pi UID</th>
                                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                                <th className="px-6 py-4 whitespace-nowrap">Alamat</th>
                                <th className="px-6 py-4 text-center whitespace-nowrap">Total Orders</th>
                                <th className="px-6 py-4 whitespace-nowrap">Join Date</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-20 text-center">
                                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No customers found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => {
                                    const addr = user.default_address;
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-slate-800">#{String(user.id).padStart(4, '0')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-shopee-gold/10 flex items-center justify-center text-shopee-gold font-black text-[10px]">
                                                        {(user.name || 'G')[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{user.name || 'Guest'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-800">
                                                {addr?.recipient_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-bold text-gray-500 whitespace-nowrap">
                                                {addr?.phone_number ? (
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {addr.phone_number}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded w-fit">
                                                    <Wallet className="w-3 h-3 text-slate-400" />
                                                    <code className="text-[9px] font-black text-slate-600 truncate max-w-[100px] block" title={user.pi_uid}>
                                                        {user.pi_uid ? user.pi_uid.substring(0, 10) + '...' : 'Guest'}
                                                    </code>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-bold text-gray-500">
                                                {addr?.email ? (
                                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {addr.email}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-1 max-w-[180px]">
                                                    <MapPin className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                                                    <span className="text-[10px] font-bold text-gray-500 leading-tight line-clamp-2">
                                                        {addr ? [addr.address_line_1, addr.city, addr.province].filter(Boolean).join(', ') : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-black text-[10px]">
                                                    {user.orders_count || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end pr-1">
                                                    <button 
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={user.role === 'admin'}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing {paginatedUsers.length} of {filteredUsers.length} Users
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-shopee-gold disabled:opacity-30 transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all active:scale-90 ${
                                    currentPage === page 
                                    ? 'bg-shopee-gold text-slate-900 shadow-lg shadow-shopee-gold/20' 
                                    : 'bg-white border border-gray-100 text-gray-400 hover:bg-slate-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-shopee-gold disabled:opacity-30 transition-all active:scale-90"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
