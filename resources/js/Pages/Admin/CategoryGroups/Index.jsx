import AdminLayout from '@/Layouts/AdminLayout';
import AdminModal from '@/Components/AdminModal';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useToast } from '@/Components/Toast';
import { 
    Search, 
    Plus, 
    Pencil, 
    Trash2,
    ChevronRight, 
    Layers, 
    Image as ImageIcon,
    Upload, 
    Save, 
    X,
    FolderSearch,
    CheckCircle2,
    Settings2,
    ChevronLeft,
    ChevronDown,
    FolderTree,
    Tag,
    Box
} from 'lucide-react';

export default function Index({ auth, groups, filters = {} }) {
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        image: null,
        _method: 'POST', // Default for create, will be manipulated for Update
    });

    // Live Search with Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(route('admin.category-groups.index'), { 
                    search: searchQuery 
                }, { 
                    preserveState: true,
                    replace: true 
                });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, filters]);

    const openCreateModal = () => {
        setEditingGroup(null);
        setData({
            name: '',
            image: null,
            _method: 'POST',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (group) => {
        setEditingGroup(group);
        setData({
            name: group.name,
            image: null,
            _method: 'PUT',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editingGroup) {
            // Laravel handles multipart PUT via POST + _method workaround
            // But since we use useForm.post/put/patch:
            // useForm.post(url) helper sends multipart/form-data.
            // For update with image, we usually use post with _method: 'PUT'
            post(route('admin.category-groups.update', editingGroup.id), {
                onSuccess: () => {
                    closeModal();
                    toast.success('Group updated successfully!');
                },
                onError: () => toast.error('Failed to update group.')
            });
        } else {
            post(route('admin.category-groups.store'), {
                onSuccess: () => {
                    closeModal();
                    toast.success('New group created successfully!');
                },
                onError: () => toast.error('Failed to create group.')
            });
        }
    };

    const confirmDelete = () => {
        destroy(route('admin.category-groups.destroy', deleteConfirm.id), {
            onSuccess: () => {
                setDeleteConfirm(null);
                toast.success('Group deleted successfully!');
            },
            onError: (err) => {
                setDeleteConfirm(null);
                const msg = err.error || 'Failed to delete group.';
                toast.error(msg);
            }
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Catalog Group Management" />

            {/* Breadcrumb Area */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Catalog Groups</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        <span className="hover:text-shopee-gold cursor-pointer transition-colors" onClick={() => router.get(route('admin.categories.index'))}>Catalog</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-slate-800">Groups</span>
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px] group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400 group-focus-within:text-shopee-gold transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <button 
                        onClick={() => router.get(route('admin.categories.index'))}
                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"
                    >
                        <Tag className="w-3.5 h-3.5" /> Back to Categories
                    </button>
                    <button 
                        onClick={openCreateModal}
                        className="px-6 py-2.5 bg-shopee-gold hover:bg-yellow-500 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-shopee-gold/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Add Group
                    </button>
                </div>
            </div>

            {/* Groups Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4 text-center">No</th>
                                <th className="px-6 py-4">Group Identity</th>
                                <th className="px-6 py-4 text-center">System Key</th>
                                <th className="px-6 py-4 text-center">Categories</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {groups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No groups found</p>
                                    </td>
                                </tr>
                            ) : (
                                groups.data.map((group, index) => (
                                    <tr key={group.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-center text-[10px] font-black text-slate-400">
                                            {(groups.current_page - 1) * groups.per_page + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                                    {group.icon_path ? (
                                                        <img src={`/storage/${group.icon_path}`} alt={group.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Layers className="w-6 h-6 text-slate-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 leading-tight group-hover:text-shopee-gold transition-colors tracking-tight uppercase">{group.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Main Catalog Group</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <code className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                                {group.key}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md min-w-[24px]">
                                                    {group.categories_count || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 pr-1">
                                                <button 
                                                    onClick={() => openEditModal(group)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors active:scale-90"
                                                    title="Edit Group"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteConfirm(group)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-90"
                                                    title="Delete Group"
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
            <div className="flex items-center justify-between mt-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing {groups.from || 0} to {groups.to || 0} of {groups.total} groups
                </p>
                <div className="flex items-center gap-1.5">
                    {(groups.links || []).map((link, i) => {
                        if (link.label.includes('Previous')) {
                            return (
                                <Link
                                    key={i}
                                    href={link.url || ''}
                                    className={`w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 transition-all ${
                                        !link.url ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-50 hover:text-shopee-gold hover:border-shopee-gold'
                                    }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                            );
                        }
                        if (link.label.includes('Next')) {
                            return (
                                <Link
                                    key={i}
                                    href={link.url || ''}
                                    className={`w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 transition-all ${
                                        !link.url ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-50 hover:text-shopee-gold hover:border-shopee-gold'
                                    }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            );
                        }
                        return (
                            <Link
                                key={i}
                                href={link.url || ''}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all shadow-sm ${
                                    link.active 
                                        ? 'bg-shopee-gold text-slate-900 shadow-shopee-gold/20' 
                                        : 'bg-white border border-gray-100 text-slate-500 hover:border-shopee-gold hover:text-shopee-gold'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* ─── CREATE / EDIT MODAL ─── */}
            <AdminModal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingGroup ? 'Update Group Identity' : 'Add New Catalog Group'}
                subtitle={editingGroup ? `Modifying: ${editingGroup?.name}` : 'Organize your categories by creating top-level groups'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="p-2 space-y-8" encType="multipart/form-data">
                    {/* Nama */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Group Name *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3.5 text-sm font-black text-slate-800 transition-all focus:ring-2 focus:ring-shopee-gold/20"
                            placeholder="e.g. BLIYYAN MART"
                        />
                        {errors.name && <div className="text-red-500 text-[10px] mt-1.5 font-bold uppercase ml-1 tracking-tighter">{errors.name}</div>}
                    </div>

                    {/* Icon Upload */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Group Icon (SVG/PNG)</label>
                        <div className="relative group overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-3xl flex flex-col items-center justify-center hover:bg-white hover:border-shopee-gold transition-all cursor-pointer shadow-inner">
                            <Upload className="w-10 h-10 text-slate-300 mb-4 group-hover:text-shopee-gold group-hover:scale-110 transition-all" />
                            <div className="text-center">
                                {data.image ? (
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> {data.image.name.slice(0, 20)}...
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Click to browse icons</p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter italic leading-relaxed">High resolution SVG or PNG <br/> Works best for thumbnails</p>
                                    </>
                                )}
                            </div>
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => setData('image', e.target.files[0])}
                            />
                        </div>
                        {errors.image && <div className="text-red-500 text-[10px] mt-1.5 font-bold uppercase ml-1 tracking-tighter">{errors.image}</div>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className={`w-4 h-4 text-shopee-gold ${processing ? 'animate-pulse' : ''}`} />
                            {processing ? 'Processing...' : editingGroup ? 'Confirm Changes' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            {/* ─── DELETE CONFIRM MODAL ─── */}
            <AdminModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Group" size="md">
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="w-10 h-10 text-red-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">Delete this group?</h4>
                    <p className="text-sm text-gray-500 mb-2">Removing <strong className="text-slate-900">"{deleteConfirm?.name}"</strong> is permanent.</p>
                    <div className="p-3 bg-red-50 rounded-xl inline-block mb-8">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-none">This action cannot be undone</p>
                    </div>
                    <div className="flex justify-center gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                            Cancel
                        </button>
                        <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20">
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </AdminModal>
        </AdminLayout>
    );
}
