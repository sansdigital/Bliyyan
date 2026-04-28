<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bliyyan_token_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 16, 4); // Positif untuk earn, Negatif untuk spend
            $table->string('type'); // purchase_reward, referral, payment, adjustment, etc.
            $table->string('description')->nullable();
            $table->string('reference_id')->nullable(); // ID Order atau ID Pi Transaction
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bliyyan_token_transactions');
    }
};
