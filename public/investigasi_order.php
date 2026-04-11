<?php
// Script Investigasi Order #0045
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');

$orderId = 45; // Order #0045
echo "Investigasi Order ID: {$orderId}\n";
echo "============================\n\n";

try {
    $order = Order::with('payment')->find($orderId);
    
    if (!$order) {
        die("Order tidak ditemukan!\n");
    }

    echo "Status Saat Ini di DB: " . $order->status . "\n";
    echo "Payment Status di DB: " . ($order->payment ? $order->payment->status : 'Tidak Ada Payment') . "\n";
    echo "Dibuat Pada: " . $order->created_at . "\n";
    echo "Diperbarui Pada: " . $order->updated_at . "\n\n";

    echo "Mencoba mengupdate status ke 'refunded' secara paksa...\n";
    $updated = $order->update(['status' => 'refunded']);
    
    if ($updated) {
        echo "BERHASIL Update! Status baru: " . $order->status . "\n";
        if ($order->payment) {
            $order->payment->update(['status' => 'refunded']);
            echo "BERHASIL Update Payment Status!\n";
        }
    } else {
        echo "GAGAL Update ke Database!\n";
    }

    // Cek lagi setelah update
    $orderRefresh = Order::find($orderId);
    echo "Status Setelah Refresh: " . $orderRefresh->status . "\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
