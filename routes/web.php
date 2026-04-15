<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Auth\PiAuthController;

Route::middleware('web')->group(function () {
    Route::post('/auth/pi', [PiAuthController::class, 'authenticate'])->name('pi.auth');
});




// Legal Pages


Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');



Route::middleware(['auth', 'check_address'])->group(function () {
    Route::get('/', function () {
        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'products' => \App\Models\Product::with('category.categoryGroup')->where('is_active', true)->latest()->get(),
            'categories' => \App\Models\Category::with(['categoryGroup'])->withCount(['products' => fn($q) => $q->where('is_active', true)])->get(),
            'groups' => \App\Models\CategoryGroup::withCount('categories')->get(),
            'wishlist_ids' => auth()->check() ? auth()->user()->wishlists()->pluck('product_id')->toArray() : [],
        ]);
    });

    // Legal Pages
    Route::get('/kebijakan-privasi', function () {
        return Inertia::render('PrivacyPolicy');
    })->name('privacy.policy');

    Route::get('/syarat-dan-ketentuan', function () {
        return Inertia::render('TermsAndConditions');
    })->name('terms.conditions');

    Route::get('/product/{slug}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show');
    Route::get('/search', [\App\Http\Controllers\ProductController::class, 'search'])->name('products.search');
    Route::get('/category', fn() => redirect()->route('products.search'))->name('products.categories');
    Route::get('/category/{category:slug}', [\App\Http\Controllers\ProductController::class, 'byCategory'])->name('products.category');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Address Routes
    Route::prefix('profile/addresses')->name('profile.addresses.')->group(function () {
        Route::post('/', [\App\Http\Controllers\UserAddressController::class, 'store'])->name('store');
        Route::put('/{address}', [\App\Http\Controllers\UserAddressController::class, 'update'])->name('update');
        Route::delete('/{address}', [\App\Http\Controllers\UserAddressController::class, 'destroy'])->name('destroy');
        Route::patch('/{address}/set-default', [\App\Http\Controllers\UserAddressController::class, 'setDefault'])->name('set-default');
    });

    // Pi Payments
    Route::post('/pi/create-order', [\App\Http\Controllers\PiPaymentController::class, 'createOrder'])->name('pi.create-order');
    Route::post('/pi/approve', [\App\Http\Controllers\PiPaymentController::class, 'approve'])->name('pi.approve');
    Route::post('/pi/complete', [\App\Http\Controllers\PiPaymentController::class, 'complete'])->name('pi.complete');
    Route::post('/pi/cancel', [\App\Http\Controllers\PiPaymentController::class, 'cancel'])->name('pi.cancel');

    // Cart Routes
    Route::get('/cart/items', [\App\Http\Controllers\CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add', [\App\Http\Controllers\CartController::class, 'add'])->name('cart.add');
    Route::put('/cart/update/{id}', [\App\Http\Controllers\CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/remove/{id}', [\App\Http\Controllers\CartController::class, 'remove'])->name('cart.remove');

    // Order Routes (User)
    Route::get('/orders', [\App\Http\Controllers\OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [\App\Http\Controllers\OrderController::class, 'show'])->name('orders.show');

    // Review Route
    Route::post('/product/{product}/review', [\App\Http\Controllers\ReviewController::class, 'store'])->name('products.review');

    // Voucher Route
    Route::post('/voucher/validate', [\App\Http\Controllers\VoucherController::class, 'validateVoucher'])->name('voucher.validate');

    // Wishlist Routes
    Route::get('/wishlist', [\App\Http\Controllers\WishlistController::class, 'index'])->name('wishlist.index');
    Route::post('/wishlist/toggle', [\App\Http\Controllers\WishlistController::class, 'toggle'])->name('wishlist.toggle');

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');
        Route::resource('products', \App\Http\Controllers\Admin\AdminProductController::class)->names('admin.products');
        Route::resource('categories', \App\Http\Controllers\Admin\AdminCategoryController::class)->names('admin.categories');
        Route::resource('category-groups', \App\Http\Controllers\Admin\AdminCategoryGroupController::class)->names('admin.category-groups')->except(['create', 'edit', 'show']);
        
        Route::get('/orders', [\App\Http\Controllers\Admin\AdminOrderController::class, 'index'])->name('admin.orders.index');
        Route::patch('/orders/{order}/status', [\App\Http\Controllers\Admin\AdminOrderController::class, 'updateStatus'])->name('admin.orders.status');
        Route::post('/orders/{order}/refund', [\App\Http\Controllers\Admin\AdminOrderController::class, 'refund'])->name('admin.orders.refund');
        Route::post('/orders/pi-sync', [\App\Http\Controllers\Admin\AdminOrderController::class, 'syncStuckPayment'])->name('admin.orders.pi-sync');
        Route::delete('/orders/{order}', [\App\Http\Controllers\Admin\AdminOrderController::class, 'destroy'])->name('admin.orders.destroy');
        
        Route::get('/reports', [\App\Http\Controllers\Admin\AdminReportController::class, 'index'])->name('admin.reports.index');
        Route::get('/reports/sales', [\App\Http\Controllers\Admin\AdminReportController::class, 'sales'])->name('admin.reports.sales');
        Route::resource('vouchers', \App\Http\Controllers\Admin\AdminVoucherController::class)->names('admin.vouchers');
        Route::delete('/products/image/{image}', [\App\Http\Controllers\Admin\AdminProductController::class, 'deleteImage'])->name('admin.products.image.delete');
        
        // User/Customer Management
        Route::get('/users', [\App\Http\Controllers\Admin\AdminUserController::class, 'index'])->name('admin.users.index');
        Route::delete('/users/{user}', [\App\Http\Controllers\Admin\AdminUserController::class, 'destroy'])->name('admin.users.destroy');
    });
});

require __DIR__.'/auth.php';
