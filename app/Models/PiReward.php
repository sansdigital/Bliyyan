<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PiReward extends Model
{
    protected $fillable = [
        'user_id',
        'pi_uid',
        'amount',
        'memo',
        'payment_id',
        'txid',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
