<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SampleProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Bersihkan Produk Lama (Gunakan delete agar cascade berjalan)
        \App\Models\Product::query()->delete();

        $data = [
            'Otomotif' => [
                ['name' => 'Honda CR-V Luxury 2024', 'price' => 5.5, 'stock' => 5, 'desc' => 'Mobil SUV premium dengan teknologi Honda Sensing terbaru.'],
                ['name' => 'Toyota Alphard G-Edition', 'price' => 12.0, 'stock' => 2, 'desc' => 'Kenyamanan kabin kasta tertinggi untuk perjalanan keluarga Anda.'],
                ['name' => 'Yamaha NMAX Turbo', 'price' => 0.45, 'stock' => 10, 'desc' => 'Skuter matik bertenaga dengan akselerasi instan.'],
            ],
            'Elektronik' => [
                ['name' => 'MacBook Air M3 15-inch', 'price' => 4.2, 'stock' => 15, 'desc' => 'Laptop tipis paling bertenaga dengan chip terbaru dari Apple.'],
                ['name' => 'iPhone 15 Pro Max 256GB', 'price' => 3.5, 'stock' => 20, 'desc' => 'Kamera titanium profesional di dalam saku Anda.'],
                ['name' => 'Sony WH-1000XM5 Headphone', 'price' => 0.85, 'stock' => 25, 'desc' => 'Noise-cancelling terbaik untuk pengalaman audio murni.'],
            ],
            'Properti' => [
                ['name' => 'Villa Ocean View Bali', 'price' => 250.0, 'stock' => 1, 'desc' => 'Villa mewah dengan pemandangan langsung ke Pantai Uluwatu.'],
                ['name' => 'Apartemen Sudirman Park', 'price' => 85.0, 'stock' => 3, 'desc' => 'Hunian vertikal strategis di pusat bisnis Jakarta.'],
            ],
            'Wisata Religi' => [
                ['name' => 'Paket Haji Furoda 2025', 'price' => 150.0, 'stock' => 10, 'desc' => 'Berangkat haji tanpa antre dengan fasilitas hotel bintang 5.'],
                ['name' => 'Umroh Ramadhan 15 Hari', 'price' => 35.0, 'stock' => 40, 'desc' => 'Nikmati kekhusyukan ibadah di bulan suci Ramadhan.'],
            ],
            'Makanan' => [
                ['name' => 'Rendang Daging Sapi Vakum', 'price' => 0.015, 'stock' => 100, 'desc' => 'Rendang autentik Minang, tahan lama tanpa bahan pengawet.'],
                ['name' => 'Kopi Arabika Gayo 250gr', 'price' => 0.008, 'stock' => 200, 'desc' => 'Biji kopi pilihan dengan aromatik khas tanah Gayo.'],
            ],
            'Minuman' => [
                ['name' => 'Madu Hutan Murni 500ml', 'price' => 0.012, 'stock' => 50, 'desc' => 'Madu asli dari pedalaman hutan, kaya akan nutrisi.'],
                ['name' => 'Teh Melati Premium', 'price' => 0.003, 'stock' => 300, 'desc' => 'Seduhan teh tradisional dengan aroma melati yang menenangkan.'],
            ],
            'Perawatan Tubuh' => [
                ['name' => 'Sabun Organik Lidah Buaya', 'price' => 0.002, 'stock' => 150, 'desc' => 'Menjaga kelembapan kulit dengan bahan alami.'],
                ['name' => 'Shampo Herbal Anti-Rontok', 'price' => 0.005, 'stock' => 80, 'desc' => 'Menguatkan akar rambut dari bahan tumbuhan pilihan.'],
            ],
            'Kerajinan Tangan' => [
                ['name' => 'Kain Batik Tulis Solo', 'price' => 0.45, 'stock' => 5, 'desc' => 'Mahakarya tangan perajin Solo dengan motif klasik.'],
                ['name' => 'Gerabah Kasongan Set', 'price' => 0.025, 'stock' => 12, 'desc' => 'Dekorasi rumah estetik asli dari desa wisata Kasongan.'],
                ['name' => 'Tas Anyaman Pandan', 'price' => 0.018, 'stock' => 30, 'desc' => 'Tas ramah lingkungan yang trendi untuk bepergian.'],
            ],
        ];

        foreach ($data as $catName => $products) {
            $cat = \App\Models\Category::where('name', $catName)->first();
            if ($cat) {
                foreach ($products as $p) {
                    \App\Models\Product::create([
                        'category_id' => $cat->id,
                        'name' => $p['name'],
                        'slug' => \Illuminate\Support\Str::slug($p['name']),
                        'description' => $p['desc'],
                        'price' => $p['price'],
                        'stock' => $p['stock'],
                        'is_active' => true,
                        // Kita beri gambar dummy dulu
                        'image' => 'https://placehold.co/600x600?text=' . urlencode($p['name']),
                    ]);
                }
            }
        }
    }
}
