<?php

namespace App\Http\Controllers;

use App\Models\JobAssignment;
use App\Models\JobCard;
use App\Models\ServiceStatus;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;

class JobAssignmentController extends Controller
{
    use AuthorizesRequests;

    // Kanban View: Grouped by stage with position sorting
    public function kanban(Request $request)
    {
        $this->authorize('viewAny', JobAssignment::class);

        $stages = ['assigned', 'in_progress', 'completed', 'ready_for_delivery', 'delivered', 'verified'];

        $assignments = JobAssignment::with([
            'jobCard.serviceInward.contact',
            'user',
            'status',
            'adminVerifier',
            'auditor'
        ])
            ->whereIn('stage', $stages)
            ->where('is_active', true) // Only show active assignments
            ->orderBy('position')
            ->get()
            ->groupBy('stage')
            ->map(function ($items, $stage) {
                return $items->sortBy('position')->values();
            });

        // Fill empty stages
        foreach ($stages as $stage) {
            if (!isset($assignments[$stage])) {
                $assignments[$stage] = collect();
            }
        }

        return Inertia::render('JobAssignments/Kanban', [
            'assignments' => $assignments,
            'stages' => $stages,
            'can' => [
                'create' => Gate::allows('create', JobAssignment::class),
                'update_stage' => Gate::allows('update', [JobAssignment::class, null]),
            ],
        ]);
    }

    // Show: Display single assignment details
    public function show(JobAssignment $assignment)
    {

        $this->authorize('view', $assignment);

        $assignment->load([
            'jobCard.serviceInward.contact',
            'user',
            'status',
            'adminVerifier',
            'auditor'
        ]);

        return Inertia::render('JobAssignments/Show', [
            'assignment' => $assignment,
            'supervisors' => User::whereHas('roles', fn($q) => $q->whereIn('name', ['super-admin', 'admin']))
                ->orderBy('name')
                ->get(['id', 'name']),
            'users' => User::orderBy('name')->get(['id', 'name']),
            'can' => [
                'update' => Gate::allows('update', $assignment),
                'delete' => Gate::allows('delete', $assignment),
                'adminClose' => Gate::allows('adminClose', $assignment),
            ],
        ]);
    }

    // Update position on drag (Kanban)
    public function updatePosition(Request $request)
    {
        $this->authorize('update', JobAssignment::class);

        $request->validate([
            'assignment_id' => 'required|exists:job_assignments,id',
            'stage' => 'required|in:assigned,in_progress,completed,ready_for_delivery,generate_otp,delivered,verified',
            'position' => 'required|integer|min:0',
        ]);

        $assignment = JobAssignment::findOrFail($request->assignment_id);

        $allowedTransitions = [
            'assigned'          => ['in_progress'],
            'in_progress'       => ['completed'],
            'completed'         => ['ready_for_delivery'],
            'ready_for_delivery'=> ['generate_otp'],      // ← Only generate OTP next
            'generate_otp'      => ['delivered'],         // ← Only confirm OTP next
            'delivered'         => ['verified'],
        ];

        $from = $assignment->stage;
        $to   = $request->stage;

        if ($from !== $to && (!isset($allowedTransitions[$from]) || !in_array($to, $allowedTransitions[$from]))) {
            return response()->json(['error' => 'Invalid stage transition'], 403);
        }

        DB::transaction(function () use ($assignment, $request) {
            JobAssignment::where('stage', $request->stage)
                ->where('position', '>=', $request->position)
                ->increment('position');

            $assignment->update([
                'stage'    => $request->stage,
                'position' => $request->position,
            ]);

            event(new \App\Events\AssignmentUpdated($assignment, $request->stage, $request->position));
        });

        return response()->json(['success' => true]);
    }

    // Index: List view with filters
    public function index(Request $request)
    {
        $this->authorize('viewAny', JobAssignment::class);

        $perPage = $request->input('per_page', 50);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 50;

        $query = JobAssignment::with(['jobCard.serviceInward.contact', 'user', 'status', 'adminVerifier'])
            ->where('is_active', true)
            ->when($request->filled('search'), fn($q) => $q->where(function ($sq) use ($request) {
                $search = $request->search;
                $sq->whereHas('jobCard', fn($j) => $j->where('job_no', 'like', "%{$search}%"))
                    ->orWhereHas('jobCard.serviceInward', fn($i) => $i->where('rma', 'like', "%{$search}%"))
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            }))
            ->when($request->filled('stage'), fn($q) => $q->where('stage', $request->stage))
            ->when($request->filled('technician_filter'), fn($q) => $q->where('user_id', $request->technician_filter))
            ->latest('assigned_at');

        $assignments = $query->paginate($perPage)->withQueryString();

        return Inertia::render('JobAssignments/Index', [
            'assignments' => $assignments,
            'filters' => $request->only(['search', 'stage', 'technician_filter', 'per_page']),
            'stages' => ['assigned', 'in_progress', 'completed', 'ready_for_delivery', 'generate_otp', 'delivered', 'verified'],
            'technicians' => User::orderBy('name')->get(['id', 'name']),
            'can' => [
                'create' => Gate::allows('create', JobAssignment::class),
                'admin_close' => Gate::allows('adminClose', JobAssignment::class),
            ],
            'trashedCount' => JobAssignment::onlyTrashed()->count(),
        ]);
    }

    // Create: Assign job to engineer
    public function create()
    {
        $this->authorize('create', JobAssignment::class);

        $jobCards = JobCard::with('serviceInward.contact')
            ->whereDoesntHave('assignments', fn($q) => $q->whereNull('completed_at')->where('is_active', true))
            ->get(['id', 'job_no', 'service_inward_id']);

        return Inertia::render('JobAssignments/Assign', [
            'jobCards' => $jobCards,
            'engineers' => User::engineer()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', JobAssignment::class);

        $validated = $request->validate([
            'job_card_id' => [
                'required',
                'exists:job_cards,id',
                // CUSTOM RULE: Prevent duplicate active assignment
                function ($attribute, $value, $fail) use ($request) {
                    $exists = JobAssignment::where('job_card_id', $value)
                        ->where('user_id', $request->user_id)
                        ->where('is_active', true)
                        ->exists();

                    if ($exists) {
                        $jobCard = \App\Models\JobCard::find($value);
                        $engineer = \App\Models\User::find($request->user_id);

                        $fail("Job #{$jobCard->job_no} is already assigned to {$engineer->name}. Cannot assign again.");
                    }
                },
            ],
            'user_id'      => 'required|exists:users,id',
            'remarks'      => 'nullable|string',
        ]);

        // Proceed with creation
        $assignment = JobAssignment::create([
            'job_card_id'       => $validated['job_card_id'],
            'user_id'           => $validated['user_id'],
            'remarks'           => $validated['remarks'] ?? null,
            'assigned_at'       => now(),
            'stage'             => 'assigned',
            'position'          => JobAssignment::where('stage', 'assigned')->max('position') + 1,
            'is_active'         => true,
            'service_status_id' => 1, // or dynamic
        ]);

        return redirect()
            ->route('job_assignments.show', $assignment)
            ->with('success', 'Job assigned successfully!');
    }

    // Service: Engineer updates work (in_progress → completed)
    public function service(JobAssignment $assignment)
    {
        $this->authorize('complete', $assignment);

        $assignment->load(['jobCard.serviceInward.contact', 'user', 'spares', 'notes']);

        return Inertia::render('JobAssignments/Service', [
            'assignment' => $assignment,
            'can' => [
                'start' => Gate::allows('start', $assignment),
                'complete' => Gate::allows('complete', $assignment),
                'add_spare' => Gate::allows('manageSpares', $assignment),
            ],
        ]);
    }

    public function startService(Request $request, JobAssignment $assignment)
    {
        $this->authorize('start', $assignment);

        $assignment->update([
            'stage' => 'in_progress',
            'started_at' => now(),
            'position' => JobAssignment::where('stage', 'in_progress')->max('position') + 1,
        ]);

        return back()->with('success', 'Service started.');
    }

    public function completeService(Request $request, JobAssignment $assignment)
    {
        $this->authorize('complete', $assignment);

        $data = $request->validate([
            'report' => 'required|string',
            'time_spent_minutes' => 'required|integer|min:1',
            'engineer_note' => 'nullable|string',
        ]);

        $data['stage'] = 'completed';
        $data['completed_at'] = now();
        $data['position'] = JobAssignment::where('stage', 'completed')->max('position') + 1;

        $assignment->update($data);

        return redirect()->route('job_assignments.show', $assignment)->with('success', 'Service completed.');
    }

    // Deliver: Ready for delivery → delivery confirmed
    public function deliver(JobAssignment $assignment)
    {
        $this->authorize('readyForDelivery', $assignment);

        $assignment->load(['jobCard', 'user', 'spares']);

        return Inertia::render('JobAssignments/Deliver', [
            'assignment' => $assignment,
            'can' => [
                'ready' => Gate::allows('readyForDelivery', $assignment),
                'confirm' => Gate::allows('verifyDelivery', $assignment),
            ],
        ]);
    }

    public function readyForDelivery(Request $request, JobAssignment $assignment)
    {
        $this->authorize('readyForDelivery', $assignment);

        $data = $request->validate([
            'billing_details' => 'required|string',
            'billing_amount' => 'required|numeric|min:0',
            'billing_confirmed_by' => 'required|exists:users,id',
        ]);

        // Convert ID → Name (column is string)
        $supervisor = User::findOrFail($data['billing_confirmed_by']);
        $data['billing_confirmed_by'] = $supervisor->name;

        $data['stage'] = 'ready_for_delivery';
        $data['position'] = JobAssignment::where('stage', 'ready_for_delivery')->max('position') + 1;

        $assignment->update($data);

        return back()->with('success', 'Marked as ready for delivery.');
    }


    // Generate OTP & Return to Frontend (no server-side WhatsApp opening)
    public function generateOtp(Request $request, JobAssignment $assignment)
    {
        $this->authorize('verifyDelivery', $assignment);

        if ($assignment->stage !== 'ready_for_delivery') {
            return back()->withErrors(['otp' => 'This job is not ready for delivery yet.']);
        }

        $request->validate(['deliver_by' => 'required|exists:users,id']);

        $assignment->loadMissing(['jobCard.serviceInward.contact']);
        $contact = $assignment->jobCard?->serviceInward?->contact;

        if (!$contact?->mobile) {
            return back()->withErrors(['otp' => 'Customer mobile number is missing.']);
        }

        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $deliverBy = User::findOrFail($request->deliver_by);

        $clean = preg_replace('/\D/', '', $contact->mobile);
        if (strlen($clean) === 10) $clean = '91' . $clean;

        $formattedMobile = '+91 ' . substr($clean, 2, 5) . ' ' . substr($clean, 7);
        $whatsappNumber = $clean;

        DB::transaction(function () use ($assignment, $otp, $deliverBy) {
            $assignment->update([
                'current_otp'            => $otp,
                'delivered_otp'          => $otp,
                'delivered_confirmed_by' => $deliverBy->name,
                'stage'                  => 'generate_otp',
                'position'               => JobAssignment::where('stage', 'generate_otp')->max('position') + 1,
            ]);
        });

        // FIXED LINE: Same query used in show() method – 100% working
        $supervisors = User::whereHas('roles', fn($q) => $q->whereIn('name', ['super-admin', 'admin']))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('JobAssignments/Show', [
            'assignment'  => $assignment->fresh([
                'jobCard.serviceInward.contact',
                'user',
                'status',
                'adminVerifier',
                'auditor'
            ]),
            'supervisors' => $supervisors,
            'users'       => User::orderBy('name')->get(['id', 'name']),
            'can'         => [
                'update'     => Gate::allows('update', $assignment),
                'delete'     => Gate::allows('delete', $assignment),
                'adminClose' => Gate::allows('adminClose', $assignment),
            ],
        ])->with([
            'success'         => 'OTP Generated & Sent!',
            'otp'             => $otp,
            'formattedMobile' => $formattedMobile,
            'whatsappNumber'  => $whatsappNumber,
        ]);
    }

// Update confirmDelivery to check OTP
    public function confirmDelivery(Request $request, JobAssignment $assignment)
    {
        $this->authorize('verifyDelivery', $assignment);

        if ($assignment->stage !== 'generate_otp') {
            return back()->withErrors(['delivered_otp' => 'OTP has not been generated or already confirmed.']);
        }

        $request->validate(['delivered_otp' => 'required|digits:6']);

        if ($request->delivered_otp !== $assignment->current_otp) {
            return back()->withErrors(['delivered_otp' => 'Invalid OTP. Please check and try again.']);
        }

        DB::transaction(function () use ($assignment) {
            $assignment->update([
                'stage'                  => 'delivered',
                'delivered_confirmed_at' => now(),
                'delivered_confirmed_by' => auth()->user()->name,
                'current_otp'            => null,
                'position'               => JobAssignment::where('stage', 'delivered')->max('position') + 1,
            ]);
        });

        return redirect()
            ->route('job_assignments.show', $assignment)
            ->with('success', 'Delivery confirmed! Job is now Delivered.');
    }



    // Admin Close: Final verification and close
    public function adminClose(JobAssignment $assignment)
    {
        $this->authorize('adminClose', $assignment);

        $assignment->load(['jobCard', 'user', 'auditor']);

        return Inertia::render('JobAssignments/AdminClose', [
            'assignment' => $assignment,
            'can' => [
                'audit' => Gate::allows('audit', $assignment),
                'close' => Gate::allows('adminClose', $assignment),
            ],
        ]);
    }

    public function audit(Request $request, JobAssignment $assignment)
    {
        $this->authorize('audit', $assignment);

        $data = $request->validate([
            'audit_note' => 'required|string',
        ]);

        $data['audited_at'] = now();
        $data['auditor_id'] = auth()->id();

        $assignment->update($data);

        return back()->with('success', 'Audit note added.');
    }

    public function closeByAdmin(Request $request, JobAssignment $assignment)
    {
        $this->authorize('adminClose', $assignment);

        $data = $request->validate([
            'admin_verification_note' => 'required|string',
            'customer_satisfaction_rating' => 'required|integer|between:1,5',
        ]);

        $data['stage'] = 'verified';
        $data['admin_verified_at'] = now();
        $data['admin_verifier_id'] = auth()->id();
        $data['is_active'] = false; // Hide from all views
        $data['position'] = 0;

        $assignment->update($data);

        // Trigger merit points calculation via observer
        // (already handled in JobAssignmentObserver)

        return redirect()->route('job_assignments.index')->with('success', 'Job closed successfully.');
    }

    public function finals(Request $request)
    {
        $this->authorize('viewAny', JobAssignment::class);

        $perPage = $request->input('per_page', 50);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 50;

        $query = JobAssignment::with(['jobCard.serviceInward.contact', 'user', 'status', 'adminVerifier'])
            ->where('is_active', false)
            ->when($request->filled('search'), fn($q) => $q->where(function ($sq) use ($request) {
                $search = $request->search;
                $sq->whereHas('jobCard', fn($j) => $j->where('job_no', 'like', "%{$search}%"))
                    ->orWhereHas('jobCard.serviceInward', fn($i) => $i->where('rma', 'like', "%{$search}%"))
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            }))
            ->when($request->filled('stage'), fn($q) => $q->where('stage', $request->stage))
            ->when($request->filled('technician_filter'), fn($q) => $q->where('user_id', $request->technician_filter))
            ->latest('admin_verified_at');

        $assignments = $query->paginate($perPage)->withQueryString();

        return Inertia::render('JobAssignments/Closed', [
            'assignments' => $assignments,
            'filters' => $request->only(['search', 'stage', 'technician_filter', 'per_page']),
            'stages' => ['assigned', 'in_progress', 'completed', 'ready_for_delivery', 'generate_otp', 'delivered', 'verified'],
            'technicians' => User::orderBy('name')->get(['id', 'name']),
            'can' => [
                'create' => Gate::allows('create', JobAssignment::class),
                'admin_close' => Gate::allows('adminClose', JobAssignment::class),
            ],
            'trashedCount' => JobAssignment::onlyTrashed()->count(),
        ]);
    }


    // Trash & Restore
    public function destroy(JobAssignment $assignment)
    {
        $this->authorize('delete', $assignment);
        $assignment->update(['is_active' => false]);
        $assignment->delete();
        return back()->with('success', 'Assignment archived.');
    }

    public function restore($id)
    {
        $assignment = JobAssignment::withTrashed()->findOrFail($id);
        $this->authorize('restore', $assignment);
        $assignment->restore();
        $assignment->update(['is_active' => true]);
        return back()->with('success', 'Assignment restored.');
    }

    public function trash()
    {
        $this->authorize('viewAny', JobAssignment::class);
        $assignments = JobAssignment::onlyTrashed()->with(['jobCard', 'user'])->paginate(50);
        return Inertia::render('JobAssignments/Trash', ['assignments' => $assignments]);
    }
}
