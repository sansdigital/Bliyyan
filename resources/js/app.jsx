import '../css/app.css';
import './bootstrap';
import './i18n';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

router.on('before', (event) => {
    const piSession = localStorage.getItem('pi_session');
    if (piSession) {
        event.detail.visit.headers = event.detail.visit.headers || {};
        event.detail.visit.headers['X-Pi-Session'] = piSession;
        event.detail.visit.headers['Authorization'] = `Bearer ${piSession}`;
        
        if (event.detail.visit.method !== 'get') {
            event.detail.visit.data = event.detail.visit.data || {};
            if (event.detail.visit.data instanceof FormData) {
                event.detail.visit.data.append('pi_session', piSession);
            } else {
                event.detail.visit.data['pi_session'] = piSession;
            }
        }
    }
    
    const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
    if (csrfToken) {
        event.detail.visit.headers = event.detail.visit.headers || {};
        event.detail.visit.headers['X-CSRF-TOKEN'] = csrfToken.content;
    }
});


const appName = import.meta.env.VITE_APP_NAME || 'Bliyyan';

import { ToastProvider } from '@/Components/Toast';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ToastProvider>
                <App {...props} />
            </ToastProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
