import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Create({ auth, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        name: '',
        description: '',
        price: '',
        stock: '',
        is_active: true,
        is_featured: false,
        image: null,
    });

    const [preview, setPreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.products.store'));
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Tambah Produk Baru" />

            <div className="max-w-4xl">
                <div className="mb-8">
                    <Link href={route('admin.products.index')} className="text-shopee text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                        Kembali ke Daftar
                    </Link>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Tambah Produk Baru</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Lengkapi detail produk elektronik yang ingin Anda jual</p>
                </div>

                <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Produk</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                                placeholder="Contoh: iPhone 15 Pro Max"
                            />
                            {errors.name && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.name}</div>}
                        </div>

                        {/* Category */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kategori</label>
                            <select 
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.category_id}</div>}
                        </div>

                        {/* Price */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Harga (π Pi)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-shopee font-black italic">π</div>
                                <input 
                                    type="number"
                                    step="0.0000001"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    className="w-full rounded-xl border-gray-200 pl-8 focus:border-shopee focus:ring-shopee transition-all"
                                    placeholder="0.0000"
                                />
                            </div>
                            {errors.price && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.price}</div>}
                        </div>

                        {/* Stock */}
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Stok Unit</label>
                            <input 
                                type="number"
                                value={data.stock}
                                onChange={(e) => setData('stock', e.target.value)}
                                className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                                placeholder="0"
                            />
                            {errors.stock && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.stock}</div>}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Foto Produk</label>
                        <div className="flex items-center gap-6">
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                            ) : (
                                <div className="w-24 h-24 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageChange}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-shopee/10 file:text-shopee hover:file:bg-shopee/20 transition-all cursor-pointer"
                            />
                        </div>
                        {errors.image && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.image}</div>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Deskripsi Produk</label>
                        <textarea 
                            rows="5"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full rounded-xl border-gray-200 focus:border-shopee focus:ring-shopee transition-all"
                            placeholder="Jelaskan spesifikasi dan kondisi produk..."
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
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest group-hover:text-shopee">Aktifkan Produk</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={data.is_featured}
                                onChange={(e) => setData('is_featured', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-shopee focus:ring-shopee"
                            />
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest group-hover:text-shopee">Unggulan (Mall)</span>
                        </label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit"
                            disabled={processing}
                            className="bg-shopee hover:bg-shopee-hover text-white px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-shopee/20 disabled:bg-gray-300"
                        >
                            Simpan Produk
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
