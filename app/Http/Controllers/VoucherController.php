<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VoucherController extends Controller
{
    public function validateVoucher(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'amount' => 'required|numeric|min:0'
        ]);

        $voucher = Voucher::where('code', $request->code)
            ->where('is_active', true)
            ->first();

        if (!$voucher) {
            return response()->json(['error' => 'Kode voucher tidak valid.'], 422);
        }

        if (!$voucher->isValid()) {
            return response()->json(['error' => 'Voucher sudah kadaluarsa atau habis kuota.'], 422);
        }

        if ($request->amount < $voucher->min_purchase) {
            return response()->json(['error' => 'Minimal pembelian π ' . number_format($voucher->min_purchase, 4) . ' tidak terpenuhi.'], 422);
        }

        $discount = $voucher->calculateDiscount($request->amount);

        return response()->json([
            'success' => true,
            'discount' => (float)$discount,
            'code' => $voucher->code,
            'type' => $voucher->discount_type,
            'value' => (float)$voucher->discount_value
        ]);
    }
}
