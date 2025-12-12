<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    public function run(): void
    {
        $users = [
            ['Sundar',           'sundar@sundar.com',     'Kalarani1',    ['super-admin']],
            ['Admin',            'admin@admin.com',       'Password1',   ['admin']],
            ['Demo',             'demo@demo.com',         'Password1',   ['admin']],
            ['Vijay',             'vijay@techmedia.in',         'Password1',   ['admin']],
            ['Ashok',             'ashok@techmedia.in',         'Password1',   ['admin']],

            ['Sivarasitha',          'sivarasitha@techmedia.in',   'Password1',   ['user']],
            ['Vinothini',             'vinothini@techmedia.in',         'Password1',   ['user']],
            ['Sriram',           'sriram@techmedia.in',     'Password1',   ['user']],

            ['Sriram',           'sriram@techmedia.in',     'Password1',   ['user']],
            ['Kumaran',           'kumaran@gmail.in',     'pass1234',   ['super-admin']],

//            ['Dealer',           'dealer@dealer.com',     'Password1',   ['dealer']],
//            ['DevOps',           'devops@codexsun.com',   'DevOps123!',  ['devops']],
//            ['Restricted User',  'restricted@codexsun.com','Password1', ['restricted']],
//            ['Standard User',    'standard@codexsun.com', 'Password1',   ['user']],
        ];

        $created = $updated = 0;

        foreach ($users as [$name, $email, $plainPassword, $roleNames]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name'     => $name,
                    'password' => Hash::make($plainPassword),
                    'active'   => true,
                ]
            );

            $roles = Role::whereIn('name', $roleNames)
                ->where('guard_name', 'web')
                ->get();

            $user->roles()->sync($roles->pluck('id')->all());

            $user->wasRecentlyCreated ? $created++ : $updated++;
        }

        // ──────── GRANT ALL PERMISSIONS TO SUPER-ADMIN ────────
        $superAdminRole = Role::where('name', 'super-admin')
            ->where('guard_name', 'web')
            ->first();

        if ($superAdminRole) {
            $allPermissions = Permission::where('guard_name', 'web')
                ->pluck('id') // pluck IDs for pivot
                ->toArray();

            // Replace all existing permissions
            $superAdminRole->permissions()->sync($allPermissions);

            $this->command->info('Super-admin granted ALL permissions (' . count($allPermissions) . ')');
        }

        $this->command->info("Users: {$created} created, {$updated} updated.");
    }
}
