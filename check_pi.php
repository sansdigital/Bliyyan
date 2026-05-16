<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = config('services.pi.api_key');
$apiUrl = config('services.pi.api_url');
$walletAddress = "GBJMXW5TOWM7CFUYBXWEJE5NJ33X7I2RFVPFC7J67MY4AAF5A3OQ5TC6";

echo "Checking Incomplete Payments...\n";
$resIncomplete = Illuminate\Support\Facades\Http::withoutVerifying()
    ->withHeader('Authorization', 'Key ' . $apiKey)
    ->get("$apiUrl/payments/incomplete_server_payments");

echo "Incomplete Response: " . $resIncomplete->body() . "\n\n";

echo "Checking Horizon Balance for $walletAddress...\n";
$horizonUrl = "https://api.mainnet.minepi.com/accounts/$walletAddress";
$resHorizon = Illuminate\Support\Facades\Http::withoutVerifying()->get($horizonUrl);

if ($resHorizon->successful()) {
    $data = $resHorizon->json();
    $balances = $data['balances'] ?? [];
    echo "Balances:\n";
    foreach ($balances as $b) {
        echo "- " . $b['asset_type'] . ": " . $b['balance'] . "\n";
    }
} else {
    echo "Horizon Error: " . $resHorizon->body() . "\n";
}
