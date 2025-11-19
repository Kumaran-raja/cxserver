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
        Schema::create('contact_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // who sent
            $table->enum('channel', ['whatsapp', 'sms', 'email', 'call', 'system']);
            $table->enum('type', ['incoming', 'outgoing']);
            $table->text('message');
            $table->json('attachments')->nullable(); // future file uploads
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamps();

            $table->index(['contact_id', 'sent_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_notes');
    }
};
