<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained('job_cards');
            $table->foreignId('user_id')->constrained('users'); // Technician or engineer assigned
            $table->dateTime('assigned_at');
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->integer('time_spent_minutes')->default(0);
            $table->longText('report')->nullable(); // Engineer's work report
            $table->text('remarks')->nullable();
            $table->string('stage')->default('assigned'); // For Kanban: e.g., 'assigned', 'in_progress', 'completed', 'ready_for_delivery', 'delivered', 'verified'
            $table->integer('position')->default(0); // Added for Kanban: Ordering/position within a stage column
            $table->integer('merit_points')->default(0); // Added: Points of merit for engineer based on completion and satisfaction
            $table->integer('customer_satisfaction_rating')->nullable(); // Added: 1-5 rating from customer post-delivery
            $table->text('engineer_note')->nullable();
            $table->text('future_note')->nullable();
            $table->text('billing_details')->nullable();
            $table->decimal('billing_amount', 13, 2)->default('0.00'); // Total bill: service + spares sum
            $table->foreignId('billing_confirmed_by')->nullable()->constrained('users');
            $table->dateTime('delivered_confirmed_at')->nullable();
            $table->string('delivered_confirmed_by')->nullable();
            $table->foreignId('delivered_confirmed_by_id')->nullable()->constrained('users');
            $table->string('current_otp')->nullable();
            $table->string('delivered_otp')->nullable();
            $table->foreignId('service_status_id')->constrained('service_statuses');
            $table->foreignId('admin_verifier_id')->nullable()->constrained('users');
            $table->dateTime('admin_verified_at')->nullable();
            $table->text('admin_verification_note')->nullable();
            $table->foreignId('auditor_id')->nullable()->constrained('users');
            $table->dateTime('audited_at')->nullable();
            $table->text('audit_note')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['job_card_id', 'user_id']);
        });

        // New child table: job_assignment_spares (for spares included in the service)
        Schema::create('job_assignment_spares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_assignment_id')->constrained('job_assignments')->onDelete('cascade');
            $table->foreignId('service_part_id')->nullable()->constrained('service_parts'); // Assuming a 'spares' table exists for inventory
            $table->string('spare_name'); // Fallback if no spare_id, or custom spare
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 13, 2);
            $table->decimal('total_amount', 13, 2); // quantity * unit_price
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // New child table: job_assignment_notes (for conversation notes)
        Schema::create('job_assignment_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_assignment_id')->constrained('job_assignments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users'); // Who added the note (engineer, admin, customer rep)
            $table->longText('note');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_assignment_notes');
        Schema::dropIfExists('job_assignment_spares');
        Schema::dropIfExists('job_assignments');
    }
};
