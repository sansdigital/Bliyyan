<?php

namespace App\Http\Controllers;
 
use App\Models\BliyyanTokenTransaction;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BliyyanTokenController extends Controller
{
    /**
     * Tampilkan halaman riwayat token (Frontend).
     */
    public function index()
    {
        $transactions = auth()->user()->tokenTransactions()
            ->latest()
            ->paginate(10);

        return Inertia::render('Token/Index', [
            'transactions' => $transactions,
            'balance' => auth()->user()->token_balance
        ]);
    }

    /**
     * Metode Statis untuk memberikan token reward belanja.
     * Rasio Default: 1 Pi = 1,000 Bliyyan Token
     */
    public static function awardTokenForPurchase(Order $order)
    {
        try {
            DB::transaction(function () use ($order) {
                $user = $order->user;
                $conversionRate = 1000; // 1 Pi = 1000 Token
                $rewardAmount = $order->total_price * $conversionRate;

                if ($rewardAmount <= 0) return;

                // 1. Tambahkan saldo user
                $user->increment('token_balance', $rewardAmount);

                // 2. Catat transaksi
                BliyyanTokenTransaction::create([
                    'user_id' => $user->id,
                    'amount' => $rewardAmount,
                    'type' => 'purchase_reward',
                    'description' => "Reward pembelian Order #{$order->id}",
                    'reference_id' => $order->id,
                ]);

                Log::info("Bliyyan Token: Awarded {$rewardAmount} tokens to User #{$user->id} for Order #{$order->id}");
            });
        } catch (\Exception $e) {
            Log::error("Bliyyan Token Error: " . $e->getMessage());
        }
    }

    /**
     * (Opsional) Menggunakan token untuk diskon.
     */
    public static function spendToken(User $user, $amount, $description, $referenceId = null)
    {
        if ($user->token_balance < $amount) {
            throw new \Exception("Saldo token tidak mencukupi.");
        }

        DB::transaction(function () use ($user, $amount, $description, $referenceId) {
            $user->decrement('token_balance', $amount);

            BliyyanTokenTransaction::create([
                'user_id' => $user->id,
                'amount' => -$amount, // Negatif karena berkurang
                'type' => 'payment',
                'description' => $description,
                'reference_id' => $referenceId,
            ]);
        });
    }
}
