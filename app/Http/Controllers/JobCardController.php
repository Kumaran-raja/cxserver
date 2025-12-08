<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\ServiceInward;
use App\Models\ServiceStatus;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class JobCardController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of job cards.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', JobCard::class);

        $perPage = (int) $request->input('per_page', 100);
        $perPage = in_array($perPage, [10, 25, 50, 100, 200]) ? $perPage : 100;

        $query = JobCard::with(['serviceInward.contact', 'status', 'contact', 'user', 'entryBy'])
            ->when($request->filled('search'), fn($q) => $q->where(function ($q) use ($request) {
                $search = $request->search;
                $q->where('job_no', 'like', "%{$search}%")
                    ->orWhereHas('serviceInward', fn($sq) => $sq->where('rma', 'like', "%{$search}%"))
                    ->orWhereHas('contact', fn($cq) => $cq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('entryBy', fn($eq) => $eq->where('name', 'like', "%{$search}%"));
            }))
            ->when($request->filled('status_filter') && $request->status_filter !== 'all', fn($q) =>
            $q->where('service_status_id', $request->status_filter)
            )
            ->when($request->filled('type_filter') && $request->type_filter !== 'all', fn($q) =>
            $q->whereHas('serviceInward', fn($sq) => $sq->where('material_type', $request->type_filter))
            )
            ->when($request->filled('date_from'), fn($q) =>
            $q->whereDate('received_at', '>=', $request->date_from)
            )
            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('received_at', '<=', $request->date_to)
            )
            ->latest('received_at');

        $jobs = $query->paginate($perPage)->withQueryString();

        $statuses = ServiceStatus::orderBy('name')->get(['id', 'name']);

        return Inertia::render('JobCards/Index', [
            'jobs' => $jobs,
            'filters' => $request->only([
                'search', 'status_filter', 'type_filter', 'date_from', 'date_to', 'per_page'
            ]),
            'statuses' => $statuses,
            'can' => [
                'create' => Gate::allows('create', JobCard::class),
                'delete' => Gate::allows('delete', JobCard::class),
            ],
            'trashedCount' => JobCard::onlyTrashed()->count(),
        ]);
    }

    /**
     * Show the form for creating a new job card.
     */
    public function create()
    {
        $this->authorize('create', JobCard::class);

        $inwards  = ServiceInward::where('job_created', false)
            ->with('contact')
            ->get(['id', 'rma', 'contact_id']);

        $statuses = ServiceStatus::all();
        $users    = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('JobCards/Create', [
            'inwards'  => $inwards,
            'statuses' => $statuses,
            'users'    => $users,
        ]);
    }

    /**
     * Store a newly created job card.
     */
    public function store(Request $request)
    {
        $this->authorize('create', JobCard::class);

        $data = $request->validate([
            'service_inward_id' => 'required|exists:service_inwards,id',
            'user_id'           => 'required|exists:users,id',           // Assigned technician
            'service_status_id' => 'required|exists:service_statuses,id',
            'diagnosis'         => 'nullable|string',
            'estimated_cost'    => 'nullable|numeric|min:0',
            'advance_paid'      => 'nullable|numeric|min:0',
            'remarks'           => 'nullable|string|max:255',
            'spares_applied'    => 'nullable|string|max:255',
        ]);

        // Auto-generate job_no
        $nextId = JobCard::withTrashed()->max('id') + 1;
        $data['job_no'] = 'JOB-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

        $data['service_status_id'] = '1';
        // Who entered the job card
        $data['entry_by'] = auth()->id();

        // Copy contact from inward
        $inward = ServiceInward::findOrFail($data['service_inward_id']);
        $data['contact_id'] = $inward->contact_id;
        $data['received_at'] = now();

        $job = JobCard::create($data);

        // Mark inward as used
        $inward->update(['job_created' => true]);

        return redirect()->route('job_cards.index')
            ->with('success', 'Job card created successfully.');
    }

    /**
     * Display the specified job card.
     */
    public function show(JobCard $jobCard)
    {
        $this->authorize('view', $jobCard);

        $jobCard->load(['serviceInward.contact', 'status', 'contact',  'user', 'entryBy']);

        return Inertia::render('JobCards/Show', [
            'job' => $jobCard,
            'can' => [
                'edit'   => Gate::allows('update', $jobCard),
                'delete' => Gate::allows('delete', $jobCard),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified job card.
     */
    public function edit(JobCard $jobCard)
    {
        $this->authorize('update', $jobCard);

        $jobCard->load(['serviceInward.contact', 'status', 'user', 'entryBy']);

        $statuses = ServiceStatus::all();
        $users    = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('JobCards/Edit', [
            'job'      => $jobCard,
            'statuses' => $statuses,
            'users'    => $users,
        ]);
    }

    /**
     * Update the specified job card.
     */
    public function update(Request $request, JobCard $jobCard)
    {
        $this->authorize('update', $jobCard);

        $data = $request->validate([
            'user_id'           => 'required|exists:users,id',
            'service_status_id' => 'nullable|exists:service_statuses,id',
            'diagnosis'         => 'nullable|string',
            'estimated_cost'    => 'nullable|numeric|min:0',
            'advance_paid'      => 'nullable|numeric|min:0',
            'final_bill'        => 'nullable|numeric|min:0',
            'delivered_at'      => 'nullable|date',
            'remarks'           => 'nullable|string|max:255',
            'spares_applied'    => 'nullable|string|max:255',
        ]);

        if (!$request->filled('service_status_id')) {
            $data['service_status_id'] = 1; // Default: Open / In Progress
        }

        // DO NOT overwrite entry_by – it should remain the original creator
        $jobCard->update($data);

        return redirect()->route('job_cards.index')
            ->with('success', 'Job card updated successfully.');
    }

    /**
     * Remove the specified job card (soft delete).
     */
    public function destroy(JobCard $jobCard)
    {
        $this->authorize('delete', $jobCard);

        $jobCard->delete();

        return back()->with('success', 'Job card moved to trash.');
    }

    /**
     * Restore a soft-deleted job card.
     */
    public function restore($id)
    {
        $job = JobCard::withTrashed()->findOrFail($id);
        $this->authorize('restore', $job);

        $job->restore();

        return back()->with('success', 'Job card restored.');
    }

    /**
     * Permanently delete a job card.
     */
    public function forceDelete($id)
    {
        $job = JobCard::withTrashed()->findOrFail($id);
        $this->authorize('delete', $job);

        $job->forceDelete();

        return back()->with('success', 'Job card permanently deleted.');
    }

    /**
     * Display trashed job cards.
     */
    public function trash()
    {
        $this->authorize('viewAny', JobCard::class);

        $jobs = JobCard::onlyTrashed()
            ->with(['serviceInward.contact', 'status', 'user', 'entryBy'])
            ->paginate(10);

        return Inertia::render('JobCards/Trash', ['jobs' => $jobs]);
    }

    public function byContact($contactId)
    {
        $jobs = JobCard::where('contact_id', $contactId)
            ->with([
                'serviceInward:id,rma',
                'status:id,name',
                'user:id,name',
            ])
            ->latest('received_at')
            ->get();

        return response()->json($jobs);
    }

}
