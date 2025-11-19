<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactNote extends Model
{
    protected $guarded = [];

    protected $casts = [
        'attachments' => 'array',
        'sent_at' => 'datetime',
    ];

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
