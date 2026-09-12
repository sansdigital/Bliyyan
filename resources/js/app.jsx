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
    }
    
    // Always refresh CSRF token from the meta tag on each request.
    // This prevents stale token issues after session regeneration.
    const csrfMeta = document.head.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        event.detail.visit.headers = event.detail.visit.headers || {};
        event.detail.visit.headers['X-CSRF-TOKEN'] = csrfMeta.content;
    }
});

// After each successful Inertia navigation, update the CSRF meta tag
// with the fresh token from the server so subsequent requests don't get 419.
router.on('success', (event) => {
    const newToken = event.detail.page?.props?.csrf_token;
    if (newToken) {
        const meta = document.head.querySelector('meta[name="csrf-token"]');
        if (meta) meta.setAttribute('content', newToken);
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
