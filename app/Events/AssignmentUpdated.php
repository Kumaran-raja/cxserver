<?php

namespace App\Events;

use App\Models\JobAssignment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssignmentUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $assignment;
    public $stage;
    public $position;

    public function __construct(JobAssignment $assignment, string $stage, int $position)
    {
        $this->assignment = $assignment;
        $this->stage = $stage;
        $this->position = $position;
    }

    public function broadcastOn()
    {
        return new Channel('job-assignments');
    }

    public function broadcastAs()
    {
        return 'AssignmentUpdated';
    }
}
