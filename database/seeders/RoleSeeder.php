<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    /** @var array<string,array{label:string,description:string}> */
    private array $roles = [
        'super-admin' => ['label' => 'Super Administrator',   'description' => 'Full system access.'],
        'admin'       => ['label' => 'Administrator',         'description' => 'Manage users & content.'],
        'editor'      => ['label' => 'Editor',                'description' => 'Edit posts.'],
        'user'        => ['label' => 'Regular User',          'description' => 'Read-only.'],
        'manager'     => ['label' => 'Manager',               'description' => 'Manage team.'],
        'client'      => ['label' => 'Client',                'description' => 'View own data.'],
        'dealer'      => ['label' => 'Dealer',                'description' => 'Manage deals.'],
        'devops'      => ['label' => 'DevOps',                'description' => 'Deploy & monitor.'],
        'restricted'  => ['label' => 'Restricted User',       'description' => 'Limited access.'],
        'engineer'  => ['label' => 'Engineer',       'description' => 'Engineer.'],
    ];

    public function run(): void
    {
        $guard = 'web';

        foreach ($this->roles as $name => $data) {
            Role::firstOrCreate(
                ['name' => $name, 'guard_name' => $guard],
                [
                    'label'       => $data['label'],
                    'description' => $data['description'],
                ]
            );
        }

        $this->command->info('Roles seeded: ' . count($this->roles));
    }
}
