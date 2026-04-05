<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'category_group_id'];

    public function categoryGroup()
    {
        return $this->belongsTo(CategoryGroup::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
