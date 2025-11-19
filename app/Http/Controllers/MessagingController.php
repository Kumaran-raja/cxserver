<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ContactNote;
use Inertia\Inertia;
use Illuminate\Http\Request;

class MessagingController extends Controller
{
    public function channel()
    {
        return Inertia::render('Messaging/ChatChannel');


    }

    public function whatsappChannel()
    {
        // You can get these from config, database, tenant settings, etc.
        $mobile = '919876543210'; // ← Your support WhatsApp number (with country code, no +)
        $defaultText = 'Hello, I need help with my CODEXSUN ERP account.'; // Optional pre-filled text

        // Or from config
        // $mobile = config('services.whatsapp.support_number');
        // $defaultText = config('services.whatsapp.default_message');

        return Inertia::render('Messaging/WhatsAppChannel', [
            'mobile' => $mobile,
            'defaultText' => $defaultText,
        ]);
    }

    public function whatsappContacts(Request $request)
    {
        $selectedContactId = $request->query('contact_id');

        // FIX: Use ->get() first, then ->map() on the collection
        $contactsCollection = Contact::with('contactType')
            ->orderBy('name')
            ->get();

        $contacts = $contactsCollection->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'mobile' => $c->mobile,
                'company' => $c->company,
                'email' => $c->email,
                'contact_type' => [
                    'name' => $c->contactType?->name ?? 'General'
                ]
            ];
        })->toArray();

        // Chat History
        $chatHistory = [];
        if ($selectedContactId) {
            $chatHistory = ContactNote::where('contact_id', $selectedContactId)
                ->with('user:id,name')
                ->orderBy('sent_at')
                ->get()
                ->map(function ($note) {
                    return [
                        'id' => $note->id,
                        'message' => $note->message,
                        'type' => $note->type,
                        'sent_at' => $note->sent_at->toDateTimeString(),
                        'user_name' => $note->user?->name ?? 'You',
                    ];
                })->toArray();
        }

        return Inertia::render('Messaging/WhatsAppContacts', [
            'contacts' => $contacts,
            'defaultGreeting' => "Hello from CODEXSUN ERP!\nHow can we help you today?",
            'chatHistory' => $chatHistory,
            'selected_contact_id' => $selectedContactId ? (int)$selectedContactId : null,
        ]);
    }

    public function sendWhatsAppMessage(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'contact_id' => 'required|exists:contacts,id',
            'message'    => 'required|string|max:5000',
        ]);

        try {
            ContactNote::create([
                'contact_id'  => $request->contact_id,
                'user_id'     => auth()->id(),
                'channel'     => 'whatsapp',
                'type'        => 'outgoing',
                'message'     => $request->message,
                'attachments' => null,
                'sent_at'     => now(),
            ]);

            // SUCCESS: Return Inertia redirect with flash
            return back()->with('flash', [
                'type'    => 'success',
                'message' => 'Message sent and saved!'
            ]);

        } catch (\Exception $e) {
            \Log::error('WhatsApp Send Failed: ' . $e->getMessage());

            // ERROR: Return back with error flash
            return back()->with('flash', [
                'type'    => 'error',
                'message' => 'Failed to send message. Please try again.'
            ]);
        }
    }

    public function getChatHistory($contactId)
    {
        $notes = ContactNote::where('contact_id', $contactId)
            ->with('user:id,name')
            ->orderBy('sent_at')
            ->get()
            ->map(fn($note) => [
                'id' => $note->id,
                'message' => $note->message,
                'type' => $note->type, // outgoing / incoming
                'sent_at' => $note->sent_at->format('Y-m-d H:i:s'),
                'user_name' => $note->user?->name ?? 'System',
            ]);

        return response()->json(['history' => $notes]);
    }
}
