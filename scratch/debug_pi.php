<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$wallet_address = config('services.pi.wallet_address');
$horizon_url    = config('services.pi.horizon_url');

echo "Testing Wallet: [$wallet_address]\n";
echo "Length: " . strlen($wallet_address) . "\n";
echo "Horizon URL: $horizon_url\n";

try {
    $response = Http::withoutVerifying()
        ->timeout(10)
        ->get("{$horizon_url}/accounts/{$wallet_address}");

    if ($response->successful()) {
        echo "Response Successful!\n";
        print_r($response->json('balances'));
    } else {
        echo "Response Failed! Status: " . $response->status() . "\n";
        echo $response->body() . "\n";
    }
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
