<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategoryGroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $groups = [
            'bliyyan' => [
                'name' => 'Bliyyan',
                'categories' => ['Otomotif', 'Elektronik', 'Properti', 'Wisata Religi']
            ],
            'bliyyanmart' => [
                'name' => 'Bliyyan Mart',
                'categories' => ['Makanan', 'Minuman', 'Perawatan Tubuh', 'Perawatan Rumah Tangga']
            ],
            'bliyyancraft' => [
                'name' => 'Bliyyan Craft',
                'categories' => ['Kerajinan Tangan']
            ],
        ];

        foreach ($groups as $key => $data) {
            $group = \App\Models\CategoryGroup::updateOrCreate(
                ['key' => $key],
                ['name' => $data['name']]
            );

            foreach ($data['categories'] as $catName) {
                \App\Models\Category::updateOrCreate(
                    ['slug' => \Illuminate\Support\Str::slug($catName)],
                    ['name' => $catName, 'category_group_id' => $group->id]
                );
            }
        }
    }
}
