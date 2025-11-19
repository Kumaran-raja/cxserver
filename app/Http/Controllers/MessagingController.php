<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

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
}
