import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function Login({ status, canResetPassword }) {
    const { t, i18n } = useTranslation();
    const [piAuthError, setPiAuthError] = useState(null);
    const [isAuthenticatingPi, setIsAuthenticatingPi] = useState(false);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handlePiLogin = async () => {
        setPiAuthError(null);
        setIsAuthenticatingPi(true);

        try {
            if (typeof window.Pi === 'undefined') {
                throw new Error("Pi Network SDK not detected. Please open this site via 'Pi Browser' on your phone.");
            }

            const scopes = ['username', 'payments', 'wallet_address'];
            const onIncompletePaymentFound = (payment) => {
                console.log("Incomplete payment found:", payment);
                // Optional: You can handle incomplete payments here if needed
                axios.post(route('pi.approve'), { paymentId: payment.identifier });
            };

            console.log("Requesting Pi Authentication with scopes:", scopes);
            const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
            console.log("Pi Auth Success:", auth.user.uid);
            
            // Send auth data to our backend
            axios.post(route('pi.auth'), {
                uid: auth.user.uid,
                username: auth.user.username,
                accessToken: auth.accessToken
            }, { withCredentials: true }).then(response => {
                // Show alert for visual confirmation on mobile
                alert("Login Successful! Redirecting to Bliyyan Dashboard...");
                
                // Use a direct hard reload to ensure session is picked up
                window.location.assign(route('dashboard'));
            }).catch(err => {
                console.error("Backend auth error:", err);
                const backendError = err.response?.data?.error;
                const msg = backendError || "Failed to connect to Bliyyan server. Please check your internet connection and try again.";
                setPiAuthError(msg);
                setIsAuthenticatingPi(false);
            });

        } catch (error) {
            console.error(error);
            setPiAuthError(error.message || "Failed to connect to Pi Network.");
            setIsAuthenticatingPi(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col justify-center items-center overflow-hidden bg-gray-900">
            <Head title="Login Pi Network" />

            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse duration-10000"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-orange-500/20 blur-[100px] mix-blend-screen animate-pulse duration-7000"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-yellow-500/10 blur-[100px] mix-blend-screen"></div>
            </div>

            {/* Login Container */}
            <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
                
                {/* Branding */}
                <div className="text-center mb-10 transform transition-transform hover:scale-105 duration-300">
                    <img 
                        src="/images/logonet.png" 
                        alt="Bliyyan Marketplace" 
                        className="h-16 w-auto mx-auto drop-shadow-2xl brightness-110" 
                    />
                </div>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-400 bg-green-400/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-green-400/20 w-full text-center">
                        {status}
                    </div>
                )}

                {/* Glassmorphism Card */}
                <div className="w-full bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f3ba2f] to-transparent opacity-50"></div>
                    
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">{t('customer_login')}</h2>
                        <p className="text-sm text-gray-400">{t('buy_anything')}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#f3ba2f]/10 p-5 rounded-2xl border border-[#f3ba2f]/20 text-center backdrop-blur-sm shadow-inner">
                            <p className="text-[#f3ba2f] text-sm font-semibold tracking-wide">
                                {t('access_requirement')}
                            </p>
                        </div>

                        <button
                            onClick={handlePiLogin}
                            disabled={isAuthenticatingPi}
                            className={`w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#f3ba2f] to-[#e6a81c] text-gray-900 font-bold text-lg py-4 shadow-[0_0_20px_rgba(243,186,47,0.3)] hover:shadow-[0_0_25px_rgba(243,186,47,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 ${
                                isAuthenticatingPi ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 2v4.22h-.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1H11v8.83c0 .61.49 1.1 1.1 1.1s1.1-.49 1.1-1.1V8.42h2.23c2.4 0 4.35 1.95 4.35 4.35s-1.95 4.35-4.35 4.35h-.8v2.2h.8c3.61 0 6.55-2.94 6.55-6.55s-2.94-6.55-6.55-6.55H13.2V2H11zm-5.45 6.42A1.1 1.1 0 0 0 4.45 9.5a1.1 1.1 0 0 0 1.1 1.11A1.1 1.1 0 0 0 6.64 9.5a1.1 1.1 0 0 0-1.09-1.08z"/>
                                </svg>
                                {isAuthenticatingPi ? t('processing') : t('login_with_pi')}
                            </span>
                            {!isAuthenticatingPi && (
                                <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                            )}
                        </button>

                        {piAuthError && (
                            <div className="p-4 text-sm text-red-200 bg-red-900/40 rounded-xl border border-red-500/30 animate-shake backdrop-blur-md">
                                <div className="flex items-center space-x-2 font-bold mb-1.5 text-red-400">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>{t('warning')}</span>
                                </div>
                                <p className="leading-relaxed">{piAuthError}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center space-y-2 px-6">
                    <p className="text-[10px] text-gray-500 font-medium tracking-wide text-center">
                        Bliyyan Marketplace &bull; Pi Ecosystem
                        <br />
                        <span className="opacity-70 mt-1 inline-block">© {new Date().getFullYear()} Bliyyan. Powered by Sans Digital</span>
                    </p>
                    <p className="text-[9px] text-gray-600 opacity-60 text-center leading-tight">
                        Pi, Pi Network and the Pi logo are trademarks of the Pi Community Company.
                    </p>
                </div>
            </div>
        </div>
    );
}
