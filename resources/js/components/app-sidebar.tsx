import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    MonitorCog,
    Folder,
    LayoutGrid,
    Laptop,
    Bolt,
    Contact,
    StickyNote,
    NotebookPen,
    UserRoundSearch,
    Drill,
    ServerCrash,
    PackageCheck,
    ListChecks,
    PhoneCall,
} from 'lucide-react';


import AppLogo from './app-logo';
import {index as blogs} from '@/routes/blogs/index';
import { index as contactTypes } from '@/routes/contact-types/index';
import { index as contacts } from '@/routes/contacts';
import { index as service_inward } from '@/routes/service_inwards/index';
import { index as job_cards } from '@/routes/job_cards/index';
// import { index as users } from '@/routes/users';
import { index as job_assignment, finals } from '@/routes/job_assignments/index';
import {index as service_parts } from '@/routes/service_parts/index';
import {index as job_spare_requests } from '@/routes/job_spare_requests';
import {index as out_service_centers } from '@/routes/out_service_centers/index';
// import {index as ready_for_deliveries } from '@/routes/ready_for_deliveries/index';
import { NavService } from '@/components/nav-service';
import { NavSpares } from '@/components/nav-spares';
import { index as todos } from '@/routes/todos';
import {index as enquiries } from '@/routes/enquiries/index';
import { index as calls } from '@/routes/calls/index';
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Enquiry',
        href: enquiries(),
        icon: UserRoundSearch,
    },
    {
        title: 'Call logs',
        href: calls(),
        icon: PhoneCall,
    },
    {
        title: 'Contact',
        href: contacts(),
        icon: Contact,
    },
    {
        title: 'Todos',
        href: todos(),
        icon: ListChecks,
    },
];
const ServiceNavItems: NavItem[] = [
    {
        title: 'Service Inward',
        href: service_inward(),
        icon: Laptop,
    },
    {
        title: 'Job-card',
        href: job_cards(),
        icon: MonitorCog,
    },
    {
        title: 'Job-assignment',
        href: job_assignment(),
        icon: NotebookPen,
    },
    {
        title: 'admin Closed',
        href: finals(),
        icon: PackageCheck,
    },
];
const SparesNavItems: NavItem[] = [
    {
        title: 'Service Parts',
        href: service_parts(),
        icon: Bolt,
    },
    {
        title: 'Spares Request',
        href: job_spare_requests(),
        icon: Drill,
    },
    {
        title: 'Out Service Center',
        href: out_service_centers(),
        icon: ServerCrash,
    },
];

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         href: 'https://github.com/laravel/react-starter-kit',
//         icon: Folder,
//     },
//     {
//         title: 'Documentation',
//         href: 'https://laravel.com/docs/starter-kits#react',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavService items={ServiceNavItems} />
                <NavSpares items={SparesNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/*<NavFooter items={footerNavItems} className="mt-auto" />*/}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
