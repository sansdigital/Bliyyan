import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-zinc-100 pt-6 sm:justify-center sm:pt-0 font-sans">
            <div className="w-full max-w-[480px] bg-shopee-bg min-h-screen flex flex-col shadow-2xl relative overflow-hidden">
                <div className="flex flex-col items-center justify-center pt-20 pb-10 px-6">
                    <Link href="/" className="transition-transform active:scale-95 flex flex-col items-center">
                        <div className="w-20 h-20 bg-shopee-dark rounded-3xl flex items-center justify-center shadow-lg mb-4">
                            <img src="/images/logonet.png" alt="Logo" className="h-10 w-auto" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-shopee-dark">Bliyyan</h1>
                    </Link>
                </div>


                <div className="flex-1 px-6">
                    <div className="w-full overflow-hidden bg-white px-8 py-10 shadow-xl rounded-3xl border border-gray-100 animate-slide-in">
                        {children}
                    </div>
                </div>

                <footer className="py-10 text-center text-[10px] text-gray-400">
                    <p>&copy; 2026 Bliyyan.com Indonesia</p>
                </footer>
            </div>
        </div>
    );
}

