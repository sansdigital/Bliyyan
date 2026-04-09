import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useToast } from '@/Components/Toast';

export default function ManageAddressesForm({ addresses = [], className = '' }) {
    const toast = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        code_reg: '',
        label: '',
        recipient_name: '',
        phone_number: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        province: '',
        postal_code: '',
        is_default: false,
    });

    const openAdd = () => {
        reset();
        setEditingAddress(null);
        setIsAdding(true);
    };

    const openEdit = (address) => {
        setEditingAddress(address);
        setData({
            code_reg: address.code_reg || '',
            label: address.label || '',
            recipient_name: address.recipient_name,
            phone_number: address.phone_number || '',
            address_line_1: address.address_line_1 || '',
            address_line_2: address.address_line_2 || '',
            city: address.city || '',
            province: address.province,
            postal_code: address.postal_code || '',
            is_default: address.is_default,
        });
        setIsAdding(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAddress) {
            put(route('profile.addresses.update', editingAddress.id), {
                onSuccess: () => {
                    setIsAdding(false);
                    toast.success('Alamat berhasil diperbarui!');
                }
            });
        } else {
            post(route('profile.addresses.store'), {
                onSuccess: () => {
                    setIsAdding(false);
                    toast.success('Alamat baru ditambahkan!');
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Hapus alamat ini?')) {
            destroy(route('profile.addresses.destroy', id), {
                onSuccess: () => toast.success('Alamat dihapus.')
            });
        }
    };

    const handleSetDefault = (id) => {
        router.patch(route('profile.addresses.set-default', id), {}, {
            onSuccess: () => toast.success('Alamat utama diubah.')
        });
    };

    return (
        <section className={className}>
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Daftar Alamat</h2>
                    <p className="mt-1 text-xs text-gray-500 font-bold uppercase tracking-tighter">Kelola alamat pengiriman pesanan Pi Anda.</p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={openAdd}
                        className="bg-shopee text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-shopee-hover transition-all shadow-sm active:scale-95"
                    >
                        Tambah Alamat
                    </button>
                )}
            </header>

            {isAdding ? (
                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                CODE REG <span className="text-[8px] font-normal opacity-60 text-gray-500 italic">(Optional)</span>
                            </label>
                            <input 
                                value={data.code_reg}
                                onChange={e => setData('code_reg', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                                placeholder="E.g. REG-12345"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                Label Alamat <span className="text-[8px] font-normal opacity-60 text-gray-500 italic">(Optional)</span>
                            </label>
                            <input 
                                value={data.label}
                                onChange={e => setData('label', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                                placeholder="Rumah / Kantor"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                Nama Penerima <span className="text-red-500">*</span>
                            </label>
                            <input 
                                value={data.recipient_name}
                                onChange={e => setData('recipient_name', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                                required
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                Nomor Telepon <span className="text-[8px] font-normal opacity-60 text-gray-500 italic">(Optional)</span>
                            </label>
                            <input 
                                value={data.phone_number}
                                onChange={e => setData('phone_number', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                Kode Pos <span className="text-[8px] font-normal opacity-60 text-gray-500 italic">(Optional)</span>
                            </label>
                            <input 
                                value={data.postal_code}
                                onChange={e => setData('postal_code', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                Alamat Lengkap <span className="text-[8px] font-normal opacity-60 text-gray-500 italic">(Optional)</span>
                            </label>
                            <textarea 
                                value={data.address_line_1}
                                onChange={e => setData('address_line_1', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                                rows="1"
                            ></textarea>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                Kota / Kabupaten <span className="text-[8px] font-normal opacity-60 text-gray-500 italic">(Optional)</span>
                            </label>
                            <input 
                                value={data.city}
                                onChange={e => setData('city', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 items-center flex gap-1">
                                Provinsi <span className="text-red-500">*</span>
                            </label>
                            <input 
                                value={data.province}
                                onChange={e => setData('province', e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm focus:ring-shopee focus:border-shopee"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="bg-shopee text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md disabled:bg-gray-300"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Alamat'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                        <div className="col-span-2 py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-xs font-bold uppercase">Belum ada alamat pengiriman.</p>
                        </div>
                    ) : (
                        addresses.map((address) => (
                            <div key={address.id} className={`p-5 rounded-2xl border relative transition-all ${address.is_default ? 'border-shopee bg-shopee/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                {address.is_default && (
                                    <span className="absolute top-4 right-4 bg-shopee text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-sm">Utama</span>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-shopee uppercase tracking-widest bg-shopee/10 px-2 py-0.5 rounded">{address.label}</span>
                                    <h4 className="text-sm font-black text-gray-800">{address.recipient_name}</h4>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-1">{address.phone_number}</p>
                                <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
                                    {address.address_line_1 ? address.address_line_1 + ', ' : ''}
                                    {address.city ? address.city + ', ' : ''}
                                    {address.province}
                                    {address.postal_code ? ' ' + address.postal_code : ''}
                                    {address.code_reg ? ` (${address.code_reg})` : ''}
                                </p>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => openEdit(address)} className="text-[10px] font-black text-gray-400 hover:text-shopee uppercase tracking-widest transition-colors">Edit</button>
                                    {!address.is_default && (
                                        <>
                                            <button onClick={() => handleSetDefault(address.id)} className="text-[10px] font-black text-gray-400 hover:text-shopee uppercase tracking-widest transition-colors">Set Utama</button>
                                            <button onClick={() => handleDelete(address.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">Hapus</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
    );
}
