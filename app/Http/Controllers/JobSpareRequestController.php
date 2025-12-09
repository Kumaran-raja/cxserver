<?php

namespace App\Http\Controllers;

use App\Models\JobSpareRequest;
use App\Models\JobCard;
use App\Models\ServicePart;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class JobSpareRequestController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', JobSpareRequest::class);

        $perPage = $request->input('per_page', 50);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 50;

        $query = JobSpareRequest::with(['jobCard.serviceInward.contact', 'servicePart', 'requester'])
            ->when($request->filled('search'), fn($q) => $q->where(function ($sq) use ($request) {
                $search = $request->search;
                $sq->whereHas('jobCard', fn($j) => $j->where('job_no', 'like', "%{$search}%"))
                    ->orWhereHas('servicePart', fn($p) => $p->where('part_code', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%"))
                    ->orWhereHas('requester', fn($u) => $u->where('name', 'like', "%{$search}%"));
            }))
            ->when($request->status_filter && $request->status_filter !== 'all', fn($q) =>
            $q->where('status', $request->status_filter)
            )
            ->latest('requested_at');

        $requests = $query->paginate($perPage)->withQueryString();

        return Inertia::render('JobSpareRequests/Index', [
            'requests' => $requests,
            'filters' => $request->only(['search', 'status_filter', 'per_page']),
            'statuses' => [
                ['id' => 'pending', 'name' => 'Pending'],
                ['id' => 'issued', 'name' => 'Issued'],
                ['id' => 'customer_will_bring', 'name' => 'Customer Will Bring'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
            ],
            'can' => [
                'create' => Gate::allows('create', JobSpareRequest::class),
                'delete' => Gate::allows('delete', JobSpareRequest::class),
            ],
            'trashedCount' => JobSpareRequest::onlyTrashed()->count(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', JobSpareRequest::class);

        $jobCards = JobCard::with('serviceInward.contact')
            ->get(['id', 'job_no', 'service_inward_id']);


        $parts = ServicePart::where('current_stock', '>', 0)
            ->orderBy('part_code')
            ->get(['id', 'part_code', 'name', 'current_stock']);

        return Inertia::render('JobSpareRequests/Create', [
            'jobCards' => $jobCards,
            'parts' => $parts,
            'technicians' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', JobSpareRequest::class);

        $data = $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'service_part_id' => 'required|exists:service_parts,id',
            'qty_requested' => 'required|integer|min:1',
            'user_id' => 'required|exists:users,id',
            'remarks' => 'nullable|string',
        ]);

        $part = ServicePart::findOrFail($data['service_part_id']);
        if ($data['qty_requested'] > $part->current_stock) {
            return back()->withErrors(['qty_requested' => 'Requested quantity exceeds available stock.']);
        }

        $data['requested_at'] = now();

        JobSpareRequest::create($data);

        return redirect()->route('job_spare_requests.index')
            ->with('success', 'Spare request created.');
    }

    public function edit(JobSpareRequest $jobSpareRequest)
    {
        $this->authorize('update', $jobSpareRequest);

        $jobSpareRequest->load(['jobCard.serviceInward.contact', 'servicePart', 'requester']);

        return Inertia::render('JobSpareRequests/Edit', [
            'request' => $jobSpareRequest,
            'technicians' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, JobSpareRequest $jobSpareRequest)
    {
        $this->authorize('update', $jobSpareRequest);

        $data = $request->validate([
            'qty_requested' => 'required|integer|min:1',
            'qty_issued' => 'required|integer|min:0|lte:qty_requested',
            'status' => 'required|in:pending,issued,customer_will_bring,cancelled',
            'remarks' => 'nullable|string',
        ]);

        // Handle stock on issue
        if ($data['status'] === 'issued' && $jobSpareRequest->status !== 'issued') {
            $issueDiff = $data['qty_issued'] - $jobSpareRequest->qty_issued;
            if ($issueDiff > 0) {
                $part = $jobSpareRequest->servicePart;
                if ($issueDiff > $part->current_stock) {
                    return back()->withErrors(['qty_issued' => 'Not enough stock to issue.']);
                }
                $part->decrement('current_stock', $issueDiff);
            }
        }

        $jobSpareRequest->update($data);

        return redirect()->route('job_spare_requests.index')
            ->with('success', 'Spare request updated.');
    }

    public function destroy(JobSpareRequest $jobSpareRequest)
    {
        $this->authorize('delete', $jobSpareRequest);
        $jobSpareRequest->delete();
        return back()->with('success', 'Request moved to trash.');
    }

    public function restore($id)
    {
        $req = JobSpareRequest::withTrashed()->findOrFail($id);
        $this->authorize('restore', $req);
        $req->restore();
        return back()->with('success', 'Request restored.');
    }

    public function forceDelete($id)
    {
        $req = JobSpareRequest::withTrashed()->findOrFail($id);
        $this->authorize('delete', $req);
        $req->forceDelete();
        return back()->with('success', 'Request permanently deleted.');
    }

    public function trash()
    {
        $this->authorize('viewAny', JobSpareRequest::class);

        $requests = JobSpareRequest::onlyTrashed()
            ->with(['jobCard', 'servicePart', 'requester'])
            ->paginate(50);

        return Inertia::render('JobSpareRequests/Trash', ['requests' => $requests]);
    }
}
