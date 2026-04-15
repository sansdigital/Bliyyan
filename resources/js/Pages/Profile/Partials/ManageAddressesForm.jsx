import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useToast } from '@/Components/Toast';
import { Home, Briefcase, MapPin, AlertCircle, X } from 'lucide-react';

// Field validation alert component
function ValidationAlert({ errors }) {
    if (!errors || Object.keys(errors).length === 0) return null;

    const fieldLabels = {
        recipient_name: 'Full Name',
        email: 'Email',
        phone_number: 'Phone Number',
        address_line_1: 'Full Address',
        city: 'City / Regency',
        province: 'Province',
        postal_code: 'Postal Code',
    };

    const errorMessages = Object.entries(errors).map(([key, val]) => ({
        label: fieldLabels[key] || key,
        message: Array.isArray(val) ? val[0] : val
    }));

    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 animate-fade-in">
            <div className="shrink-0 w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2">Please complete the following fields:</p>
                <ul className="space-y-0.5">
                    {errorMessages.map((err, i) => (
                        <li key={i} className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                            <span className="font-black">{err.label}:</span> {err.message}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const LABEL_OPTIONS = [
    { value: 'Home',   icon: Home,      color: 'text-blue-500',   bg: 'bg-blue-50',   ring: 'ring-blue-400' },
    { value: 'Office', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50', ring: 'ring-purple-400' },
    { value: 'Other',  icon: MapPin,    color: 'text-orange-500', bg: 'bg-orange-50', ring: 'ring-orange-400' },
];

function LabelPicker({ value, onChange }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Delivery Place <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
                {LABEL_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const selected = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-wide
                                ${selected ? `${opt.bg} border-current ${opt.color} ring-2 ${opt.ring}/30` : 'border-gray-100 text-gray-400 hover:border-gray-200 bg-white'}`}
                        >
                            <Icon className={`w-5 h-5 ${selected ? opt.color : 'text-gray-300'}`} />
                            {opt.value}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-[10px] text-red-500 font-bold">{error}</p>}
        </div>
    );
}

const inputClass = (hasError) => `w-full bg-gray-50 border ${hasError ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'} rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-shopee/20 focus:border-shopee transition-all`;

export default function ManageAddressesForm({ addresses = [], className = '' }) {
    const toast = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        label: 'Home',
        recipient_name: '',
        email: '',
        phone_number: '',
        address_line_1: '',
        city: '',
        province: '',
        postal_code: '',
        is_default: false,
    });

    const openAdd = () => {
        reset();
        setData('label', 'Home');
        setEditingAddress(null);
        setIsAdding(true);
    };

    const openEdit = (address) => {
        setEditingAddress(address);
        setData({
            label: address.label || 'Home',
            recipient_name: address.recipient_name || '',
            email: address.email || '',
            phone_number: address.phone_number || '',
            address_line_1: address.address_line_1 || '',
            city: address.city || '',
            province: address.province || '',
            postal_code: address.postal_code || '',
            is_default: address.is_default,
        });
        setIsAdding(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAddress) {
            put(route('profile.addresses.update', editingAddress.id), {
                onSuccess: () => { setIsAdding(false); toast.success('Address updated successfully!'); }
            });
        } else {
            post(route('profile.addresses.store'), {
                onSuccess: () => { setIsAdding(false); toast.success('New address saved!'); }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Delete this address?')) {
            destroy(route('profile.addresses.destroy', id), {
                onSuccess: () => toast.success('Address deleted.')
            });
        }
    };

    const handleSetDefault = (id) => {
        router.patch(route('profile.addresses.set-default', id), {}, {
            onSuccess: () => toast.success('Default address updated.')
        });
    };

    return (
        <section className={className}>
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Address List</h2>
                    <p className="mt-1 text-xs text-gray-500 font-bold uppercase tracking-tighter">Manage your Pi order shipping addresses.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={openAdd}
                        className="bg-shopee text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-shopee-hover transition-all shadow-sm active:scale-95"
                    >
                        + Add Address
                    </button>
                )}
            </header>

            {isAdding ? (
                <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50/80 p-6 rounded-2xl border border-gray-100">

                    {/* Validation Alert */}
                    <ValidationAlert errors={errors} />

                    {/* Label Picker */}
                    <LabelPicker value={data.label} onChange={(v) => setData('label', v)} />

                    {/* Full Name */}
                    <Field label="Full Name" required error={errors.recipient_name}>
                        <input
                            value={data.recipient_name}
                            onChange={e => setData('recipient_name', e.target.value)}
                            className={inputClass(errors.recipient_name)}
                            placeholder="Enter recipient's full name"
                        />
                    </Field>

                    {/* Email */}
                    <Field label="Email" required error={errors.email}>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className={inputClass(errors.email)}
                            placeholder="e.g. name@email.com"
                        />
                    </Field>

                    {/* Phone */}
                    <Field label="Phone Number" required error={errors.phone_number}>
                        <input
                            type="tel"
                            value={data.phone_number}
                            onChange={e => setData('phone_number', e.target.value)}
                            className={inputClass(errors.phone_number)}
                            placeholder="e.g. 081234567890"
                        />
                    </Field>

                    {/* Full Address */}
                    <Field label="Full Address" required error={errors.address_line_1}>
                        <textarea
                            value={data.address_line_1}
                            onChange={e => setData('address_line_1', e.target.value)}
                            className={inputClass(errors.address_line_1)}
                            rows={2}
                            placeholder="Street name, block, RT/RW, etc."
                        />
                    </Field>

                    {/* City & Province */}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City / Regency" required error={errors.city}>
                            <input
                                value={data.city}
                                onChange={e => setData('city', e.target.value)}
                                className={inputClass(errors.city)}
                                placeholder="e.g. Surabaya"
                            />
                        </Field>
                        <Field label="Province" required error={errors.province}>
                            <input
                                value={data.province}
                                onChange={e => setData('province', e.target.value)}
                                className={inputClass(errors.province)}
                                placeholder="e.g. Jawa Timur"
                            />
                        </Field>
                    </div>

                    {/* Postal Code */}
                    <Field label="Postal Code" required error={errors.postal_code}>
                        <input
                            value={data.postal_code}
                            onChange={e => setData('postal_code', e.target.value)}
                            className={`${inputClass(errors.postal_code)} max-w-[180px]`}
                            placeholder="e.g. 60111"
                            maxLength={10}
                        />
                    </Field>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 bg-shopee text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:bg-shopee-hover transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                        <div className="col-span-2 py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-xs font-bold uppercase">No shipping addresses yet.</p>
                            <p className="text-gray-300 text-[10px] mt-1">Add your first delivery address above.</p>
                        </div>
                    ) : (
                        addresses.map((address) => {
                            const opt = LABEL_OPTIONS.find(o => o.value === address.label) || LABEL_OPTIONS[2];
                            const Icon = opt.icon;
                            return (
                                <div key={address.id} className={`p-5 rounded-2xl border relative transition-all ${address.is_default ? 'border-shopee bg-shopee/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                    {address.is_default && (
                                        <span className="absolute top-4 right-4 bg-shopee text-white text-[8px] font-black uppercase px-2 py-1 rounded-full">Main</span>
                                    )}

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-7 h-7 rounded-lg ${opt.bg} flex items-center justify-center`}>
                                            <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${opt.color}`}>{address.label || 'Other'}</span>
                                        <h4 className="text-sm font-black text-gray-800 ml-1">{address.recipient_name}</h4>
                                    </div>

                                    <div className="space-y-0.5 mb-3 pl-9">
                                        {address.email && <p className="text-xs text-gray-400 font-medium">✉ {address.email}</p>}
                                        {address.phone_number && <p className="text-xs text-gray-500 font-medium">📞 {address.phone_number}</p>}
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                            📍 {[address.address_line_1, address.city, address.province, address.postal_code].filter(Boolean).join(', ')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 pl-9">
                                        <button onClick={() => openEdit(address)} className="text-[10px] font-black text-gray-400 hover:text-shopee uppercase tracking-widest transition-colors">Edit</button>
                                        {!address.is_default && (
                                            <>
                                                <button onClick={() => handleSetDefault(address.id)} className="text-[10px] font-black text-gray-400 hover:text-shopee uppercase tracking-widest transition-colors">Set as Main</button>
                                                <button onClick={() => handleDelete(address.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </section>
    );
}
