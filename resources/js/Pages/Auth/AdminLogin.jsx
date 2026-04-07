import { useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function AdminLogin({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.login.post'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen relative flex flex-col justify-center items-center overflow-hidden bg-gray-900">
            <Head title="Admin Login" />

            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse duration-10000"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-orange-500/20 blur-[100px] mix-blend-screen animate-pulse duration-7000"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-yellow-500/10 blur-[100px] mix-blend-screen"></div>
            </div>

            {/* Login Container */}
            <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
                
                {/* Branding */}
                <div className="text-center mb-8 transform transition-transform hover:scale-105 duration-300">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#f3ba2f] to-[#f9d423] tracking-tight drop-shadow-sm">
                        Bliyyan
                    </h1>
                    <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <p className="text-white/80 text-xs font-bold uppercase tracking-[0.2em]">Secure Portal</p>
                    </div>
                </div>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-400 bg-green-400/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-green-400/20 w-full text-center">
                        {status}
                    </div>
                )}

                {/* Glassmorphism Card */}
                <div className="w-full bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f3ba2f] to-transparent opacity-50"></div>
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
                        <p className="text-sm text-gray-400">Enter your credentials to access the admin dashboard.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="group">
                            <InputLabel htmlFor="email" value="Email" className="text-gray-300 mb-1.5 ml-1 text-xs uppercase tracking-wider font-semibold" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full rounded-xl bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-[#f3ba2f] focus:ring-1 focus:ring-[#f3ba2f] transition-all duration-300 shadow-inner"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="admin@bliyyan.net"
                            />
                            <InputError message={errors.email} className="mt-2 text-red-400" />
                        </div>

                        <div className="group">
                            <div className="flex justify-between items-center mb-1.5 ml-1">
                                <InputLabel htmlFor="password" value="Password" className="text-gray-300 text-xs uppercase tracking-wider font-semibold" />
                                {canResetPassword && (
                                    <Link href={route('password.request')} className="text-[10px] text-gray-400 hover:text-[#f3ba2f] transition-colors focus:outline-none">
                                        Lupa Password?
                                    </Link>
                                )}
                            </div>
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="block w-full rounded-xl bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-[#f3ba2f] focus:ring-1 focus:ring-[#f3ba2f] transition-all duration-300 shadow-inner"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                            <InputError message={errors.password} className="mt-2 text-red-400" />
                        </div>

                        <div className="pt-2 block ml-1">
                            <label className="flex items-center cursor-pointer group/cb">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="bg-white/5 border-white/20 text-[#f3ba2f] focus:ring-[#f3ba2f] focus:ring-offset-gray-900 rounded"
                                />
                                <span className="ms-3 text-sm text-gray-400 group-hover/cb:text-gray-300 transition-colors">
                                    Ingat sesi saya
                                </span>
                            </label>
                        </div>

                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#f3ba2f] to-[#e6a81c] text-gray-900 font-bold text-lg py-3.5 shadow-[0_0_20px_rgba(243,186,47,0.3)] hover:shadow-[0_0_25px_rgba(243,186,47,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {processing ? 'Memproses...' : 'Login ke Dashboard'}
                                    {!processing && (
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </span>
                                <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Navigation & Copyright */}
                <div className="mt-10 flex flex-col items-center space-y-6">
                    <Link
                        href={route('login')}
                        className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Halaman Customer
                    </Link>

                    <p className="text-xs text-gray-500 font-medium tracking-wide">
                        © 2026 Bliyyan. Powered by Sans Digital
                    </p>
                </div>
            </div>
        </div>
    );
}
