<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin User
        User::factory()->create([
            'name' => 'Admin Pi',
            'email' => 'admin@pi.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

        // Categories
        $categories = [
            ['name' => 'Handphone & Aksesoris', 'slug' => 'handphone-aksesoris', 'description' => 'Smartphone, charger, casing, dll.'],
            ['name' => 'Komputer & Laptop', 'slug' => 'komputer-laptop', 'description' => 'Laptop, PC, Monitor, dll.'],
            ['name' => 'Audio & Kamera', 'slug' => 'audio-kamera', 'description' => 'Headphone, Speaker, DSLR, dll.'],
        ];

        foreach ($categories as $cat) {
            $category = \App\Models\Category::create($cat);

            // Products per category
            if ($cat['slug'] === 'handphone-aksesoris') {
                \App\Models\Product::create([
                    'category_id' => $category->id,
                    'name' => 'iPhone 15 Pro Max',
                    'slug' => 'iphone-15-pro-max',
                    'description' => 'Flagship Apple terbaru dengan chip A17 Pro.',
                    'price' => 5.5000000,
                    'stock' => 10,
                    'is_featured' => true,
                ]);
                \App\Models\Product::create([
                    'category_id' => $category->id,
                    'name' => 'Samsung Galaxy S24 Ultra',
                    'slug' => 'samsung-s24-ultra',
                    'description' => 'Android tercanggih dengan fitur AI terintegrasi.',
                    'price' => 4.8000000,
                    'stock' => 15,
                    'is_featured' => true,
                ]);
            } elseif ($cat['slug'] === 'komputer-laptop') {
                \App\Models\Product::create([
                    'category_id' => $category->id,
                    'name' => 'MacBook Air M3',
                    'slug' => 'macbook-air-m3',
                    'description' => 'Laptop tipis paling bertenaga dengan chip M3.',
                    'price' => 6.2000000,
                    'stock' => 5,
                    'is_featured' => true,
                ]);
            }
        }
    }
}
