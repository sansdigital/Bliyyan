import { useEffect } from 'react';
import { router } from '@inertiajs/react';

// Registrasi manual tidak tersedia. Semua pengguna harus login via Pi Network.
export default function Register() {
    useEffect(() => {
        router.replace(route('login'));
    }, []);

    return null;
}
