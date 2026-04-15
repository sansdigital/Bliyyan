<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserAddress extends Model
{
    protected $fillable = [
        'user_id', 'code_reg', 'label', 'recipient_name', 'email', 'phone_number', 
        'address_line_1', 'address_line_2', 'city', 
        'province', 'postal_code', 'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
