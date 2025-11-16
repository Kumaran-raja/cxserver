<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('job_assignments', function (Blueprint $table) {
            $table->foreignId('billing_confirmed_by')->nullable()->after('billing_amount')->constrained('users');
        });
    }

    public function down()
    {
        Schema::table('job_assignments', function (Blueprint $table) {
            $table->dropForeign(['billing_confirmed_by']);
            $table->dropColumn('billing_confirmed_by');
        });
    }
};
