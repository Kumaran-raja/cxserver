<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobAssignmentSpare extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'job_assignment_id',
        'service_part_id',
        'spare_name',
        'quantity',
        'unit_price',
        'total_amount',
        'description',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function jobAssignment(): BelongsTo
    {
        return $this->belongsTo(JobAssignment::class, 'job_assignment_id');
    }

    public function servicePart(): BelongsTo
    {
        return $this->belongsTo(ServicePart::class); // Assumes Spare model exists
    }
    protected static function booted(): void
    {
        static::saving(function ($spare) {
            $spare->total_amount = $spare->quantity * $spare->unit_price;
        });
    }
}
