<?php

namespace App\Providers;

use App\Models\Blog;
use App\Models\Contact;
use App\Models\ContactType;
use App\Models\JobAssignment;
use App\Models\JobSpareRequest;
use App\Models\OutServiceCenter;
use App\Models\Permission;
use App\Models\ReadyForDelivery;
use App\Models\Role;
use App\Models\ServiceInward;
use App\Models\ServiceInwardNote;
use App\Models\ServicePart;
use App\Models\User;
use App\Policies\BlogPolicy;
use App\Policies\ContactPolicy;
use App\Policies\ContactTypePolicy;
use App\Policies\JobAssignmentPolicy;
use App\Policies\JobSpareRequestPolicy;
use App\Policies\OutServiceCenterPolicy;
use App\Policies\PermissionPolicy;
use App\Policies\ReadyForDeliveryPolicy;
use App\Policies\RolePolicy;
use App\Policies\ServiceInwardNotePolicy;
use App\Policies\ServiceInwardPolicy;
use App\Policies\ServicePartPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{

    protected array $policies = [
        User::class => UserPolicy::class,
        Role::class       => RolePolicy::class,
        Permission::class => PermissionPolicy::class,
        Blog::class => BlogPolicy::class,
        Contact::class => ContactPolicy::class,
        ContactType::class => ContactTypePolicy::class,
        ServiceInward::class => ServiceInwardPolicy::class,
        ServicePart::class => ServicePartPolicy::class,
        JobSpareRequest::class => JobSpareRequestPolicy::class,
        OutServiceCenter::class => OutServiceCenterPolicy::class,
        ServiceInwardNote::class => ServiceInwardNotePolicy::class,
        ReadyForDelivery::class => ReadyForDeliveryPolicy::class,
        JobAssignment::class => JobAssignmentPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Auto-register policies for all models in app/Models
        collect(File::allFiles(app_path('Models')))
            ->map(fn($file) => 'App\\Models\\' . $file->getFilenameWithoutExtension())
            ->filter(fn($model) => class_exists($model))
            ->each(function ($model) {
                $policy = 'App\\Policies\\' . class_basename($model) . 'Policy';
                if (class_exists($policy)) {
                    Gate::policy($model, $policy);
                }
            });
    }
}
