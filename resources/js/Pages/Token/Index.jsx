import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function TokenIndex({ auth, transactions, balance }) {
    const { t } = useTranslation();

    const getStatusStyle = (type) => {
        switch (type) {
            case 'purchase_reward':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'payment':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'referral':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatType = (type) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Bliyyan Token History" />

            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-[-2%] top-[-20%] opacity-10 text-[100px] font-black italic select-none">BTK</div>
                    <div className="relative z-10">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/80 mb-2">Total Balance</h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tighter">{Number(balance).toLocaleString('id-ID')}</span>
                            <span className="text-xl font-bold opacity-80">BTK</span>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Transaction History
                        </h3>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {transactions.data.length > 0 ? (
                            transactions.data.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tx.amount > 0 ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {tx.amount > 0 ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                )}
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">{tx.description}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusStyle(tx.type)}`}>
                                                    {formatType(tx.type)}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-black tracking-tight ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No transactions found</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {transactions.links.length > 3 && (
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-center gap-1">
                            {transactions.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        link.active 
                                            ? 'bg-amber-500 text-white shadow-md' 
                                            : 'bg-white text-gray-500 hover:bg-amber-50'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
