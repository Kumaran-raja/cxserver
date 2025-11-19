<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class MessagingController extends Controller
{
    public function channel()
    {
        return Inertia::render('Messaging/ChatChannel');
    }
}
