import AdminLayout from '@/Layouts/AdminLayout';
import AdminModal from '@/Components/AdminModal';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/Components/Toast';
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    ChevronRight,
    Layers,
    Tag,
    Settings2,
    Info,
    FolderTree,
    Box,
    ChevronLeft,
    Filter,
    ChevronDown
} from 'lucide-react';

export default function Index({ auth, categories, groups = [], filters = {} }) {
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Safety check for filters
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedGroup, setSelectedGroup] = useState(filters?.category_group_id || '');

    // Form logic
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        category_group_id: (groups && groups.length > 0) ? groups[0].id : '',
    });

    // Handle initial loading
    if (!categories || !categories.data) {
        return (
            <AdminLayout user={auth.user}>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Search className="w-8 h-8 text-gray-200 animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    // Live Search with Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters?.search || '';
            const currentGroup = filters?.category_group_id || '';

            const hasChanged =
                searchQuery !== currentSearch ||
                selectedGroup !== currentGroup;

            if (hasChanged) {
                router.get(route('admin.categories.index'), {
                    search: searchQuery,
                    category_group_id: selectedGroup
                }, {
                    preserveState: true,
                    replace: true
                });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedGroup, filters]);

    const openCreateModal = () => {
        setEditingCategory(null);
        reset();
        setData('category_group_id', (groups && groups.length > 0) ? groups[0].id : '');
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description || '',
            category_group_id: category.category_group_id || '',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('admin.categories.update', editingCategory.id), {
                onSuccess: () => {
                    closeModal();
                    toast.success('Kategori diperbarui!');
                },
                onError: () => toast.error('Gagal menyimpan kategori.')
            });
        } else {
            post(route('admin.categories.store'), {
                onSuccess: () => {
                    closeModal();
                    toast.success('Kategori baru ditambahkan!');
                },
                onError: () => toast.error('Gagal menyimpan kategori.')
            });
        }
    };

    const confirmDelete = () => {
        destroy(route('admin.categories.destroy', deleteConfirm.id), {
            onSuccess: () => {
                setDeleteConfirm(null);
                toast.success('Kategori berhasil dihapus!');
            }
        });
    };

    const groupBadgeColor = (key) => {
        if (key === 'bliyyan') return 'bg-orange-50 text-orange-600 border-orange-100';
        if (key === 'bliyyanmart') return 'bg-green-50 text-green-600 border-green-100';
        return 'bg-blue-50 text-blue-600 border-blue-100';
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Categories Management" />

            {/* Breadcrumb Area */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Categories</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        <span className="hover:text-shopee-gold cursor-pointer transition-colors" onClick={() => router.get(route('admin.products.index'))}>Catalog</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-slate-800">Categories</span>
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
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                    />
                </div>

                {/* Filter Group */}
                <div className="w-[200px] relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                        <Layers className="w-3.5 h-3.5 text-shopee-gold" />
                    </div>
                    <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-10 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-shopee-gold/20 appearance-none transition-all cursor-pointer"
                    >
                        <option value="">All Groups</option>
                        {(groups || []).map(group => (
                            <option key={group.id} value={group.id}>{group.name.toUpperCase()}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <Link
                        href={route('admin.category-groups.index')}
                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"
                    >
                        <Settings2 className="w-3.5 h-3.5" /> Manage Groups
                    </Link>
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-2.5 bg-shopee-gold hover:bg-yellow-500 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-shopee-gold/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Add Category
                    </button>
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4 text-center">No</th>
                                <th className="px-6 py-4">Category Name</th>
                                <th className="px-6 py-4 text-center">Group</th>
                                <th className="px-6 py-4 text-center">Products Count</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categories.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <FolderTree className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No categories found</p>
                                    </td>
                                </tr>
                            ) : (
                                categories.data.map((category, index) => (
                                    <tr key={category.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-center text-[10px] font-black text-slate-400">
                                            {(categories.current_page - 1) * categories.per_page + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 leading-tight group-hover:text-shopee-gold transition-colors">{category.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight line-clamp-1">{category.description || 'No description provided'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${groupBadgeColor(category.category_group?.key)}`}>
                                                {category.category_group?.name || 'Core System'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Box className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md min-w-[24px]">
                                                    {category.products_count || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 pr-1 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(category)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors active:scale-90"
                                                    title="Edit Category"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(category)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-90"
                                                    title="Delete Category"
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

            {/* Real Pagination UI */}
            <div className="flex items-center justify-between mt-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing {categories.from || 0} to {categories.to || 0} of {categories.total} categories
                </p>
                <div className="flex items-center gap-1.5">
                    {(categories.links || []).map((link, i) => {
                        // Previous Arrow
                        if (link.label.includes('Previous')) {
                            return (
                                <Link
                                    key={i}
                                    href={link.url || ''}
                                    className={`w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 transition-all ${!link.url ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-50 hover:text-shopee-gold hover:border-shopee-gold'
                                        }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Link>
                            );
                        }
                        // Next Arrow
                        if (link.label.includes('Next')) {
                            return (
                                <Link
                                    key={i}
                                    href={link.url || ''}
                                    className={`w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 transition-all ${!link.url ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-50 hover:text-shopee-gold hover:border-shopee-gold'
                                        }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            );
                        }
                        // Page Number
                        return (
                            <Link
                                key={i}
                                href={link.url || ''}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all shadow-sm ${link.active
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
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
                subtitle={editingCategory ? `Updating: ${editingCategory?.name}` : 'Organize your products by creating descriptive categories'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="p-2 space-y-6">
                    {/* Nama */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category Name *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                            placeholder="e.g. Smartphones & Accessories"
                            autoFocus
                        />
                        {errors.name && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.name}</div>}
                    </div>

                    {/* Pilar Grup */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Group *</label>
                        <select
                            value={data.category_group_id}
                            onChange={e => setData('category_group_id', e.target.value)}
                            className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                        >
                            <option value="">Select Group...</option>
                            {groups?.map(g => (
                                <option key={g.id} value={g.id}>{g.name.toUpperCase()}</option>
                            ))}
                        </select>
                        {errors.category_group_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.category_group_id}</div>}
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                        <textarea
                            rows="3"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className="w-full rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all resize-none"
                            placeholder="Brief info about this category..."
                        />
                        {errors.description && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.description}</div>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-[2] py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing && <Search className="w-4 h-4 animate-spin" />}
                            {processing ? 'Processing...' : editingCategory ? 'Update Category' : 'Create Category'}
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
                    <h4 className="text-lg font-black text-slate-800 mb-2">Delete this category?</h4>
                    <p className="text-sm text-gray-500 mb-2">Removing <strong className="text-slate-900">"{deleteConfirm?.name}"</strong> does not delete products inside it.</p>
                    <div className="p-3 bg-red-50 rounded-xl inline-block mb-8">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-none">This action cannot be undone</p>
                    </div>
                    <div className="flex justify-center gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                            Cancel
                        </button>
                        <button onClick={confirmDelete} className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20">
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </AdminModal>
        </AdminLayout>
    );
}
