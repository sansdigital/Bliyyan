import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Send,
    Gift,
    CheckCircle,
    XCircle,
    Clock,
    Coins,
    User,
    Hash,
    AlertTriangle,
    ChevronRight,
    Loader2,
    Zap,
} from 'lucide-react';
import axios from 'axios';

export default function RewardsIndex({ auth, users, rewardLog }) {
    const flash = usePage().props.flash || {};
    const stuckPaymentId = usePage().props.stuck_payment_id;
    
    const [activeTab, setActiveTab] = useState('registered');
    const [uidInput, setUidInput] = useState('');
    const [uidAmount, setUidAmount] = useState('0.001');
    const [uidMemo, setUidMemo] = useState('Reward dari Bliyyan Store');
    const [uidLoading, setUidLoading] = useState(false);
    const [uidResult, setUidResult] = useState(null);
    const [diagLoading, setDiagLoading] = useState(false);
    const [incompletePayments, setIncompletePayments] = useState([]);
    const [cancellingId, setCancellingId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        amount: '0.001',
        memo: 'Reward dari Bliyyan Store',
    });

    const handleSendRegistered = (e) => {
        e.preventDefault();
        post(route('admin.rewards.send'), {
            preserveScroll: true,
            onSuccess: () => reset('user_id'),
        });
    };

    const handleSendByUid = async (e) => {
        e.preventDefault();
        setUidLoading(true);
        setUidResult(null);
        try {
            const res = await axios.post(route('admin.rewards.send-by-uid'), {
                pi_uid: uidInput,
                amount: uidAmount,
                memo: uidMemo,
            });
            setUidResult({ success: true, message: res.data.message, payment_id: res.data.payment_id, txid: res.data.txid });
            router.reload({ only: ['rewardLog'] });
        } catch (err) {
            setUidResult({
                success: false,
                message: err.response?.data?.message || 'Terjadi kesalahan.',
                payment_id: err.response?.data?.stuck_payment_id || err.response?.data?.raw?.identifier // Enhanced detection
            });
        } finally {
            setUidLoading(false);
        }
    };

    const fetchIncomplete = async () => {
        setDiagLoading(true);
        try {
            const res = await axios.get(route('admin.rewards.check-incomplete'));
            setIncompletePayments(res.data.data.payments || []);
        } catch (err) {
            alert('Gagal mengecek data: ' + (err.response?.data?.message || err.message));
        } finally {
            setDiagLoading(false);
        }
    };

    const handleCancelPayment = async (pid) => {
        if (!confirm('Batalkan pembayaran ini?')) return;
        setCancellingId(pid);
        try {
            const res = await axios.post(route('admin.rewards.cancel-stuck'), { payment_id: pid });
            alert(res.data.message);
            router.reload(); // Refresh to clear flash props and reload reward list
            fetchIncomplete();
        } catch (err) {
            alert('Gagal membatalkan: ' + (err.response?.data?.message || err.message));
        } finally {
            setCancellingId(null);
        }
    };

    const completedCount = rewardLog.filter(r => r.status === 'completed').length;
    const uniqueUids = [...new Set(rewardLog.map(r => r.pi_uid))].length;

    return (
        <AdminLayout user={auth.user}>
            <Head title="Pi A2U Rewards" />

            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Gift className="w-5 h-5 text-white" />
                            </div>
                            Pi A2U Rewards
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 ml-13">
                            Kirim Pi dari App ke User (App-to-User)
                        </p>
                    </div>

                    {/* Progress Badge */}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl px-5 py-3 text-white text-right shadow-lg">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Unique Wallets</p>
                        <p className="text-3xl font-black tracking-tight">
                            {uniqueUids}
                            <span className="text-lg text-purple-300">/10</span>
                        </p>
                        <div className="w-full bg-purple-900 rounded-full h-1.5 mt-1">
                            <div
                                className="bg-yellow-400 h-1.5 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(uniqueUids / 10 * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Terkirim', value: rewardLog.length, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', inner: 'bg-blue-500' },
                        { label: 'Unique Wallets', value: uniqueUids, icon: User, color: 'text-purple-600', bg: 'bg-purple-50', inner: 'bg-purple-500' },
                        { label: 'Target Sisa', value: Math.max(0, 10 - uniqueUids), icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', inner: 'bg-orange-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
                            </div>
                            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                                <div className={`w-8 h-8 ${stat.inner} rounded-xl flex items-center justify-center`}>
                                    <stat.icon className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {uniqueUids >= 10 && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
                        <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
                        <div>
                            <p className="font-black text-green-700 text-sm">🎉 Syarat 10 Unique Wallets TERPENUHI!</p>
                            <p className="text-xs text-green-600 mt-0.5">Sekarang Anda bisa submit aplikasi ke Pi Mainnet App Wallet.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Send Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            {['registered', 'manual'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab
                                            ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {tab === 'registered' ? '👤 User Terdaftar' : '🔑 Manual Pi UID'}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {activeTab === 'registered' ? (
                                <form onSubmit={handleSendRegistered} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                            Pilih User
                                        </label>
                                        <select
                                            value={data.user_id}
                                            onChange={e => setData('user_id', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                                        >
                                            <option value="">-- Pilih user --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.pi_uid?.substring(0, 12)}...)
                                                </option>
                                            ))}
                                        </select>
                                        {errors.user_id && <p className="text-red-500 text-xs mt-1">{errors.user_id}</p>}
                                        {users.length === 0 && (
                                            <p className="text-orange-500 text-xs mt-2 font-bold">
                                                ⚠️ Belum ada user yang login via Pi Browser. Suruh 10 akun test login dulu ke Bliyyan.
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                                Jumlah (π)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                min="0.001"
                                                max="10"
                                                value={data.amount}
                                                onChange={e => setData('amount', e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
                                                placeholder="0.001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                                Memo
                                            </label>
                                            <input
                                                type="text"
                                                value={data.memo}
                                                onChange={e => setData('memo', e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
                                                placeholder="Reward dari Bliyyan"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing || !data.user_id}
                                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                                    >
                                        {processing ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                                        ) : (
                                            <><Zap className="w-4 h-4" /> Kirim A2U Reward</>
                                        )}
                                    </button>

                                    {flash?.error && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
                                            <div className="flex items-start gap-3">
                                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-xs font-black text-red-700">{flash.error}</p>
                                            </div>
                                            {stuckPaymentId && (
                                                <div className="pt-2 border-t border-red-100 flex items-center justify-between">
                                                    <p className="text-[10px] text-red-600 font-bold uppercase italic">ID Nyangkut: {stuckPaymentId}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelPayment(stuckPaymentId)}
                                                        className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                                    >
                                                        {cancellingId === stuckPaymentId ? 'Wait...' : 'Batalkan Sekarang'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {flash?.success && (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-black text-green-700">{flash.success}</p>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <form onSubmit={handleSendByUid} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                            Pi UID (Target Wallet)
                                        </label>
                                        <input
                                            type="text"
                                            value={uidInput}
                                            onChange={e => setUidInput(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
                                            placeholder="Masukkan Pi UID akun test..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                                Jumlah (π)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                min="0.001"
                                                max="10"
                                                value={uidAmount}
                                                onChange={e => setUidAmount(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                                Memo
                                            </label>
                                            <input
                                                type="text"
                                                value={uidMemo}
                                                onChange={e => setUidMemo(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-300"
                                            />
                                        </div>
                                    </div>

                                    {uidResult && (
                                        <div className={`rounded-xl p-4 flex flex-col gap-3 text-sm ${uidResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                            <div className="flex items-start gap-3">
                                                {uidResult.success
                                                    ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                    : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                }
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-black text-xs ${uidResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                                        {uidResult.message}
                                                    </p>
                                                    {uidResult.payment_id && (
                                                        <p className="text-[10px] text-gray-500 font-mono mt-1 select-all">ID: {uidResult.payment_id}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {!uidResult.success && uidResult.payment_id && (
                                                <div className="pt-2 border-t border-red-100 flex items-center justify-between">
                                                    <p className="text-[10px] text-red-600 font-bold uppercase italic">Pembayaran Nyangkut?</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelPayment(uidResult.payment_id)}
                                                        className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                                    >
                                                        {cancellingId === uidResult.payment_id ? 'Wait...' : 'Batalkan Sekarang'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={uidLoading || !uidInput}
                                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                                    >
                                        {uidLoading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                                        ) : (
                                            <><Zap className="w-4 h-4" /> Kirim A2U Reward</>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Reward Log */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Log Transaksi A2U</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Riwayat reward terkirim</p>
                            </div>
                            <div className="px-3 py-1 bg-purple-100 rounded-xl">
                                <span className="text-xs font-black text-purple-700">{rewardLog.length} transaksi</span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                            {rewardLog.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Gift className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Belum ada reward terkirim</p>
                                </div>
                            ) : (
                                rewardLog.map((reward) => (
                                    <div key={reward.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                                                    <User className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800">
                                                        {reward.user?.name || 'External UID'}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]">
                                                        {reward.pi_uid}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-purple-700">π {reward.amount}</p>
                                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                    <span className="text-[9px] font-black text-green-600 uppercase">Completed</span>
                                                </div>
                                            </div>
                                        </div>
                                        {reward.txid && (
                                            <p className="text-[9px] font-mono text-gray-300 truncate mt-1.5 ml-12">
                                                txid: {reward.txid}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Diagnostic Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-500" />
                                Diagnostic Tools
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Atasi transaksi yang nyangkut (stuck)</p>
                        </div>
                        <button
                            onClick={fetchIncomplete}
                            disabled={diagLoading}
                            className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
                        >
                            {diagLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                            Cek Incomplete Payments
                        </button>
                    </div>

                    {incompletePayments.length > 0 ? (
                        <div className="space-y-3">
                            {incompletePayments.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 truncate">ID: {p.identifier}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount: π{p.amount}</span>
                                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic">Status: {p.status.developer_approved ? 'Approved' : 'Pending'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCancelPayment(p.identifier)}
                                        disabled={cancellingId === p.identifier}
                                        className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors shadow-md"
                                    >
                                        {cancellingId === p.identifier ? 'Batal...' : 'Batalkan'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : !diagLoading && (
                        <p className="text-center py-8 text-xs font-bold text-gray-400 uppercase tracking-widest border-2 border-dashed border-gray-50 rounded-2xl">
                            Belum ada transaksi nyangkut yang terdeteksi
                        </p>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white">
                    <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Cara Menyelesaikan 10 Unique Wallet
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/70 font-medium">
                        <div className="space-y-2">
                            <p className="flex items-start gap-2">
                                <span className="text-yellow-400 font-black shrink-0">1.</span>
                                Buka Bliyyan di <span className="text-white font-bold">Pi Browser (Sandbox/Testnet mode)</span> menggunakan setiap akun test.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-yellow-400 font-black shrink-0">2.</span>
                                Login ke Bliyyan — otomatis Pi UID akun tersebut tersimpan di tab "User Terdaftar".
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-yellow-400 font-black shrink-0">3.</span>
                                Atau gunakan tab <span className="text-white font-bold">"Manual Pi UID"</span> jika sudah tahu UID-nya.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="flex items-start gap-2">
                                <span className="text-yellow-400 font-black shrink-0">4.</span>
                                Kirim reward kecil (min <span className="text-white font-bold">π 0.001</span>) ke setiap akun.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-yellow-400 font-black shrink-0">5.</span>
                                Setelah <span className="text-white font-bold">10 unique wallet</span> menerima reward, counter di atas akan mencapai 10/10.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-yellow-400 font-black shrink-0">6.</span>
                                Submit aplikasi di <span className="text-white font-bold">Pi Developer Portal</span> untuk Mainnet App Wallet approval.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
