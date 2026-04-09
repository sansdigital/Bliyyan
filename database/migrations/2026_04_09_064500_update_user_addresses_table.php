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
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->string('code_reg')->nullable()->after('user_id');
            $table->string('label')->nullable()->change();
            $table->string('phone_number')->nullable()->change();
            $table->text('address_line_1')->nullable()->change();
            $table->string('city')->nullable()->change();
            $table->string('postal_code')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropColumn('code_reg');
            $table->string('label')->nullable(false)->change();
            $table->string('phone_number')->nullable(false)->change();
            $table->text('address_line_1')->nullable(false)->change();
            $table->string('city')->nullable(false)->change();
            $table->string('postal_code')->nullable(false)->change();
        });
    }
};
