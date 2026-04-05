import AdminLayout from '@/Layouts/AdminLayout';
import AdminModal from '@/Components/AdminModal';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useToast } from '@/Components/Toast';
import { 
    Search, 
    Plus, 
    Pencil, 
    Trash2, 
    Ticket, 
    ChevronRight, 
    Calendar, 
    Percent, 
    Zap, 
    Clock, 
    ChevronLeft, 
    CheckCircle2, 
    XCircle,
    Copy,
    ChevronRight as ChevronRightIcon
} from 'lucide-react';

export default function Index({ auth, vouchers }) {
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        code: '',
        discount_type: 'fixed',
        discount_value: '',
        min_purchase: 0,
        max_uses: '',
        expires_at: '',
        is_active: true
    });

    const filteredVouchers = useMemo(() => {
        if (!searchQuery) return vouchers;
        const q = searchQuery.toLowerCase();
        return vouchers.filter(v => v.code.toLowerCase().includes(q));
    }, [vouchers, searchQuery]);

    const openCreateModal = () => {
        setEditingVoucher(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (voucher) => {
        setEditingVoucher(voucher);
        setData({
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            min_purchase: voucher.min_purchase,
            max_uses: voucher.max_uses || '',
            expires_at: voucher.expires_at ? new Date(voucher.expires_at).toISOString().slice(0, 16) : '',
            is_active: !!voucher.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingVoucher) {
            put(route('admin.vouchers.update', editingVoucher.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Voucher updated successfully!');
                }
            });
        } else {
            post(route('admin.vouchers.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('New voucher created!');
                }
            });
        }
    };

    const confirmDelete = () => {
        destroy(route('admin.vouchers.destroy', deleteConfirm.id), {
            onSuccess: () => {
                setDeleteConfirm(null);
                toast.success('Voucher deleted!');
            }
        });
    };

    const toggleStatus = (voucher) => {
        put(route('admin.vouchers.update', voucher.id), {
            is_active: !voucher.is_active,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value
        }, {
            onSuccess: () => toast.success(`Voucher ${!voucher.is_active ? 'Activated' : 'Deactivated'}`)
        });
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        toast.info(`Code ${code} copied to clipboard!`);
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Vouchers Management" />

            {/* Breadcrumb Area */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vouchers</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        <span className="hover:text-shopee-gold cursor-pointer transition-colors">Marketing</span>
                        <ChevronRightIcon className="w-3 h-3 text-gray-300" />
                        <span className="text-slate-800">Promo Vouchers</span>
                    </div>
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
                        placeholder="Search codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                    />
                </div>
                <button 
                    onClick={openCreateModal}
                    className="w-full sm:w-auto px-6 py-2.5 bg-shopee-gold hover:bg-yellow-500 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-shopee-gold/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Create Voucher
                </button>
            </div>

            {/* Vouchers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Voucher Code</th>
                                <th className="px-6 py-4 text-center">Discount Value</th>
                                <th className="px-6 py-4 text-center">Min. Purchase</th>
                                <th className="px-6 py-4 text-center">Usage Stats</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredVouchers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No vouchers found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVouchers.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                                    <Ticket className="w-5 h-5" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg text-sm tracking-widest border border-slate-200">{v.code}</span>
                                                    <button onClick={() => copyToClipboard(v.code)} className="p-1.5 text-slate-300 hover:text-shopee-gold hover:bg-shopee-gold/5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                                                    {v.discount_type === 'percent' ? (
                                                        <><Percent className="w-3 h-3 text-emerald-500" /> {v.discount_value}%</>
                                                    ) : (
                                                        <><span className="text-shopee-gold italic">π</span> {Number(v.discount_value).toFixed(2)}</>
                                                    )}
                                                </span>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{v.discount_type === 'percent' ? 'Percentage' : 'Fixed Amount'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-600">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-shopee-gold italic">π</span> {Number(v.min_purchase).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center">
                                                <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                                                    {v.used_count} <span className="text-slate-300">/</span> {v.max_uses || 'Unlimited'}
                                                </div>
                                                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${v.used_count >= v.max_uses && v.max_uses > 0 ? 'bg-red-500' : 'bg-shopee-gold'}`}
                                                        style={{ width: v.max_uses ? `${Math.min((v.used_count/v.max_uses) * 100, 100)}%` : '0%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => toggleStatus(v)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${v.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                            >
                                                {v.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {v.is_active ? 'Active' : 'Paused'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(v)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors active:scale-90">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(v)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-90">
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

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between mt-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing {filteredVouchers.length} vouchers total
                </p>
                <div className="flex items-center gap-1.5">
                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-blue-500 text-white font-black text-[10px] shadow-sm">
                        1
                    </button>
                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 cursor-not-allowed">
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ─── CREATE / EDIT MODAL ─── */}
            <AdminModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
                subtitle={editingVoucher ? `Updating: ${editingVoucher?.code}` : 'Generate powerful discount codes to boost your Pi sales'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="p-2 space-y-6">
                    {!editingVoucher && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Voucher Code *</label>
                            <div className="relative">
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-shopee-gold" />
                                <input 
                                    type="text"
                                    value={data.code}
                                    onChange={e => setData('code', e.target.value.toUpperCase())}
                                    className="w-full rounded-2xl border-none bg-slate-50 pl-11 pr-4 py-3.5 text-sm font-black tracking-[0.2em] focus:ring-2 focus:ring-shopee-gold/20 transition-all uppercase"
                                    placeholder="PIBOOST2026"
                                    autoFocus
                                />
                            </div>
                            {errors.code && <div className="text-red-500 text-[10px] font-bold mt-1.5 uppercase ml-1">{errors.code}</div>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Discount Type</label>
                            <select 
                                value={data.discount_type}
                                onChange={e => setData('discount_type', e.target.value)}
                                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all appearance-none"
                            >
                                <option value="fixed">Fixed (π Amount)</option>
                                <option value="percent">Percent (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Discount Value *</label>
                            <input 
                                type="number"
                                value={data.discount_value}
                                onChange={e => setData('discount_value', e.target.value)}
                                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-black focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                                step="0.01"
                                placeholder={data.discount_type === 'percent' ? '10' : '0.50'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Min. Spend (π)</label>
                            <input 
                                type="number"
                                value={data.min_purchase}
                                onChange={e => setData('min_purchase', e.target.value)}
                                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Usage Limit</label>
                            <input 
                                type="number"
                                value={data.max_uses}
                                onChange={e => setData('max_uses', e.target.value)}
                                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                                placeholder="Unlimited"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Expiration Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                                type="datetime-local"
                                value={data.expires_at}
                                onChange={e => setData('expires_at', e.target.value)}
                                className="w-full rounded-2xl border-none bg-slate-50 pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <div className="relative">
                            <input 
                                type="checkbox"
                                id="is_active_toggle"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                        </div>
                        <label htmlFor="is_active_toggle" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] cursor-pointer peer-checked:text-emerald-600 transition-colors">Voucher Status: {data.is_active ? 'Active' : 'Inactive'}</label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={processing}
                            className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing ? 'Processing...' : editingVoucher ? 'Update Voucher' : 'Launch Voucher'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            {/* ─── DELETE CONFIRM MODAL ─── */}
            <AdminModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion" size="md">
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="w-10 h-10 text-red-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">Delete this voucher?</h4>
                    <p className="text-sm text-gray-500 mb-2">Removing code <strong className="text-slate-900">"{deleteConfirm?.code}"</strong>. This cannot be undone.</p>
                    <div className="flex justify-center gap-3 mt-8">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                            Wait, go back
                        </button>
                        <button onClick={confirmDelete} className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20">
                            Delete Voucher
                        </button>
                    </div>
                </div>
            </AdminModal>
        </AdminLayout>
    );
}
