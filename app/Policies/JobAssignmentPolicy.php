<?php


namespace App\Policies;

use App\Models\JobAssignment;
use App\Models\User;

class JobAssignmentPolicy
{
    /**
     * Global before hook: super-admin bypasses all checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super-admin')) {
            return true;
        }
        return null;
    }

    /**
     * Determine whether the user can view any job assignments (list).
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('job_assignment.list');
    }

    /**
     * Determine whether the user can view a specific job assignment.
     */
    public function view(User $user, JobAssignment $assignment): bool
    {
        // Base permission
        if (!$user->hasPermissionTo('job_assignment.read')) {
            return false;
        }

        // Additional ownership: user must be assigned engineer, admin verifier, auditor, or have global access
        return $assignment->user_id === $user->id
            || $assignment->admin_verifier_id === $user->id
            || $assignment->auditor_id === $user->id
            || $user->hasPermissionTo('job_assignment.read_any');
    }

    /**
     * Determine whether the user can create job assignments.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('job_assignment.create');
    }

    /**
     * Determine whether the user can update the job assignment.
     */
    public function update(User $user, JobAssignment $assignment): bool
    {
        // Base permission
        if (!$user->hasPermissionTo('job_assignment.update')) {
            return false;
        }

        // Engineer can update during 'assigned', 'in_progress', 'completed'
        if ($assignment->user_id === $user->id && in_array($assignment->stage, ['assigned', 'in_progress', 'completed'])) {
            return true;
        }

        // Admin verifier can update when ready for delivery or delivered
        if ($assignment->admin_verifier_id === $user->id && in_array($assignment->stage, ['ready_for_delivery', 'delivered'])) {
            return true;
        }

        // Auditor can add audit notes
        if ($assignment->auditor_id === $user->id && $assignment->stage === 'verified') {
            return true;
        }

        // Global update permission
        return $user->hasPermissionTo('job_assignment.update_any');
    }

    /**
     * Determine whether the user can delete the job assignment.
     */
    public function delete(User $user, JobAssignment $assignment): bool
    {
        return $user->hasPermissionTo('job_assignment.delete');
    }

    /**
     * Determine whether the user can restore a soft-deleted job assignment.
     */
    public function restore(User $user, JobAssignment $assignment): bool
    {
        return $user->hasPermissionTo('job_assignment.restore');
    }

    /**
     * Determine whether the user can permanently delete.
     */
    public function forceDelete(User $user, JobAssignment $assignment): bool
    {
        return $user->hasPermissionTo('job_assignment.delete');
    }

    /**
     * Custom: Engineer can start the job.
     */
    public function start(User $user, JobAssignment $assignment): bool
    {
        return $assignment->user_id === $user->id
            && $assignment->stage === 'assigned'
            && $user->hasPermissionTo('job_assignment.update');
    }

    /**
     * Custom: Engineer can complete the job.
     */
    public function complete(User $user, JobAssignment $assignment): bool
    {
        return $assignment->user_id === $user->id
            && $assignment->stage === 'in_progress'
            && $user->hasPermissionTo('job_assignment.update');
    }

    /**
     * Custom: Engineer can mark ready for delivery.
     */
    public function readyForDelivery(User $user, JobAssignment $assignment): bool
    {
        return $assignment->user_id === $user->id
            && $assignment->stage === 'completed'
            && $user->hasPermissionTo('job_assignment.update');
    }

    /**
     * Custom: Admin can verify delivery.
     */
    public function verifyDelivery(User $user, JobAssignment $assignment): bool
    {
        return $assignment->admin_verifier_id === $user->id
            && $assignment->stage === 'ready_for_delivery'
            && $user->hasPermissionTo('job_assignment.update');
    }

    /**
     * Custom: Auditor can audit.
     */
    public function audit(User $user, JobAssignment $assignment): bool
    {
        return $assignment->auditor_id === $user->id
            && $assignment->stage === 'delivered'
            && $user->hasPermissionTo('job_assignment.update');
    }

    /**
     * Custom: Allow updating spares (child table).
     */
    public function manageSpares(User $user, JobAssignment $assignment): bool
    {
        return $assignment->user_id === $user->id
            && in_array($assignment->stage, ['in_progress', 'completed'])
            && $user->hasPermissionTo('job_assignment.update');
    }

    /**
     * Custom: Merit points can only be viewed, not manually edited.
     */
    public function viewMeritPoints(User $user, JobAssignment $assignment): bool
    {
        return $this->view($user, $assignment);
    }

    public function adminClose(User $user, JobAssignment $assignment): bool
    {
        return $user->hasPermissionTo('job_assignment.admin_close')
            && $assignment->stage === 'delivered';
    }
}
