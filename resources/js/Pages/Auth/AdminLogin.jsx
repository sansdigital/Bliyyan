import { useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
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
        <GuestLayout>
            <Head title="Admin Login" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="flex flex-col items-center justify-center p-4 py-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-[#f3ba2f] tracking-tighter">Bliyyan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium uppercase tracking-widest">Administrator Access</p>
                </div>

                <div className="w-full max-w-sm">
                    <form onSubmit={submit} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-gray-700">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Login Admin</h2>
                            <p className="text-xs text-gray-400">Silakan masukkan akun pengelola Mas.</p>
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Email" className="ml-2 mb-1" />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-shopee"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-6">
                            <InputLabel htmlFor="password" value="Password" className="ml-2 mb-1" />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-shopee"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mt-6 block ml-2">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                />
                                <span className="ms-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Ingat Saya
                                </span>
                            </label>
                        </div>

                        <div className="mt-10 flex flex-col space-y-6">
                            <PrimaryButton className="w-full justify-center rounded-2xl py-4 bg-shopee hover:bg-shopee-hover text-shopee-dark font-black text-lg shadow-lg" disabled={processing}>
                                Masuk Sekarang
                            </PrimaryButton>
                            
                            {canResetPassword && (
                                <div className="text-center">
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs text-gray-400 hover:text-shopee underline transition-colors"
                                    >
                                        Lupa password Mas?
                                    </Link>
                                </div>
                            )}

                            <div className="pt-4 text-center">
                                <Link
                                    href={route('login')}
                                    className="text-xs font-bold text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    &larr; Kembali ke Login Customer
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
