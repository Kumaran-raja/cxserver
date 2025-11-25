<?php

// app/Http/Controllers/ContactController.php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ContactType;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    use AuthorizesRequests;

// app/Http/Controllers/ContactController.php

    public function index(Request $request)
    {
        $this->authorize('viewAny', Contact::class);

        // ──────────────────────────────────────────────────────────────
        // FILTERS
        // ──────────────────────────────────────────────────────────────
        $search = $request->input('search');
        $typeId = $request->input('contact_type_id');
        $activeFilter = $request->input('active_filter', 'all'); // 'all', 'yes', 'no'
        $perPage = (int) $request->input('per_page', 50);
        $perPage = in_array($perPage, [10, 25, 50, 100, 200]) ? $perPage : 50;

        $query = Contact::with(['contactType', 'user'])
            ->when($search, function ($q, $term) {
                $q->where(function ($q) use ($term) {
                    $q->where('name', 'like', "%{$term}%")
                        ->orWhere('mobile', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%")
                        ->orWhere('company', 'like', "%{$term}%");
                });
            })
            ->when($typeId && $typeId !== 'all', fn($q) => $q->where('contact_type_id', $typeId))
            ->when($activeFilter === 'yes', fn($q) => $q->where('active', true))
            ->when($activeFilter === 'no', fn($q) => $q->where('active', false))
            ->latest();

        $contacts = $query->paginate($perPage)->withQueryString();

        $contactTypes = ContactType::orderBy('name')->get();

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
            'contactTypes' => $contactTypes,
            'filters' => [
                'search' => $search ?? '',
                'contact_type_id' => $typeId ?? 'all',
                'active_filter' => $activeFilter,
                'per_page' => (string) $perPage,
            ],
            'can' => [
                'create' => auth()->user()->hasPermissionTo('contact.create'),
                'delete' => auth()->user()->hasPermissionTo('contact.delete'),
            ],
            'trashedCount' => Contact::onlyTrashed()->count(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Contact::class);
        $contactTypes = ContactType::orderBy('name')->get();

        return Inertia::render('Contacts/Create', [
            'contactTypes' => $contactTypes,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Contact::class);

//        dd($request->all());

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|unique:contacts,mobile',
            'email' => 'nullable|email|unique:contacts,email',
            'phone' => 'nullable|string',
            'company' => 'nullable|string',
            'has_web_access' => 'boolean',
            'active' => 'boolean',
            'contact_type_id' => 'required|exists:contact_types,id',
        ]);

        $data['user_id'] = auth()->id();
        $data['has_web_access'] = $data['has_web_access'] ?? false;
        $data['active'] = $data['active'] ?? true;

        Contact::create($data);

        return redirect()->route('contacts.index')->with('success', 'Contact created.');
    }

    public function show(Contact $contact)
    {
        $this->authorize('view', $contact);

        $contact->load(['contactType', 'user']);

        return Inertia::render('Contacts/Show', [
            'contact' => $contact,
            'can' => [
                'edit' => auth()->user()->can('update', $contact),
                'delete' => auth()->user()->can('delete', $contact),
            ],
        ]);
    }

    public function edit(Contact $contact)
    {
        $this->authorize('update', $contact);
        $contactTypes = ContactType::orderBy('name')->get();

        return Inertia::render('Contacts/Edit', [
            'contact' => $contact,
            'contactTypes' => $contactTypes,
        ]);
    }

    public function update(Request $request, Contact $contact)
    {
        $this->authorize('update', $contact);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|unique:contacts,mobile,' . $contact->id,
            'email' => 'nullable|email|unique:contacts,email,' . $contact->id,
            'phone' => 'nullable|string',
            'company' => 'nullable|string',
            'has_web_access' => 'boolean',
            'active' => 'boolean',
            'contact_type_id' => 'required|exists:contact_types,id',
        ]);

        $contact->update($data);

        return redirect()->route('contacts.index')->with('success', 'Contact updated.');
    }

    public function destroy(Contact $contact)
    {
        $this->authorize('delete', $contact);
        $contact->delete();
        return back()->with('success', 'Contact moved to trash.');
    }

    public function restore($id)
    {
        $contact = Contact::withTrashed()->findOrFail($id);
        $this->authorize('restore', $contact);
        $contact->restore();
        return back()->with('success', 'Contact restored.');
    }

    public function trash()
    {
        $this->authorize('viewAny', Contact::class);
        $contacts = Contact::onlyTrashed()->with(['contactType', 'user'])->paginate(10);
        return Inertia::render('Contacts/Trash', ['contacts' => $contacts]);
    }

    public function forceDelete($id)
    {
        $contact = Contact::withTrashed()->findOrFail($id);
        $this->authorize('delete', $contact);
        $contact->forceDelete();
        return back()->with('success', 'Contact permanently deleted.');
    }
}
