<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ServiceInward;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceInwardController extends Controller
{
    use AuthorizesRequests;

    /** --------------------------------------------------------------
     *  INDEX – list with search & pagination
     *  -------------------------------------------------------------- */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ServiceInward::class);

        $perPage = (int)$request->input('per_page', 100);
        $perPage = in_array($perPage, [10, 25, 50, 100, 200]) ? $perPage : 100;

        $query = ServiceInward::with(['contact', 'receiver'])
            ->select('service_inwards.*')
            ->addSelect([
                // Extract base RMA (before dot)
                DB::raw('CAST(SUBSTRING_INDEX(rma, ".", 1) AS UNSIGNED) as base_rma'),
                // Extract sub-item (after dot), default 0 if no dot
                DB::raw('
                CASE
                    WHEN LOCATE(".", rma) > 0
                    THEN CAST(SUBSTRING(rma, LOCATE(".", rma) + 1) AS DECIMAL(10,2))
                    ELSE 0
                END as sub_item
            ')
            ])
            ->when($request->filled('search'), fn($q) => $q->where(function ($q) use ($request) {
                $search = $request->search;
                $q->where('rma', 'like', "%{$search}%")
                    ->orWhere('serial_no', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn($cq) => $cq->where('name', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%"));
            }))
            ->when($request->job_filter === 'yes', fn($q) => $q->where('job_created', true))
            ->when($request->job_filter === 'no', fn($q) => $q->where('job_created', false))
            ->when($request->type_filter && $request->type_filter !== 'all', fn($q) => $q->where('material_type', $request->type_filter))
            ->when($request->filled('date_from'), fn($q) => $q->whereDate('received_date', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn($q) => $q->whereDate('received_date', '<=', $request->date_to));

        // Replace ->latest() with custom order
        $inwards = $query
            ->orderByDesc('base_rma')
            ->orderByDesc('sub_item')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('ServiceInwards/Index', [
            'inwards' => $inwards,
            'filters' => $request->only(['search', 'job_filter', 'type_filter', 'date_from', 'date_to', 'per_page']),
            'can' => [
                'create' => Gate::allows('create', ServiceInward::class),
                'delete' => Gate::allows('delete', ServiceInward::class),
            ],
            'trashedCount' => ServiceInward::onlyTrashed()->count(),
        ]);
    }

    /** --------------------------------------------------------------
     *  CREATE – form
     *  -------------------------------------------------------------- */
    public function create()
    {
        $this->authorize('create', ServiceInward::class);

        $contacts = Contact::active()
            ->orderBy('name')
            ->get(['id', 'name', 'company']);

        $users = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('ServiceInwards/Create', [
            'contacts' => $contacts,
            'users' => $users
        ]);
    }

    /** --------------------------------------------------------------
     *  STORE – validation + persist
     *  -------------------------------------------------------------- */
    public function store(Request $request)
    {
        $this->authorize('create', ServiceInward::class);

        $data = $request->validate([
            'rma' => [
                'required',
                'string',
                'unique:service_inwards,rma',
                'regex:/^[1-9]\d*(\.\d+)?$/',
                function ($attribute, $value, $fail) {
                    if (!preg_match('/^\d+\.\d+$/', $value)) {
                        $fail('RMA must be in format: <number>.<number> (e.g., 12700.1)');
                    }
                },
            ],
            'contact_id' => 'required|exists:contacts,id',
            'material_type' => 'required|in:laptop,desktop,printer',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_no' => 'nullable|string|unique:service_inwards,serial_no',
            'passwords' => 'nullable|string',
            'photo_url' => 'nullable|url',
            'observation' => 'nullable|string',
            'received_by' => 'nullable|exists:users,id',
            'received_date' => 'nullable|date',
        ]);

        // ← ADD THIS
        preg_match('/^(\d+)\.(\d+(?:\.\d+)?)$/', $data['rma'], $matches);
        $data['base_rma'] = (int)$matches[1];
        $data['sub_item'] = (float)$matches[2];

// Fallback if regex fails
        if (!$matches) {
            $data['base_rma'] = (int)$data['rma'];
            $data['sub_item'] = 0;
        }

        // ← CHANGE: only fallback to logged-in user if not provided
        $data['received_by'] = $request->filled('received_by') ? $request->received_by : auth()->id();

        ServiceInward::create($data);

        return redirect()->route('service_inwards.index')
            ->with('success', 'Service inward created.');
    }

    /** --------------------------------------------------------------
     *  SHOW – detail page
     *  -------------------------------------------------------------- */
// In ServiceInwardController.php

    public function show(ServiceInward $serviceInward, Request $request)
    {
        $this->authorize('view', $serviceInward);

        // Eager load contact, receiver, and notes with user + replies
        $serviceInward->load(['contact', 'receiver']);

        $notes = $serviceInward->notes()
            ->with(['user:id,name'])
            ->whereNull('parent_id')
            ->orderBy('created_at')
            ->get()
            ->map(function ($note) {
                // Ensure replies is always a collection (never null)
                $note->setRelation('replies', $note->replies ?? collect());
                return $note;
            });

        return Inertia::render('ServiceInwards/Show', [
            'inward' => $serviceInward,
            'notes' => $notes, // Always loaded
            'can' => [
                'edit' => Gate::allows('update', $serviceInward),
                'delete' => Gate::allows('delete', $serviceInward),
            ],
        ]);
    }

    /** --------------------------------------------------------------
     *  EDIT – form
     *  -------------------------------------------------------------- */
    public function edit(ServiceInward $serviceInward)
    {
        $this->authorize('update', $serviceInward);

        $contacts = Contact::active()
            ->orderBy('name')
            ->get(['id', 'name', 'company']);

        $users = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('ServiceInwards/Edit', [
            'inward' => $serviceInward,
            'contacts' => $contacts,
            'users' => $users
        ]);
    }

    /** --------------------------------------------------------------
     *  UPDATE – validation + persist
     *  -------------------------------------------------------------- */
    public function update(Request $request, ServiceInward $serviceInward)
    {
        $this->authorize('update', $serviceInward);

        $data = $request->validate([
            'rma' => [
                'required',
                'string',
                'unique:service_inwards,rma,' . $serviceInward->id,
                'regex:/^[1-9]\d*(\.\d+)?$/',
                function ($attribute, $value, $fail) {
                    if (!preg_match('/^\d+\.\d+$/', $value)) {
                        $fail('RMA must be in format: <number>.<number> (e.g., 12700.1)');
                    }
                },
            ],
            'contact_id' => 'required|exists:contacts,id',
            'material_type' => 'required|in:laptop,desktop,printer',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_no' => 'nullable|string|unique:service_inwards,serial_no,' . $serviceInward->id,
            'passwords' => 'nullable|string',
            'photo_url' => 'nullable|url',
            'observation' => 'nullable|string',
            'received_by' => 'nullable|exists:users,id',
            'received_date' => 'nullable|date',
        ]);

        preg_match('/^(\d+)\.(\d+(?:\.\d+)?)$/', $data['rma'], $matches);
        $data['base_rma'] = (int)$matches[1];
        $data['sub_item'] = (float)$matches[2];

        if (!$matches) {
            $data['base_rma'] = (int)$data['rma'];
            $data['sub_item'] = 0;
        }

        // ← CHANGE: keep existing if empty, otherwise update
        if ($request->filled('received_by')) {
            $data['received_by'] = $request->received_by;
        }

        $serviceInward->update($data);

        return redirect()->route('service_inwards.index')
            ->with('success', 'Service inward updated.');
    }

    /** --------------------------------------------------------------
     *  DESTROY – soft-delete
     *  -------------------------------------------------------------- */
    public function destroy(ServiceInward $serviceInward)
    {
        $this->authorize('delete', $serviceInward);
        $serviceInward->delete();

//        return back()->with('success', 'Service inward moved to trash.');

        return redirect()->route('service_parts.index')
            ->with('success', 'Service inward moved to trash.');
    }

    /** --------------------------------------------------------------
     *  RESTORE – from trash
     *  -------------------------------------------------------------- */
    public function restore($id)
    {
        $inward = ServiceInward::withTrashed()->findOrFail($id);
        $this->authorize('restore', $inward);
        $inward->restore();

//        return back()->with('success', 'Service inward restored.');
        return redirect()->route('service_parts.index')
            ->with('success', 'Service inward restored.');
    }

    /** --------------------------------------------------------------
     *  TRASH – list deleted records
     *  -------------------------------------------------------------- */
    public function trash()
    {
        $this->authorize('viewAny', ServiceInward::class);

        $inwards = ServiceInward::onlyTrashed()
            ->with(['contact', 'receiver'])
            ->select('service_inwards.*')
            ->paginate(10);

        return Inertia::render('ServiceInwards/Trash', ['inwards' => $inwards]);
    }

    /** --------------------------------------------------------------
     *  FORCE DELETE – permanent removal
     *  -------------------------------------------------------------- */
    public function forceDelete($id)
    {
        $inward = ServiceInward::withTrashed()->findOrFail($id);
        $this->authorize('delete', $inward);
        $inward->forceDelete();

//        return back()->with('success', 'Service inward permanently deleted.');
        return redirect()->route('service_parts.index')
            ->with('success', 'Service inward permanently deleted.');
    }

    /**
     * Return the next global RMA (e.g. 1000.1, 1000.2, …)
     */
    public function nextRma(Request $request)
    {
        // 1. Find the highest base RMA in the whole table
        $highestBase = ServiceInward::max(DB::raw('CAST(SUBSTRING_INDEX(rma, ".", 1) AS UNSIGNED)'));

        // If table is empty → start at 1000
        $base = $highestBase ? $highestBase + 1 : 1000;

        // 2. Find all sub-items that already use this base
        $usedSubs = ServiceInward::whereRaw('SUBSTRING_INDEX(rma, ".", 1) = ?', [$base])
            ->pluck(DB::raw('CAST(SUBSTRING_INDEX(rma, ".", -1) AS DECIMAL(10,2))'))
            ->toArray();

        // 3. Next free sub-item
        $sub = 1;
        while (in_array($sub, $usedSubs)) {
            $sub++;
        }

        $nextRma = "{$base}.{$sub}";

        // Return as JSON for Inertia (props)
        return inertia()->render('ServiceInwards/Create', [
            'nextRma' => $nextRma,
            // keep the collections you already send
            'contacts' => Contact::active()->orderBy('name')->get(['id', 'name', 'company']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function search(Request $request)
    {
        $q = $request->query('q', '');
        if (strlen($q) < 2) {
            return response()->json(['inwards' => []]);
        }

        $inwards = ServiceInward::with('contact')
            ->where('job_created', false)
            ->where(function ($query) use ($q) {
                $query->where('rma', 'like', "%{$q}%")
                    ->orWhere('serial_no', 'like', "%{$q}%")
                    ->orWhereHas('contact', function ($cq) use ($q) {
                        $cq->where('name', 'like', "%{$q}%")
                            ->orWhere('mobile', 'like', "%{$q}%");
                    });
            })
            ->limit(10)
            ->get(['id', 'rma', 'material_type', 'serial_no', 'contact_id']);

        return response()->json(['inwards' => $inwards]);
    }

    public function byContact(Contact $contact)
    {
        $inwards = ServiceInward::with(['contact', 'receiver'])
            ->where('contact_id', $contact->id)
            ->latest()
            ->get();

        return response()->json($inwards);
    }


}
