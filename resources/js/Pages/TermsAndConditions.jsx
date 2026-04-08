import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function TermsAndConditions() {
    return (
        <GuestLayout>
            <Head title="Terms and Conditions" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Terms and Conditions</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sm:p-8 text-gray-600 dark:text-gray-300 space-y-6 prose dark:prose-invert max-w-none">
                    <p>
                        By using the Bliyyan Marketplace platform, you agree to be bound by the following Terms and Conditions. Please read them carefully before conducting any transactions using the Pi Network.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">1. Usage of Services</h2>
                    <p>
                        You agree to use the Pi Network site and Bliyyan's services strictly for the lawful purchase of goods and services as permitted by applicable laws and Pi Core Team guidelines.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">2. Payments Using Pi Cryptocurrency</h2>
                    <p>
                        All prices for products and services on Bliyyan are strictly pegged and billed using the Pi cryptocurrency.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>All forms of payment on Bliyyan are considered <strong>final and non-refundable</strong> once executed on the Pi Blockchain, except at management's sole discretion.</li>
                        <li>We do not facilitate the exchange, sale, or purchase of Pi coins using conventional/fiat currency (e.g., Rupiah) in strict compliance with the Pi Network's "Enclosed Mainnet" guidelines.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">3. Order Fulfillment and Shipping</h2>
                    <p>
                        Physical physical orders will be processed immediately upon payment confirmation ("Complete State") by the Server-to-Server Pi Network API. Shipping times are subject to third-party courier policies. Bliyyan holds no liability for financial losses associated with delayed shipments or transit damage.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">4. User Obligations</h2>
                    <p>
                        You are solely responsible for maintaining the confidentiality of your Pi Wallet Passphrase. Bliyyan is hereby absolved from any claims arising from account compromises due to customer negligence.
                    </p>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">5. Governing Law</h2>
                    <p>
                        These Terms and Conditions are governed entirely by and construed in accordance with the laws of the Republic of Indonesia and the overarching compliance guidelines of the global Pi Network blockchain.
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
