import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function PrivacyPolicy() {
    return (
        <GuestLayout>
            <Head title="Privacy Policy" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sm:p-8 text-gray-600 dark:text-gray-300 space-y-6 prose dark:prose-invert max-w-none">
                    <p>
                        Welcome to the Bliyyan Marketplace within the Pi Network ecosystem. This Privacy Policy explains how we collect, use, and protect your information when you use our services.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">1. Information We Collect</h2>
                    <p>
                        When you use the Bliyyan platform via the Pi Network, we may collect the following information:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Pi User Identity:</strong> Your Pi Username and User UID, explicitly provided through the Pi SDK authentication process.</li>
                        <li><strong>Transactional Data:</strong> Your shopping cart data, order details, shipping address, and payment history on the Pi Network.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">2. How We Use Your Information</h2>
                    <p>
                        The information we collect is strictly used to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Process the physical and digital orders you purchase from our services.</li>
                        <li>Automatically verify all your Pi Network payments using the official Pi Network API.</li>
                        <li>Facilitate product shipping communications and courier tracking.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">3. Pi Cryptocurrency & Third-Party Security</h2>
                    <p>
                        This platform operates on and integrates Pi cryptocurrency payments. Payments are strictly handled by the Pi Network Core Team via your Pi Browser. Bliyyan <strong>NEVER</strong> stores your wallet's <i>passphrase</i>, and we do not have direct access to your Pi balance outside of the specific user-approved billing confirmations.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">4. Changes to This Privacy Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. Any changes will be published directly on this page. We highly recommend users periodically review this page for the latest updates.
                    </p>
                    
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">5. Contact Us</h2>
                    <p>
                        If you have any questions regarding this Privacy Policy, please contact our Bliyyan support team.
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-shopee hover:underline font-medium">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
