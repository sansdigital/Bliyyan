<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BliyyanTokenTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'description',
        'reference_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
