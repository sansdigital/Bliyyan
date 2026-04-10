import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Edit({ auth, product, categories }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        category_id: product.category_id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        is_active: product.is_active,
        is_featured: product.is_featured,
        image: null,
        gallery: [],
        _method: 'put',
    });

    const [preview, setPreview] = useState(
        product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : null
    );

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : null);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.products.update', product.id));
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title={`Edit ${product.name}`} />

            <div className="max-w-4xl">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <Link href={route('admin.products.index')} className="text-shopee text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                            Back to List
                        </Link>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Edit Product</h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Update your product specifications and stock</p>
                    </div>
                </div>

                <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Name</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                            />
                            {errors.name && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.name}</div>}
                        </div>

                        {/* Category */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                            <select 
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                            >
                                <option value="">Select Category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.category_id}</div>}
                        </div>

                        {/* Price */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Price (π Pi)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-shopee font-black italic">π</div>
                                <input 
                                    type="number"
                                    step="0.0000001"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    className="w-full rounded-xl border-gray-200 pl-8 focus:border-shopee focus:ring-shopee transition-all"
                                />
                            </div>
                            {errors.price && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.price}</div>}
                        </div>

                        {/* Stock */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Unit Stock</label>
                            <input 
                                type="number"
                                value={data.stock}
                                onChange={(e) => setData('stock', e.target.value)}
                                className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                            />
                            {errors.stock && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.stock}</div>}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Main Image</label>
                            <div className="flex items-center gap-4">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    </div>
                                )}
                                <div>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-shopee/10 file:text-shopee hover:file:bg-shopee/20 transition-all cursor-pointer"
                                    />
                                    {errors.image && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.image}</div>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Add Photo Gallery</label>
                            <input 
                                type="file" 
                                multiple
                                accept="image/*"
                                onChange={(e) => setData('gallery', Array.from(e.target.files))}
                                className="text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition-all cursor-pointer"
                            />
                            {errors.gallery && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.gallery}</div>}
                        </div>
                    </div>

                    {/* Gallery Preview / Management */}
                    {product.images?.length > 0 && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Photo Gallery ({product.images.length})</label>
                            <div className="flex flex-wrap gap-4">
                                {product.images.map((img) => (
                                    <div key={img.id} className="relative group">
                                        <img 
                                            src={img.image_path.startsWith('http') ? img.image_path : `/storage/${img.image_path}`} 
                                            alt="Gallery" 
                                            className="w-24 h-24 object-cover rounded-lg border border-gray-100 shadow-sm"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if(confirm('Delete this photo?')) {
                                                    import('@inertiajs/react').then(({ router }) => {
                                                        router.delete(route('admin.products.image.delete', img.id));
                                                    });
                                                }
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Description</label>
                        <textarea 
                            rows="5"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                        ></textarea>
                        {errors.description && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.description}</div>}
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-8 py-4 border-y border-gray-50">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-shopee focus:ring-shopee"
                            />
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest group-hover:text-shopee">Activate Product</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={data.is_featured}
                                onChange={(e) => setData('is_featured', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-shopee focus:ring-shopee"
                            />
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest group-hover:text-shopee">Featured (Mall)</span>
                        </label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit"
                            disabled={processing}
                            className="bg-shopee hover:bg-shopee-hover text-white px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-shopee/20 disabled:bg-gray-300"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
