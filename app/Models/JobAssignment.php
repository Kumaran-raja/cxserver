<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'job_card_id',
        'user_id',
        'assigned_at',
        'started_at',
        'completed_at',
        'time_spent_minutes',
        'report',
        'remarks',
        'stage',
        'position',
        'merit_points',
        'customer_satisfaction_rating',
        'engineer_note',
        'future_note',
        'billing_details',
        'billing_amount',
        'delivered_confirmed_at',
        'delivered_confirmed_by',
        'delivered_otp',
        'service_status_id',
        'admin_verifier_id',
        'admin_verified_at',
        'admin_verification_note',
        'auditor_id',
        'audited_at',
        'audit_note',
        'is_active',
        'current_otp',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'delivered_confirmed_at' => 'datetime',
        'admin_verified_at' => 'datetime',
        'audited_at' => 'datetime',
    ];

    public function jobCard(): BelongsTo
    {
        return $this->belongsTo(JobCard::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(ServiceStatus::class, 'service_status_id');
    }

    public function adminVerifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_verifier_id');
    }

    public function auditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auditor_id');
    }

    public function spares(): HasMany
    {
        return $this->hasMany(JobAssignmentSpare::class, 'job_assignment_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(JobAssignmentNote::class, 'job_assignment_id');
    }
}
