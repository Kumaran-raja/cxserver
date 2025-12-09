<?php

namespace App\Http\Controllers;

use App\Models\CallLog;
use App\Models\CallLogNote;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CallLogController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', CallLog::class);

        $perPage = (int)$request->input('per_page', 100);
        $perPage = in_array($perPage, [10, 25, 50, 100, 200]) ? $perPage : 100;

        $query = CallLog::with(['contact', 'handler'])
            ->when($request->filled('search'), fn($q) => $q->where(function ($q) use ($request) {
                $search = $request->search;
                $q->where('mobile', 'like', "%{$search}%")
                    ->orWhere('enquiry', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn($cq) => $cq->where('name', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%"));
            }))
            ->when($request->filled('date_from'), fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn($q) => $q->whereDate('created_at', '<=', $request->date_to));

        $callLogs = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('CallLogs/Index', [
            'call_logs' => $callLogs,
            'filters' => $request->only(['search', 'date_from', 'date_to', 'per_page']),
            'can' => [
                'create' => Gate::allows('create', CallLog::class),
                'delete' => Gate::allows('delete', CallLog::class),
            ],
            'trashedCount' => CallLog::onlyTrashed()->count(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', CallLog::class);

        $contacts = Contact::active()->orderBy('name')->get(['id', 'name', 'company', 'mobile']);

        $users = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('CallLogs/Create', [
            'contacts' => $contacts,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', CallLog::class);

        $data = $request->validate([
            'mobile' => 'required|string|max:20',
            'contact_id' => 'nullable|exists:contacts,id',
            'call_type' => 'required|in:incoming,outgoing',
            'duration' => 'nullable|integer|min:0',
            'enquiry' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        // If no contact_id, create new contact
        if (empty($data['contact_id'])) {
            $contact = Contact::create([
                'mobile' => $data['mobile'],
                'name' => $request->input('new_contact_name', 'Unknown'),
                // Add other default fields as needed
            ]);
            $data['contact_id'] = $contact->id;
        }

        CallLog::create($data);

        return redirect()->route('calls.index')->with('success', 'Call log created.');
    }

    public function show(CallLog $callLog)
    {
        $this->authorize('view', $callLog);

        $callLog->load(['contact', 'handler', 'notes.user', 'notes.children.user']);

        return Inertia::render('CallLogs/Show', [
            'call_log' => $callLog,
            'notes' => $callLog->notes, // For chat notes
            'can' => [
                'edit' => Gate::allows('update', $callLog),
                'delete' => Gate::allows('delete', $callLog),
            ],
        ]);
    }

    public function edit(CallLog $callLog)
    {
        $this->authorize('update', $callLog);

        $contacts = Contact::active()->orderBy('name')->get(['id', 'name', 'company', 'mobile']);
        $users = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('CallLogs/Edit', [
            'call_log' => $callLog,
            'contacts' => $contacts,
            'users' => $users,
        ]);
    }

    public function update(Request $request, CallLog $callLog)
    {
        $this->authorize('update', $callLog);

        $data = $request->validate([
            'mobile' => 'required|string|max:20',
            'contact_id' => 'required|exists:contacts,id',
            'call_type' => 'required|in:incoming,outgoing',
            'duration' => 'nullable|integer|min:0',
            'enquiry' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $callLog->update($data);

        return redirect()->route('calls.index')->with('success', 'Call log updated.');
    }

    public function destroy(CallLog $callLog)
    {
        $this->authorize('delete', $callLog);
        $callLog->delete();

        return redirect()->route('calls.index')->with('success', 'Call log moved to trash.');
    }

    public function restore($id)
    {
        $callLog = CallLog::withTrashed()->findOrFail($id);
        $this->authorize('restore', $callLog);
        $callLog->restore();

        return redirect()->route('calls.index')->with('success', 'Call log restored.');
    }

    public function trash()
    {
        $this->authorize('viewAny', CallLog::class);

        $callLogs = CallLog::onlyTrashed()
            ->with(['contact', 'handler'])
            ->paginate(10);

        return Inertia::render('CallLogs/Trash', ['call_logs' => $callLogs]);
    }

    public function forceDelete($id)
    {
        $callLog = CallLog::withTrashed()->findOrFail($id);
        $this->authorize('delete', $callLog);
        $callLog->forceDelete();

        return redirect()->route('calls.index')->with('success', 'Call log permanently deleted.');
    }

    public function search(Request $request)
    {
        $q = $request->query('q', '');
        if (strlen($q) < 2) {
            return response()->json(['call_logs' => []]);
        }

        $callLogs = CallLog::with('contact')
            ->where(function ($query) use ($q) {
                $query->where('mobile', 'like', "%{$q}%")
                    ->orWhereHas('contact', function ($cq) use ($q) {
                        $cq->where('name', 'like', "%{$q}%")
                            ->orWhere('mobile', 'like', "%{$q}%");
                    });
            })
            ->limit(10)
            ->get(['id', 'mobile', 'call_type', 'contact_id']);

        return response()->json(['call_logs' => $callLogs]);
    }

    // Additional method to fetch contact history
    public function contactHistory(Request $request, $contactId)
    {
        // Fetch history: service inwards, job cards, etc.
        $contact = Contact::findOrFail($contactId);
        $history = [
            'service_inwards' => $contact->serviceInwards()->get(),
            'job_cards' => $contact->jobCards()->get(), // Assuming relationships
            // Add more: on-site calls, engineer assignments, reports, material status, payments, etc.
        ];

        return Inertia::render('CallLogs/Trash', [
            'contact' => $contact,
            'history' => $history
        ]);
    }

    public function quickStore(Request $request)
    {
        $request->validate([
            'contact_id' => 'required|exists:contacts,id',
        ]);

        $callLog = CallLog::create([
            'contact_id' => $request->contact_id,
            'mobile'     => Contact::find($request->contact_id)->mobile ?? '',
            'call_type'  => 'incoming',
            'enquiry'    => null,
            'user_id'    => auth()->id(),
        ]);

        return back()->with([
            'created_id' => $callLog->id,
        ]);
    }


    public function updateEnquiry(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:call_logs,id',
            'enquiry' => 'required|string',
        ]);

        $call = CallLog::find($request->id);
        $call->enquiry = $request->enquiry;
        $call->save();

        return back(); // ✅ Important: Inertia expects this
    }


}
