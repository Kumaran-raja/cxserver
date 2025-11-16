<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobAssignmentNote extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'job_assignment_id',
        'user_id',
        'note',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The job assignment this note belongs to.
     */
    public function jobAssignment(): BelongsTo
    {
        return $this->belongsTo(JobAssignment::class, 'job_assignment_id');
    }

    /**
     * The user who created the note (engineer, admin, customer rep).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
