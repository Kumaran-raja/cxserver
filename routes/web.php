<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\CallLogController;
use App\Http\Controllers\CallLogNoteController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContactSearchController;
use App\Http\Controllers\ContactTypeController;
use App\Http\Controllers\EnquiryController;
use App\Http\Controllers\JobAssignmentController;
use App\Http\Controllers\JobCardController;
use App\Http\Controllers\JobCardSearchController;
use App\Http\Controllers\JobSpareRequestController;
use App\Http\Controllers\OutServiceCenterController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ReadyForDeliveryController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ServiceInwardController;
use App\Http\Controllers\ServiceInwardNoteController;
use App\Http\Controllers\ServicePartController;
use App\Http\Controllers\ServicePartImageController;
use App\Http\Controllers\ServiceStatusController;
use App\Http\Controllers\SystemManagerController;

//use App\Http\Controllers\UserSearchController;
use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');


Route::get('/abouts', function () {
    return Inertia::render('web/About');
})->name('abouts');

Route::get('/web-services', function () {
    return Inertia::render('web/Service');
})->name('web-services');

Route::get('/web-contacts', function () {
    return Inertia::render('web/web-contact');
})->name('web-contacts');


Route::middleware(['auth', 'verified'])->group(function () {
//    Route::get('dashboard', function () {
//        return Inertia::render('dashboard');
//    })->name('dashboard');

    Route::get('/dashboard', \App\Http\Controllers\DashboardController::class)
        ->name('dashboard');
});

require __DIR__ . '/settings.php';

Route::middleware(['auth', 'verified', 'role:super-admin'])->group(function () {
    Route::prefix('blogs')->name('blogs.')->group(function () {
        Route::get('/', [BlogController::class, 'index'])->name('index');
        Route::get('blogs/{blog:slug}', [BlogController::class, 'show'])->name('show');
        Route::get('/create', [BlogController::class, 'create'])->name('create');
        Route::post('/', [BlogController::class, 'store'])->name('store');
        Route::get('/{blog}/edit', [BlogController::class, 'edit'])->name('edit');
        Route::match(['put', 'patch'], '/{blog}', [BlogController::class, 'update'])
            ->name('update');
        Route::delete('/{blog}', [BlogController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/restore', [BlogController::class, 'restore'])->name('restore');
        Route::get('/trash', [BlogController::class, 'trash'])->name('trash');
        Route::delete('{id}/force-delete', [BlogController::class, 'forceDelete'])
            ->name('forceDelete');
    });
});


Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/contacts/search', ContactSearchController::class)
        ->name('contacts.search');

    // Contact Types
    Route::resource('contact-types', ContactTypeController::class)->except(['show']);
    Route::get('contact-types/trash', [ContactTypeController::class, 'trash'])->name('contact-types.trash');
    Route::post('contact-types/{id}/restore', [ContactTypeController::class, 'restore'])->name('contact-types.restore');
    Route::delete('contact-types/{id}/force', [ContactTypeController::class, 'forceDelete'])->name('contact-types.forceDelete');

    // Contacts
    Route::resource('contacts', ContactController::class);
    Route::get('contacts/trash', [ContactController::class, 'trash'])->name('contacts.trash');
    Route::post('contacts/{id}/restore', [ContactController::class, 'restore'])->name('contacts.restore');
    Route::delete('contacts/{id}/force', [ContactController::class, 'forceDelete'])->name('contacts.forceDelete');
});


Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('service_inwards', ServiceInwardController::class)
        ->names('service_inwards');

    Route::post('service_inwards/{id}/restore', [ServiceInwardController::class, 'restore'])
        ->name('service_inwards.restore');

    Route::delete('service_inwards/{id}/force', [ServiceInwardController::class, 'forceDelete'])
        ->name('service_inwards.forceDelete');

    Route::get('service_inwards/trash', [ServiceInwardController::class, 'trash'])
        ->name('service_inwards.trash');

    Route::get('/test-inertia', function () {
        return Inertia::render('ServiceInwards/Trash', [
            'inwards' => ['data' => [], 'current_page' => 1, 'last_page' => 1, 'total' => 0]
        ]);
    })->name('test.inertia');

    Route::get('/service-inwards/next-rma', [ServiceInwardController::class, 'nextRma'])
        ->name('service_inwards.nextRma');

    Route::get('/service-inwards/search', [App\Http\Controllers\ServiceInwardController::class, 'search'])
        ->name('service_inwards.search');

});


Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('job_cards', JobCardController::class)->names('job_cards');

    Route::get('/jobcards/search', JobCardSearchController::class)->name('jobcards.search');

    Route::get('job_cards/trash', [JobCardController::class, 'trash'])
        ->name('job_cards.trash');

    Route::post('job_cards/{id}/restore', [JobCardController::class, 'restore'])
        ->name('job_cards.restore');

    Route::delete('job_cards/{id}/force', [JobCardController::class, 'forceDelete'])
        ->name('job_cards.forceDelete');

    Route::resource('service_statuses', ServiceStatusController::class)
        ->names('service_statuses');
});

Route::middleware(['auth', 'verified'])
    ->prefix('users')
    ->name('users.')
    ->group(function () {

        Route::get('/', [App\Http\Controllers\UserController::class, 'index'])
            ->name('index');

        Route::get('create', [App\Http\Controllers\UserController::class, 'create'])
            ->name('create');
        Route::post('/', [App\Http\Controllers\UserController::class, 'store'])
            ->name('store');

        Route::get('{user}', [App\Http\Controllers\UserController::class, 'show'])
            ->name('show');

        Route::get('{user}/edit', [App\Http\Controllers\UserController::class, 'edit'])
            ->name('edit');
        Route::match(['put', 'patch'], '{user}', [App\Http\Controllers\UserController::class, 'update'])
            ->name('update');

        Route::delete('{user}', [App\Http\Controllers\UserController::class, 'destroy'])
            ->name('destroy');

        // Trash
        Route::get('trash', [App\Http\Controllers\UserController::class, 'trash'])
            ->name('trash');
        Route::post('{id}/restore', [App\Http\Controllers\UserController::class, 'restore'])
            ->name('restore');
        Route::delete('{id}/force', [App\Http\Controllers\UserController::class, 'forceDelete'])
            ->name('forceDelete');

    });

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('job_assignments', JobAssignmentController::class)->except(['show']);

    Route::get('job_assignments/kanban', [JobAssignmentController::class, 'kanban'])->name('job_assignments.kanban');
    Route::patch('job_assignments/{assignment}/position', [JobAssignmentController::class, 'updatePosition'])->name('job_assignments.position');

    Route::get('job_assignments/{assignment}/service', [JobAssignmentController::class, 'service'])->name('job_assignments.service');
    Route::post('job_assignments/{assignment}/start_service', [JobAssignmentController::class, 'startService'])->name('job_assignments.start_service');
    Route::post('job_assignments/{assignment}/complete_service', [JobAssignmentController::class, 'completeService'])->name('job_assignments.complete_service');
    Route::post('job_assignments/{assignment}/ready', [JobAssignmentController::class, 'readyForDelivery'])->name('job_assignments.ready');

    Route::post('job_assignments/{assignment}/generateOtp', [JobAssignmentController::class, 'generateOtp'])->name('job_assignments.generateOtp');
    Route::get('job_assignments/{assignment}/deliver', [JobAssignmentController::class, 'deliver'])->name('job_assignments.deliver');

    Route::post('job_assignments/{assignment}/confirm', [JobAssignmentController::class, 'confirmDelivery'])->name('job_assignments.confirm');

    Route::post('job-assignments/{jobAssignment}/confirm-delivery', [JobAssignmentController::class, 'confirmDelivery'])
        ->name('job_assignments.confirmDelivery');

    Route::get('job_assignments/{assignment}/close', [JobAssignmentController::class, 'adminClose'])->name('job_assignments.close');
    Route::post('job_assignments/{assignment}/audit', [JobAssignmentController::class, 'audit'])->name('job_assignments.audit');
    Route::post('job_assignments/{assignment}/close_admin', [JobAssignmentController::class, 'closeByAdmin'])->name('job_assignments.close_admin');

    Route::get('job_assignments/{assignment}', [JobAssignmentController::class, 'show'])->name('job_assignments.show');
});


Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('service_parts', ServicePartController::class)
        ->except(['show']);

    Route::post('service_parts/{id}/restore', [ServicePartController::class, 'restore'])
        ->name('service_parts.restore');

    Route::delete('service_parts/{id}/forceDelete', [ServicePartController::class, 'forceDelete'])
        ->name('service_parts.forceDelete');

    Route::get('service_parts/trash', [ServicePartController::class, 'trash'])
        ->name('service_parts.trash');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('job_spare_requests', JobSpareRequestController::class)
        ->except(['show']);

    Route::post('job_spare_requests/{id}/restore', [JobSpareRequestController::class, 'restore'])
        ->name('job_spare_requests.restore');

    Route::delete('job_spare_requests/{id}/forceDelete', [JobSpareRequestController::class, 'forceDelete'])
        ->name('job_spare_requests.forceDelete');

    Route::get('job_spare_requests/trash', [JobSpareRequestController::class, 'trash'])
        ->name('job_spare_requests.trash');
});

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Image actions ─────────────────────────────────────
    Route::post('service_parts/{servicePart}/images', [ServicePartImageController::class, 'store'])
        ->name('service_parts.images.store');

    Route::post('service_parts/{servicePart}/images/primary/{image}', [ServicePartImageController::class, 'setPrimary'])
        ->name('service_parts.images.primary');

    Route::delete('service_parts/images/{image}', [ServicePartImageController::class, 'destroy'])
        ->name('service_parts.images.destroy');

    Route::post('service_parts/{servicePart}/images/reorder', [ServicePartImageController::class, 'reorder'])
        ->name('service_parts.images.reorder');

    // ── Service-Part CRUD ─────────────────────────────────
    Route::resource('service_parts', ServicePartController::class)->except(['show']);

    Route::get('service_parts/{servicePart}', [ServicePartController::class, 'show'])
        ->name('service_parts.show');
});


// ==================================================================
// ROLES – Full Featured CRUD + Trash Management
// ==================================================================
Route::prefix('roles')->name('roles.')->group(function () {
    // List + Search + Pagination
    Route::get('/', [RoleController::class, 'index'])->name('index');

    // Create
    Route::get('/create', [RoleController::class, 'create'])->name('create');
    Route::post('/', [RoleController::class, 'store'])->name('store');

    // Show (View Details)
    Route::get('/{role}', [RoleController::class, 'show'])->name('show');

    // Edit
    Route::get('/{role}/edit', [RoleController::class, 'edit'])->name('edit');
    Route::patch('/{role}', [RoleController::class, 'update'])->name('update');
    // OR: Route::put('/{role}', [RoleController::class, 'update'])->name('update');

    // Soft Delete
    Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');

    // Trash List
    Route::get('/trash', [RoleController::class, 'trash'])->name('trash');

    // Restore (uses POST to avoid GET side effects)
    Route::post('/{id}/restore', [RoleController::class, 'restore'])->name('restore');

    // Force Delete (permanent)
    Route::delete('/{id}/force-delete', [RoleController::class, 'forceDelete'])
        ->name('forceDelete');
});

// ==================================================================
// PERMISSIONS – Full Featured CRUD + Trash Management
// ==================================================================
Route::prefix('permissions')->name('permissions.')->group(function () {
    // List + Search + Pagination
    Route::get('/', [PermissionController::class, 'index'])->name('index');

    // Create
    Route::get('/create', [PermissionController::class, 'create'])->name('create');
    Route::post('/', [PermissionController::class, 'store'])->name('store');

    // Show (View Details)
    Route::get('/{permission}', [PermissionController::class, 'show'])->name('show');

    // Edit
    Route::get('/{permission}/edit', [PermissionController::class, 'edit'])->name('edit');
    Route::patch('/{permission}', [PermissionController::class, 'update'])->name('update');
    // OR: Route::put('/{permission}', [PermissionController::class, 'update'])->name('update');

    // Soft Delete
    Route::delete('/{permission}', [PermissionController::class, 'destroy'])->name('destroy');

    // Trash List
    Route::get('/trash', [PermissionController::class, 'trash'])->name('trash');

    // Restore
    Route::post('/{id}/restore', [PermissionController::class, 'restore'])->name('restore');

    // Force Delete
    Route::delete('/{id}/force-delete', [PermissionController::class, 'forceDelete'])
        ->name('forceDelete');
});


Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/system-manager', function () {
        return Inertia::render('SystemManager/Index', [
            'output' => '',
            'can' => ['manage' => auth()->user()->can('system.manage')],
        ]);
    })->name('system.manager');

    Route::post('/system-manager/command', [SystemManagerController::class, 'run'])
        ->name('system.manager.command');
});


Route::middleware(['auth', 'verified'])->group(function () {

    // ── Out Service Center CRUD ─────────────────────────────
    Route::resource('out_service_centers', OutServiceCenterController::class)->except(['show']);
    Route::get('out_service_centers/{outServiceCenter}', [OutServiceCenterController::class, 'show'])
        ->name('out_service_centers.show');

    // Trash & restore
    Route::get('out_service_centers/trash', [OutServiceCenterController::class, 'trash'])
        ->name('out_service_centers.trash');
    Route::post('out_service_centers/{id}/restore', [OutServiceCenterController::class, 'restore'])
        ->name('out_service_centers.restore');
    Route::delete('out_service_centers/{id}/forceDelete', [OutServiceCenterController::class, 'forceDelete'])
        ->name('out_service_centers.forceDelete');
});


Route::prefix('service-inwards/{serviceInward}')->group(function () {

    Route::post('/notes', [ServiceInwardNoteController::class, 'store'])
        ->name('service_inwards.notes.store');

    Route::put('/notes/{note}', [ServiceInwardNoteController::class, 'update'])
        ->name('service_inwards.notes.update');

    Route::delete('/notes/{note}', [ServiceInwardNoteController::class, 'destroy'])
        ->name('service_inwards.notes.destroy');
});


// -----------------------------------------------------------------
// Ready For Delivery – full CRUD + trash management
// -----------------------------------------------------------------

Route::middleware(['auth', 'verified'])->group(function () {

    Route::resource('ready_for_deliveries', ReadyForDeliveryController::class)
        ->names('ready_for_deliveries');

    Route::post('ready_for_deliveries/{id}/restore', [ReadyForDeliveryController::class, 'restore'])
        ->name('ready_for_deliveries.restore');

    Route::delete('ready_for_deliveries/{id}/force', [ReadyForDeliveryController::class, 'forceDelete'])
        ->name('ready_for_deliveries.forceDelete');

    Route::get('ready_for_deliveries/trash', [ReadyForDeliveryController::class, 'trash'])
        ->name('ready_for_deliveries.trash');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('todos', TodoController::class)->except(['show']);
    Route::get('todos/trash', [TodoController::class, 'trash'])->name('todos.trash');
    Route::post('todos/{todo}/restore', [TodoController::class, 'restore'])->name('todos.restore');
    Route::delete('todos/{todo}/force', [TodoController::class, 'forceDelete'])->name('todos.forceDelete');
    Route::get('todos/{todo}', [TodoController::class, 'show'])->name('todos.show');

    Route::post('/todos/reorder', [TodoController::class, 'reorder'])->name('todos.reorder');
    Route::patch('/todos/{todo}/toggle-complete', [TodoController::class, 'toggleComplete'])->name('todos.toggle-complete');
});


Route::middleware(['auth', 'verified'])->group(function () {

    // === Call Logs Resource (Standard) ===
    Route::resource('calls', CallLogController::class)
        ->parameters(['calls' => 'call_log']) // ← Renames {calls} → {call_log}
        ->except(['show']); // show is optional if not used

    // === OR: Manual (if you prefer full control) ===

    Route::get('calls/{call_log}', [CallLogController::class, 'show'])
        ->name('calls.show');

    /*
    Route::get('calls', [CallLogController::class, 'index'])->name('calls.index');
    Route::get('calls/create', [CallLogController::class, 'create'])->name('calls.create');
    Route::post('calls', [CallLogController::class, 'store'])->name('calls.store');
    Route::get('calls/{call_log}', [CallLogController::class, 'show'])->name('calls.show');
    Route::get('calls/{call_log}/edit', [CallLogController::class, 'edit'])->name('calls.edit');
    Route::put('calls/{call_log}', [CallLogController::class, 'update'])->name('calls.update');
    Route::delete('calls/{call_log}', [CallLogController::class, 'destroy'])->name('calls.destroy');
    */

    // === Custom Actions ===
    Route::get('calls/trash', [CallLogController::class, 'trash'])->name('calls.trash');
    Route::post('calls/{call_log}/restore', [CallLogController::class, 'restore'])->name('calls.restore');
    Route::delete('calls/{call_log}/force-delete', [CallLogController::class, 'forceDelete'])->name('calls.forceDelete');
    Route::get('calls/search', [CallLogController::class, 'search'])->name('calls.search');
    Route::get('contacts/{contact}/history', [CallLogController::class, 'contactHistory'])->name('contacts.history');

    // === Notes (Nested under call_log) ===
    Route::prefix('calls/{call_log}')->name('calls.')->group(function () {
        Route::post('notes', [CallLogNoteController::class, 'store'])->name('notes.store');
        Route::put('notes/{note}', [CallLogNoteController::class, 'update'])->name('notes.update');
        Route::delete('notes/{note}', [CallLogNoteController::class, 'destroy'])->name('notes.destroy');
    });



});

Route::resource('enquiries', EnquiryController::class);

use App\Http\Controllers\MessagingController;

Route::get('/messaging/channel', [MessagingController::class, 'channel'])
    ->name('messaging.channel');

//Route::get('/messaging/whatsapp', [MessagingController::class, 'whatsappChannel'])
//    ->name('messaging.whatsapp');

Route::get('/messaging/whatsapp', [MessagingController::class, 'whatsappContacts'])
    ->name('messaging.whatsapp');

Route::post('/messaging/whatsapp/send', [MessagingController::class, 'sendWhatsAppMessage'])
    ->name('messaging.whatsapp.send');

Route::get('/messaging/chat-history/{contact}', [MessagingController::class, 'getChatHistory'])
    ->name('messaging.chat-history');

