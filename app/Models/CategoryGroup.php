<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryGroup extends Model
{
    protected $fillable = ['name', 'key', 'icon_path'];

    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
