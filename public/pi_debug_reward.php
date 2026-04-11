<?php
/**
 * PI NETWORK A2U DEBUGGER
 * Script ini dirancang untuk mengirim Reward (App-to-User) secara langsung ke UID tertentu.
 * Digunakan untuk memenuhi syarat 10 transaksi unik di Pi Developer Portal.
 */

// 1. Matikan error reporting yang mengganggu, tapi tampilkan error PHP jika ada
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 2. Load .env secara manual (karena ini script standalone)
function getEnvValue($key, $default = null) {
    $path = __DIR__ . '/../.env';
    if (!file_exists($path)) return $default;
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        if (trim($name) == $key) {
            return trim($value, '"\' ');
        }
    }
    return $default;
}

$apiKey = getEnvValue('PI_API_KEY');
$apiUrl = "https://api.minepi.com/v2";

$message = "";
$status = "";

// 3. Logika Pengiriman jika Form di-submit
if (isset($_POST['submit_reward'])) {
    $uid = trim($_POST['pi_uid']);
    $amount = (float)$_POST['amount'];
    $memo = trim($_POST['memo']);
    
    // Bersihkan UID dari @pi.network jika ada
    $uid = str_replace('@pi.network', '', $uid);

    if (empty($uid) || empty($apiKey)) {
        $message = "Error: UID atau API KEY (di .env) tidak boleh kosong!";
        $status = "error";
    } else {
        try {
            // STEP 1: CREATE PAYMENT
            $ch = curl_init("$apiUrl/payments");
            $payload = json_encode([
                'payment' => [
                    'amount' => $amount,
                    'memo' => $memo,
                    'metadata' => ['type' => 'debugger_reward'],
                    'uid' => $uid
                ],
                'payment_type' => 'A2U'
            ]);
            
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Bypass SSL for compatibility
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Key $apiKey",
                "Content-Type: application/json"
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $resData = json_decode($response, true);
            
            if ($httpCode == 201 || $httpCode == 200) {
                $paymentId = $resData['identifier'];
                
                // STEP 2: APPROVE PAYMENT
                $ch = curl_init("$apiUrl/payments/$paymentId/approve");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Key $apiKey"]);
                $approveResponse = curl_exec($ch);
                $appData = json_decode($approveResponse, true);
                curl_close($ch);
                
                $txid = $appData['transaction']['txid'] ?? null;
                
                // STEP 3: COMPLETE PAYMENT
                if ($txid) {
                    $ch = curl_init("$apiUrl/payments/$paymentId/complete");
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['txid' => $txid]));
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        "Authorization: Key $apiKey",
                        "Content-Type: application/json"
                    ]);
                    curl_exec($ch);
                    curl_close($ch);
                }
                
                $message = "SUKSES! Reward π$amount berhasil dikirim ke UID: $uid. ID: $paymentId";
                $status = "success";
            } else {
                $message = "GAGAL: " . ($resData['error'] ?? $response);
                $status = "error";
            }
        } catch (Exception $e) {
            $message = "Exception: " . $e->getMessage();
            $status = "error";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pi A2U Debugger - Bliyyan</title>
    <style>
        body { font-family: sans-serif; background: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; border: 1px solid #eee; }
        h2 { color: #5c2d91; margin-top: 0; }
        .input-group { margin-bottom: 1rem; }
        label { display: block; font-size: 0.8rem; font-weight: bold; margin-bottom: 0.3rem; color: #666; }
        input { width: 100%; padding: 0.7rem; border: 1px solid #ddd; border-radius: 0.5rem; box-sizing: border-box; }
        button { width: 100%; padding: 0.8rem; background: #5c2d91; color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; }
        button:hover { background: #4a2475; }
        .alert { padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; word-break: break-all; }
        .footer { text-align: center; margin-top: 2rem; font-size: 0.7rem; color: #999; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Pi A2U Debugger</h2>
        <p style="font-size: 0.8rem; color: #888;">Gunakan ini untuk menyelesaikan syarat 10 wallet di Developer Portal.</p>
        
        <?php if ($message): ?>
            <div class="alert <?= $status ?>"><?= $message ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="input-group">
                <label>Pi UID (Ambil dari Sandbox Users)</label>
                <input type="text" name="pi_uid" placeholder="Contoh: a1b2c3d4..." required>
            </div>
            <div class="input-group">
                <label>Jumlah (π)</label>
                <input type="number" name="amount" step="0.001" value="0.001" required>
            </div>
            <div class="input-group">
                <label>Memo</label>
                <input type="text" name="memo" value="Test A2U Reward Bliyyan" required>
            </div>
            <button type="submit" name="submit_reward">Kirim Reward Sekarang</button>
        </form>
        
        <div class="footer">
            Bliyyan &copy; 2026 | PI_API_KEY: <?= $apiKey ? 'Set ✅' : 'KOSONG ❌' ?>
        </div>
    </div>
</body>
</html>
