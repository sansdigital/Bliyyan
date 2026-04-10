import AdminLayout from '@/Layouts/AdminLayout';
import AdminModal from '@/Components/AdminModal';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useToast } from '@/Components/Toast';
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Package,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Tag,
    Layers,
    CheckCircle2,
    XCircle,
    Star,
    Filter,
    ChevronDown
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function Index({ auth, products, categories, category_groups, filters }) {
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [preview, setPreview] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedGroup, setSelectedGroup] = useState(filters.category_group_id || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');

    // Filter categories by selected group for the UI
    const displayedCategories = useMemo(() => {
        if (!selectedGroup) return categories;
        return categories.filter(cat => cat.category_group_id == selectedGroup);
    }, [selectedGroup, categories]);

    const { data, setData, post, processing, errors, reset } = useForm({
        category_id: '',
        name: '',
        description: '',
        price: '',
        stock: '',
        is_active: true,
        is_featured: false,
        image: null,
        gallery: [],
        _method: 'post',
    });

    // Live Search with Debounce (Search + Group + Category)
    useEffect(() => {
        const timer = setTimeout(() => {
            const hasChanged =
                searchQuery !== (filters.search || '') ||
                selectedGroup !== (filters.category_group_id || '') ||
                selectedCategory !== (filters.category_id || '');

            if (hasChanged) {
                router.get(route('admin.products.index'), {
                    search: searchQuery,
                    category_group_id: selectedGroup,
                    category_id: selectedCategory
                }, {
                    preserveState: true,
                    replace: true
                });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedGroup, selectedCategory]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('admin.products.index'), {
            search: searchQuery,
            category_group_id: selectedGroup,
            category_id: selectedCategory
        }, {
            preserveState: true,
            replace: true
        });
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        reset();
        setData('_method', 'post');
        setPreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setData({
            category_id: product.category_id || '',
            name: product.name,
            description: product.description || '',
            price: product.price,
            stock: product.stock,
            is_active: product.is_active,
            is_featured: product.is_featured,
            image: null,
            gallery: [],
            _method: 'put',
        });
        setPreview(product.image
            ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`)
            : null
        );
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        reset();
        setPreview(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);
        if (file) setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = editingProduct
            ? route('admin.products.update', editingProduct.id)
            : route('admin.products.store');

        post(url, {
            forceFormData: true,
            onSuccess: () => {
                closeModal();
                toast.success(editingProduct ? 'Product successfully updated!' : 'Product successfully added!');
            },
            onError: () => toast.error('Failed to save. Please check the form again.')
        });
    };

    const handleDelete = (product) => {
        setDeleteConfirm(product);
    };

    const confirmDelete = () => {
        router.delete(route('admin.products.destroy', deleteConfirm.id), {
            onSuccess: () => {
                setDeleteConfirm(null);
                toast.success('Product successfully deleted!');
            }
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Product Management" />

            {/* Breadcrumb Area */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Products</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        <span className="hover:text-shopee-gold cursor-pointer transition-colors">Catalog</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-slate-800">Product List</span>
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[240px] group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400 group-focus-within:text-shopee-gold transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all"
                    />
                </form>

                {/* Group Filter */}
                <div className="relative min-w-[160px]">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                        <Layers className="w-3.5 h-3.5" />
                    </div>
                    <select
                        value={selectedGroup}
                        onChange={(e) => {
                            setSelectedGroup(e.target.value);
                            setSelectedCategory(''); // Reset category when group changes
                        }}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-8 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-shopee-gold/20 appearance-none transition-all cursor-pointer"
                    >
                        <option value="">All Groups</option>
                        {category_groups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>

                {/* Category Filter */}
                <div className="relative min-w-[160px]">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                        <Tag className="w-3.5 h-3.5" />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-8 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-shopee-gold/20 appearance-none transition-all cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {displayedCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>

                <div className="h-8 w-px bg-gray-100 hidden md:block"></div>

                <button
                    onClick={openCreateModal}
                    className="ml-auto px-6 py-2.5 bg-shopee-gold hover:bg-yellow-500 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-shopee-gold/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Product
                </button>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4 text-center">No</th>
                                <th className="px-6 py-4">Product Info</th>
                                <th className="px-6 py-4 text-center">Group</th>
                                <th className="px-6 py-4 text-center">Category</th>
                                <th className="px-6 py-4 text-center">Price</th>
                                <th className="px-6 py-4 text-center">Stock</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No products found</p>
                                    </td>
                                </tr>
                            ) : (
                                products.data.map((product, index) => (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-center text-[10px] font-black text-slate-400">
                                            {(products.current_page - 1) * products.per_page + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-gray-100 shadow-sm shrink-0">
                                                    <img
                                                        src={product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : `https://dummyimage.com/100x100/f5f5f5/D4AF37.png&text=${product.name.charAt(0)}`}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-slate-800 leading-tight group-hover:text-shopee-gold transition-colors truncate max-w-[240px]">
                                                        {product.name}
                                                        {product.is_featured && <Star className="w-3 h-3 text-shopee-gold fill-shopee-gold inline ml-1.5" />}
                                                    </h4>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {product.category?.category_group ? (
                                                <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${product.category.category_group.key === 'bliyyan' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        product.category.category_group.key === 'bliyyanmart' ? 'bg-green-50 text-green-600 border-green-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {product.category.category_group.name}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-gray-300 uppercase italic">No Group</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-tighter">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-sm">
                                                <span className="italic tracking-tighter text-shopee-gold pb-0.5">π</span>
                                                {Number(product.price)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`text-sm font-black ${product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-orange-500' : 'text-slate-700'}`}>
                                                    {product.stock}
                                                </span>
                                                {product.stock === 0 ? (
                                                    <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Out of Stock</span>
                                                ) : product.stock < 5 ? (
                                                    <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">Low</span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 pr-1 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors active:scale-90"
                                                    title="Edit Product"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-90"
                                                    title="Delete Product"
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

            {/* Pagination Section */}
            <div className="flex items-center justify-between mt-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing {products.from || 0} to {products.to || 0} of {products.total} products
                </p>
                <div className="flex items-center gap-1.5">
                    {products.links.map((link, i) => {
                        // Previous Arrow
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
                        // Next Arrow
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
                        // Page Number
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
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                subtitle={editingProduct ? `Updating: ${editingProduct?.name}` : 'Fill in product details for Bliyyan Marketplace'}
                size="xl"
            >
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Product Name *</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="w-full rounded-2xl border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all border-none"
                                placeholder="iPhone 15 Pro Max"
                            />
                            {errors.name && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.name}</div>}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category *</label>
                            <select
                                value={data.category_id}
                                onChange={e => setData('category_id', e.target.value)}
                                className="w-full rounded-2xl border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-shopee-gold/20 transition-all border-none"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.category_id}</div>}
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Price (π) *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-shopee-gold font-black italic text-sm">π</div>
                                <input
                                    type="number"
                                    step="0.0000001"
                                    value={data.price}
                                    onChange={e => setData('price', e.target.value)}
                                    className="w-full rounded-2xl border-gray-100 bg-slate-50 pl-9 pr-4 py-3 text-sm font-black focus:ring-2 focus:ring-shopee-gold/20 transition-all border-none"
                                    placeholder="0.0000"
                                />
                            </div>
                            {errors.price && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.price}</div>}
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Stock Unit *</label>
                            <input
                                type="number"
                                value={data.stock}
                                onChange={e => setData('stock', e.target.value)}
                                className="w-full rounded-2xl border-gray-100 bg-slate-50 px-4 py-3 text-sm font-black focus:ring-2 focus:ring-shopee-gold/20 transition-all border-none"
                                placeholder="0"
                            />
                            {errors.stock && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.stock}</div>}
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Main Image</label>
                            <div className="flex items-center gap-4 p-2 bg-slate-50 rounded-2xl">
                                {preview ? (
                                    <div className="relative group">
                                        <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-white shadow-md flex-shrink-0" />
                                        <button onClick={() => { setPreview(null); setData('image', null); }} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200 flex-shrink-0">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <input
                                        type="file"
                                        id="main-image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="main-image" className="px-4 py-2 bg-shopee-gold text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer hover:bg-yellow-500 transition-all text-center">
                                        Upload Image
                                    </label>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 text-center px-1">Max 2MB, JPG/PNG</p>
                                </div>
                            </div>
                            {errors.image && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.image}</div>}
                        </div>

                        {/* Gallery Section */}
                        {editingProduct && (
                            <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Product Gallery</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {editingProduct.images?.map((img, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white shadow-sm group">
                                            <img src={img.image_path.startsWith('http') ? img.image_path : `/storage/${img.image_path}`} className="w-full h-full object-cover" alt="" />
                                            <button
                                                type="button"
                                                onClick={() => router.delete(route('admin.products.image.delete', img.id), { preserveScroll: true, onSuccess: () => toast.success('Photo deleted') })}
                                                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="w-16 h-16 rounded-lg bg-white border-2 border-dashed border-gray-100 flex items-center justify-center">
                                        <input
                                            type="file"
                                            multiple
                                            id="gallery-input"
                                            className="hidden"
                                            onChange={e => setData('gallery', Array.from(e.target.files))}
                                        />
                                        <label htmlFor="gallery-input" className="p-4 cursor-pointer text-gray-300 hover:text-shopee-gold"><Plus className="w-6 h-6" /></label>
                                    </div>
                                </div>
                                {data.gallery.length > 0 && <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{data.gallery.length} new photos ready to upload.</p>}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Product Description</label>
                        <textarea
                            rows="4"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className="w-full rounded-2xl border-gray-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-shopee-gold/20 transition-all border-none"
                            placeholder="Detailed product specs..."
                        />
                        {errors.description && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase ml-1">{errors.description}</div>}
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-8 py-4 px-2 bg-slate-50 rounded-2xl">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Visible</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={data.is_featured}
                                    onChange={e => setData('is_featured', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-shopee-gold transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Featured</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-10 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {processing ? 'Processing...' : editingProduct ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            {/* ─── DELETE CONFIRM MODAL ─── */}
            <AdminModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Confirm Removal"
                size="md"
            >
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="w-10 h-10 text-red-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">Delete this product?</h4>
                    <p className="text-sm text-gray-500 mb-2">You are about to remove <strong className="text-slate-900">"{deleteConfirm?.name}"</strong>.</p>
                    <div className="p-3 bg-red-50 rounded-xl inline-block">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-none">This action cannot be undone</p>
                    </div>
                    <div className="flex justify-center gap-3 mt-8">
                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                            Keep it
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
