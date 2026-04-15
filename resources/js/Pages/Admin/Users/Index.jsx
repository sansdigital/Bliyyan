import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useToast } from '@/Components/Toast';
import { 
    Search,
    Trash2,
    Members,
    ChevronLeft,
    ChevronRight,
    Users,
    Download,
    Mail,
    Calendar
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
        const exportData = filteredUsers.map(u => ({
            'User Id': `#${String(u.id).padStart(4, '0')}`,
            'Full Name': u.name || 'Unknown',
            'Pi UID': u.pi_uid || '-',
            'Email Address': u.email || '-',
            'Total Orders': u.orders_count || 0,
            'Joined Date': new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Customers");
        
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
            result = result.filter(u => 
                String(u.id).includes(query) || 
                (u.name && u.name.toLowerCase().includes(query)) ||
                (u.pi_uid && u.pi_uid.toLowerCase().includes(query))
            );
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
                        placeholder="Search by Name, UID, or ID..."
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
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="px-6 py-4">Cust ID</th>
                                <th className="px-6 py-4">Customer Details</th>
                                <th className="px-6 py-4">Pi Account UID</th>
                                <th className="px-6 py-4 text-center">Total Orders</th>
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No customers found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-slate-800">#{String(user.id).padStart(4, '0')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-shopee-gold/10 flex items-center justify-center text-shopee-gold font-black shadow-inner">
                                                    {(user.name || 'G')[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-2">
                                                        {user.name || 'Guest User'}
                                                        {user.role === 'admin' && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Admin</span>}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email || 'No email attached'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded truncate max-w-[200px] block">
                                                {user.pi_uid ? user.pi_uid.replace('@pi.network', '') : 'Not a Pi Wallet'}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-black text-xs">
                                                {user.orders_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 pr-1 transition-opacity">
                                                <button 
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={user.role === 'admin'}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-20 disabled:hover:bg-transparent rounded-lg transition-colors group/del"
                                                    title={user.role === 'admin' ? "Cannot delete admin" : "Delete Customer"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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
