import { useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import axios from 'axios';

export default function Login({ status, canResetPassword }) {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [piAuthError, setPiAuthError] = useState(null);
    const [isAuthenticatingPi, setIsAuthenticatingPi] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handlePiLogin = async () => {
        setPiAuthError(null);
        setIsAuthenticatingPi(true);

        try {
            if (typeof window.Pi === 'undefined') {
                throw new Error("Pi Network SDK is not loaded.");
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
            }).then(response => {
                // Redirect on success
                if (response.data.redirect) {
                    window.location.href = response.data.redirect;
                } else {
                    router.visit(route('dashboard'));
                }
            }).catch(err => {
                console.error("Backend auth error:", err);
                setPiAuthError(err.response?.data?.error || "Gagal verifikasi dengan server.");
                setIsAuthenticatingPi(false);
            });

        } catch (error) {
            console.error(error);
            setPiAuthError(error.message || "Gagal terhubung ke Pi Network.");
            setIsAuthenticatingPi(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="flex flex-col items-center justify-center p-4 py-8">
                {/* Brand / Logo Area */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[#f3ba2f] tracking-tight">Bliyyan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Pusat Belanja Ekosistem Pi</p>
                </div>

                {!showAdminLogin ? (
                    <div className="w-full max-w-sm space-y-6">
                        <button
                            onClick={handlePiLogin}
                            disabled={isAuthenticatingPi}
                            className={`w-full flex items-center justify-center space-x-3 py-4 px-6 border border-transparent rounded-2xl shadow-lg text-shopee-dark bg-shopee hover:bg-shopee-hover active:scale-95 transition-all font-black text-lg ${
                                isAuthenticatingPi ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >

                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 2v4.22h-.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1H11v8.83c0 .61.49 1.1 1.1 1.1s1.1-.49 1.1-1.1V8.42h2.23c2.4 0 4.35 1.95 4.35 4.35s-1.95 4.35-4.35 4.35h-.8v2.2h.8c3.61 0 6.55-2.94 6.55-6.55s-2.94-6.55-6.55-6.55H13.2V2H11zm-5.45 6.42A1.1 1.1 0 0 0 4.45 9.5a1.1 1.1 0 0 0 1.1 1.11A1.1 1.1 0 0 0 6.64 9.5a1.1 1.1 0 0 0-1.09-1.08z"/>
                            </svg>
                            {isAuthenticatingPi ? <span>Memproses...</span> : <span>Login dengan Pi</span>}
                        </button>

                        {piAuthError && (
                            <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800">
                                {piAuthError}
                            </div>
                        )}

                        <div className="pt-8 text-center">
                            <button 
                                onClick={() => setShowAdminLogin(true)}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-500 hover:underline transition-colors"
                            >
                                Login sebagai Admin / Penjual
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-sm">
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-semibold dark:text-white">Admin Login</h2>
                            <button 
                                onClick={() => setShowAdminLogin(false)}
                                className="text-sm text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                &larr; Kembali ke Pi Login
                            </button>
                        </div>
                        <form onSubmit={submit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div>
                                <InputLabel htmlFor="email" value="Email" />

                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full rounded-xl"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />

                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="password" value="Password" />

                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full rounded-xl"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />

                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="mt-4 block">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData('remember', e.target.checked)
                                        }
                                    />
                                    <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                        Remember me
                                    </span>
                                </label>
                            </div>

                            <div className="mt-6 flex flex-col space-y-4">
                                <PrimaryButton className="w-full justify-center rounded-xl py-3" disabled={processing}>
                                    Log in
                                </PrimaryButton>
                                
                                {canResetPassword && (
                                    <div className="text-center">
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline"
                                        >
                                            Forgot your password?
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
