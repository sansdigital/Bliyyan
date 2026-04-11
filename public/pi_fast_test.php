<?php
/**
 * PI FAST-TEST TOOL (U2A -> A2U Loop)
 * Script ini untuk menyelesaikan syarat 10 transaksi unik.
 * Cara kerja: User bayar π0.01, App kirim balik π0.01 secara otomatis.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Helper untuk load .env
function getEnvValue($key, $default = null) {
    $path = __DIR__ . '/../.env';
    if (!file_exists($path)) return $default;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) == 2 && trim($parts[0]) == $key) return trim($parts[1], '"\' ');
    }
    return $default;
}

$apiKey = getEnvValue('PI_API_KEY');
$apiUrl = "https://api.minepi.com/v2";

// HANDLE BACKEND REQUESTS (AJAX)
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    $action = $_GET['action'];

    if ($action == 'approve_u2a') {
        // Berikan persetujuan (Approve) ke Pi Network agar user bisa bayar
        $paymentId = $_POST['paymentId'];
        $ch = curl_init("$apiUrl/payments/$paymentId/approve");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Key $apiKey"]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        echo $res;
        exit;
    }

    if ($action == 'complete_u2a') {
        // Laporkan transaksi U2A (User bayar ke App) telah selesai
        $paymentId = $_POST['paymentId'];
        $txid = $_POST['txid'];
        
        $ch = curl_init("$apiUrl/payments/$paymentId/complete");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['txid' => $txid]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Key $apiKey", "Content-Type: application/json"]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        echo $res;
        exit;
    }

    if ($action == 'trigger_a2u') {
        // Kirim balik koin (A2U Reward)
        $uid = $_POST['uid'];
        $ch = curl_init("$apiUrl/payments");
        $payload = json_encode([
            'payment' => [
                'amount' => 0.01,
                'memo' => "Auto Reward Return",
                'metadata' => ['type' => 'auto_test'],
                'uid' => $uid
            ],
            'payment_type' => 'A2U'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Key $apiKey", "Content-Type: application/json"]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        $resData = json_decode($res, true);
        
        if (isset($resData['identifier'])) {
            $pid = $resData['identifier'];
            // Approve A2U
            $ch = curl_init("$apiUrl/payments/$pid/approve");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Key $apiKey"]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $app = curl_exec($ch);
            $appData = json_decode($app, true);
            
            // Complete A2U
            if (isset($appData['transaction']['txid'])) {
                $ch = curl_init("$apiUrl/payments/$pid/complete");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['txid' => $appData['transaction']['txid']]));
                curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Key $apiKey", "Content-Type: application/json"]);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_exec($ch);
            }
        }
        echo $res;
        exit;
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Pi Fast-Test Tool</title>
    <script src="https://sdk.minepi.com/pi-sdk.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: sans-serif; text-align: center; padding: 20px; background: #2a0845; color: white; }
        .box { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); }
        button { background: #f3ba2f; color: #000; border: none; padding: 15px 30px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 1.1rem; }
        .log { margin-top: 20px; text-align: left; background: #000; padding: 10px; border-radius: 10px; font-family: monospace; font-size: 0.8rem; height: 150px; overflow-y: auto; color: #0f0; }
        .step { margin: 10px 0; opacity: 0.5; }
        .active { opacity: 1; font-weight: bold; color: #f3ba2f; }
    </style>
</head>
<body>
    <div class="box">
        <h1>Pi Fast-Test Tool</h1>
        <p>Gunakan script ini untuk memenuhi syarat 10 transaksi.</p>
        
        <div id="steps">
            <div id="step1" class="step">1. Login & Request Scopes</div>
            <div id="step2" class="step">2. User Bayar π0.01 (U2A)</div>
            <div id="step3" class="step">3. App Kirim Balik π0.01 (A2U)</div>
        </div>

        <br>
        <button id="btnStart">MULAI TEST TRANSAKSI</button>
        
        <div class="log" id="logText">Menunggu perintah...</div>
    </div>

    <script>
        const Pi = window.Pi;
        Pi.init({ version: "2.0", sandbox: true });

        function log(msg) {
            const div = document.getElementById('logText');
            div.innerHTML += "> " + msg + "<br>";
            div.scrollTop = div.scrollHeight;
        }

        function setStep(id) {
            document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        }

        document.getElementById('btnStart').onclick = async () => {
            try {
                setStep('step1');
                log("Memulai autentikasi...");
                const auth = await Pi.authenticate(['username', 'payments', 'wallet_address'], (p) => {
                    log("Ada transaksi tertunda: " + p.identifier);
                });
                log("Login sukses: " + auth.user.username);

                setStep('step2');
                log("Meminta pembayaran π0.01...");
                
                Pi.createPayment({
                    amount: 0.01,
                    memo: "Test Transaction",
                    metadata: { type: "test" }
                }, {
                    onReadyForServerApproval: (id) => {
                        log("Menyetujui pembayaran: " + id);
                        const fd = new FormData();
                        fd.append('paymentId', id);
                        fetch('?action=approve_u2a', { method: 'POST', body: fd })
                        .then(r => r.json())
                        .then(data => {
                            if(data.identifier) log("Persetujuan Server Terkirim ✅");
                            else log("Gagal Approve: " + JSON.stringify(data));
                        });
                    },
                    onReadyForServerCompletion: (id, txid) => {
                        log("Pembayaran sukses di blockchain! Menyelesaikan...");
                        const fd = new FormData();
                        fd.append('paymentId', id);
                        fd.append('txid', txid);
                        fetch('?action=complete_u2a', { method: 'POST', body: fd })
                        .then(() => {
                            log("U2A Selesai ✅");
                            triggerA2U(auth.user.uid);
                        });
                    },
                    onCancel: (id) => log("Transaksi dibatalkan."),
                    onError: (err, p) => log("Error U2A: " + err.message)
                });

            } catch (err) {
                log("Error: " + err.message);
            }
        };

        async function triggerA2U(uid) {
            setStep('step3');
            log("Memicu Pengiriman Balik (A2U)...");
            const fd = new FormData();
            fd.append('uid', uid);
            try {
                const res = await fetch('?action=trigger_a2u', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.identifier) {
                    log("A2U SUKSES! ID: " + data.identifier);
                    log("Tugas Selesai untuk akun ini. ✅");
                    alert("Berhasil! 1 transaksi A2U selesai. Silakan ganti akun.");
                } else {
                    log("A2U Gagal: " + JSON.stringify(data));
                }
            } catch (e) {
                log("Error Trigger A2U: " + e.message);
            }
        }
    </script>
</body>
</html>
