<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $fillable = [
        'code', 'discount_type', 'discount_value', 'min_purchase', 
        'max_uses', 'used_count', 'expires_at', 'is_active'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function isValid()
    {
        if (!$this->is_active) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        return true;
    }

    public function calculateDiscount($amount)
    {
        if ($amount < $this->min_purchase) return 0;
        
        if ($this->discount_type === 'fixed') {
            return min($amount, $this->discount_value);
        } else {
            return $amount * ($this->discount_value / 100);
        }
    }
}
