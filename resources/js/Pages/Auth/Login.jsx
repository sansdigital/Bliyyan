import { useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';


export default function Login({ status, canResetPassword }) {
    const [piAuthError, setPiAuthError] = useState(null);
    const [isAuthenticatingPi, setIsAuthenticatingPi] = useState(false);

    const handlePiLogin = async () => {
        setPiAuthError(null);
        setIsAuthenticatingPi(true);

        try {
            if (typeof window.Pi === 'undefined') {
                throw new Error("SDK Pi Network tidak terdeteksi. Silakan buka website ini melalui 'Pi Browser' di HP Mas.");
            }

            const scopes = ['username', 'payments'];
            const onIncompletePaymentFound = (payment) => {
                console.log("Incomplete payment found:", payment);
            };

            const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
            
            // Send auth data to our backend
            axios.post(route('pi.auth'), {
                uid: auth.user.uid,
                username: auth.user.username,
                accessToken: auth.accessToken
            }, { withCredentials: true }).then(response => {
                // Show alert for visual confirmation on mobile
                alert("Login Berhasil! Mengalihkan ke Dashboard Bliyyan...");
                
                // Use a direct hard reload to ensure session is picked up
                window.location.assign(route('dashboard'));
            }).catch(err => {
                console.error("Backend auth error:", err);
                const backendError = err.response?.data?.error;
                const msg = backendError || "Gagal terhubung ke server Bliyyan. Silakan cek koneksi internet Mas atau coba lagi nanti.";
                setPiAuthError(msg);
                setIsAuthenticatingPi(false);
            });

        } catch (error) {
            console.error(error);
            setPiAuthError(error.message || "Gagal terhubung ke jaringan Pi Network.");
            setIsAuthenticatingPi(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Login Pi Network" />

            <div className="flex flex-col items-center justify-center p-4 py-8">
                {/* Brand / Logo Area */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-shopee tracking-tighter">Bliyyan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Beli Apapun Dengan Pi Network</p>
                </div>

                <div className="w-full max-w-sm space-y-6">
                    <div className="bg-shopee/5 p-6 rounded-3xl border border-shopee/10 mb-6 text-center">
                        <p className="text-shopee-dark text-sm font-bold">
                            Semua pembeli wajib masuk menggunakan Akun Pi Network.
                        </p>
                    </div>

                    <button
                        onClick={handlePiLogin}
                        disabled={isAuthenticatingPi}
                        className={`w-full flex items-center justify-center space-x-3 py-5 px-6 border border-transparent rounded-2xl shadow-xl text-shopee-dark bg-shopee hover:bg-shopee-hover active:scale-95 transition-all font-black text-xl ${
                            isAuthenticatingPi ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 2v4.22h-.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1H11v8.83c0 .61.49 1.1 1.1 1.1s1.1-.49 1.1-1.1V8.42h2.23c2.4 0 4.35 1.95 4.35 4.35s-1.95 4.35-4.35 4.35h-.8v2.2h.8c3.61 0 6.55-2.94 6.55-6.55s-2.94-6.55-6.55-6.55H13.2V2H11zm-5.45 6.42A1.1 1.1 0 0 0 4.45 9.5a1.1 1.1 0 0 0 1.1 1.11A1.1 1.1 0 0 0 6.64 9.5a1.1 1.1 0 0 0-1.09-1.08z"/>
                        </svg>
                        {isAuthenticatingPi ? <span>Memproses...</span> : <span>Login dengan Pi</span>}
                    </button>

                    {piAuthError && (
                        <div className="mt-6 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-800 animate-shake">
                            <div className="flex items-center space-x-2 font-bold mb-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Perhatian</span>
                            </div>
                            {piAuthError}
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        Bliyyan Marketplace &bull; Pi Ecosystem
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
