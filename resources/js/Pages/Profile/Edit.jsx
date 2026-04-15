import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import ManageAddressesForm from './Partials/ManageAddressesForm';

export default function Edit({ mustVerifyEmail, status, addresses }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <AuthenticatedLayout>
            <Head title="My Profile" />

            <div className="pb-24 md:pb-10 pt-6 px-4 max-w-4xl mx-auto">
                {/* Pi Profile Card */}
                <div className="bg-gradient-to-br from-shopee to-shopee-hover rounded-2xl p-6 text-white mb-6 shadow-md relative overflow-hidden">
                    <div className="absolute right-[-5%] bottom-[-20%] opacity-10 text-[120px] font-black italic select-none">π</div>
                    <div className="relative z-10 flex items-center gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-black ring-4 ring-white/30">
                            {initials}
                        </div>
                        <div>
                            <div className="text-xl font-black tracking-tight">{user.name}</div>
                            <div className="text-white/80 text-sm font-medium">{user.email}</div>
                            {user.pi_uid && (
                                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1">
                                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Pi UID</span>
                                    <span className="text-[11px] font-mono font-bold text-white truncate max-w-[160px]">{user.pi_uid}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Badges */}
                    <div className="mt-4 flex gap-2 flex-wrap relative z-10">
                        <span className="text-[10px] font-bold bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                            {user.is_admin ? '👑 Administrator' : '🛒 Pi Pioneer'}
                        </span>
                        {user.pi_uid ? (
                            <span className="text-[10px] font-bold bg-emerald-500/40 backdrop-blur px-2 py-1 rounded-full border border-emerald-400/30 shadow-inner">
                                ✅ Pi Network Verified
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold bg-slate-500/40 backdrop-blur px-2 py-1 rounded-full border border-slate-400/30 opacity-80">
                                🔒 Unverified Visitor
                            </span>
                        )}
                    </div>
                </div>

                {/* Management of Addresses */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <ManageAddressesForm addresses={addresses} />
                </div>


            </div>
        </AuthenticatedLayout>
    );
}
