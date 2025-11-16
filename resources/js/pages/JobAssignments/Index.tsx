// resources/js/Pages/JobAssignments/Index.tsx
import DataTable from '@/components/table/DataTable';
import TableActions from '@/components/table/TableActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as job_assignments, kanban, service, show } from '@/routes/job_assignments/index';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ClipboardCheck,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useRoute } from 'ziggy-js';

interface Assignment {
    id: number;
    job_card: {
        id: number;
        job_no: string;
        service_inward: { rma: string; contact: { name: string } };
    };
    user: { id: number; name: string };
    status: { id: number; name: string };
    assigned_at: string;
    started_at: string | null;
    completed_at: string | null;
    time_spent_minutes: number;
    stage: string | null;
    position: number;
    merit_points: number;
    customer_satisfaction_rating: number | null;
    billing_amount: number;
    delivered_confirmed_at: string | null;
    admin_verifier: { id: number; name: string } | null;
    deleted_at: string | null;
}

interface Props {
    assignments: {
        data: Assignment[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        per_page: number;
    };
    filters: {
        search?: string;
        stage?: string;
        technician_filter?: string;
        per_page?: string;
    };
    stages: string[];
    technicians: { id: number; name: string }[];
    can: { create: boolean; admin_close: boolean };
    trashedCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Job Assignment', href: job_assignments().url },
];

export default function Index() {
    const { assignments, filters, stages, technicians, can, trashedCount } =
        usePage().props as unknown as Props;
    const route = useRoute();

    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        stage: filters.stage || 'all',
        technician_filter: filters.technician_filter || 'all',
        per_page: filters.per_page || '50',
    });

    const [isNavigating, setIsNavigating] = useState(false);

    // Sync server filters → local state
    useEffect(() => {
        setLocalFilters({
            search: filters.search || '',
            stage: filters.stage || 'all',
            technician_filter: filters.technician_filter || 'all',
            per_page: filters.per_page || '50',
        });
    }, [filters]);

    // Build URL payload
    const buildPayload = useCallback(
        () => ({
            search: localFilters.search || undefined,
            stage:
                localFilters.stage === 'all' ? undefined : localFilters.stage,
            technician_filter:
                localFilters.technician_filter === 'all'
                    ? undefined
                    : localFilters.technician_filter,
            per_page: localFilters.per_page,
        }),
        [localFilters],
    );

    // Navigate with filters
    const navigate = useCallback(
        (extra = {}) => {
            setIsNavigating(true);
            router.get(
                route('job_assignments.index'),
                { ...buildPayload(), ...extra },
                {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsNavigating(false),
                },
            );
        },
        [route, buildPayload],
    );

    // Reset all filters
    const handleReset = () => {
        router.get(
            route('job_assignments.index'),
            {},
            { preserveState: true, replace: true },
        );
    };

    // Clear single filter
    const clearFilter = useCallback(
        (key: 'search' | 'stage' | 'technician_filter' | 'per_page') => {
            const updates: Partial<typeof localFilters> = {};
            if (key === 'search') updates.search = '';
            if (key === 'stage') updates.stage = 'all';
            if (key === 'technician_filter') updates.technician_filter = 'all';
            if (key === 'per_page') updates.per_page = '50';

            setLocalFilters((prev) => ({ ...prev, ...updates }));
            navigate(updates);
        },
        [navigate],
    );

    // Active filter badges
    const activeFilterBadges = useMemo(() => {
        const badges: JSX.Element[] = [];

        if (localFilters.search) {
            badges.push(
                <Badge
                    key="search"
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                >
                    Search: "{localFilters.search}"
                    <button
                        onClick={() => clearFilter('search')}
                        className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>,
            );
        }

        if (localFilters.stage !== 'all') {
            badges.push(
                <Badge
                    key="stage"
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                >
                    Stage: {localFilters.stage}
                    <button
                        onClick={() => clearFilter('stage')}
                        className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>,
            );
        }

        if (localFilters.technician_filter !== 'all') {
            const tech = technicians.find(
                (t) => t.id === parseInt(localFilters.technician_filter),
            );
            badges.push(
                <Badge
                    key="tech"
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                >
                    Technician: {tech?.name || 'Unknown'}
                    <button
                        onClick={() => clearFilter('technician_filter')}
                        className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>,
            );
        }

        // Per Page Badge (only if not default)
        if (localFilters.per_page !== '50') {
            badges.push(
                <Badge
                    key="per_page"
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                >
                    Per Page: {localFilters.per_page}
                    <button
                        onClick={() => clearFilter('per_page')}
                        className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>,
            );
        }

        if (badges.length === 0) {
            badges.push(
                <span
                    key="none"
                    className="inline-flex items-center text-xs text-muted-foreground italic"
                >
                    No active filters
                </span>,
            );
        }

        return badges;
    }, [localFilters, technicians, clearFilter]);

    // Handle per-page change from DataTable
    const handlePerPageChange = (perPage: number) => {
        setLocalFilters((prev) => ({ ...prev, per_page: String(perPage) }));
        navigate({ per_page: perPage, page: 1 });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Job Assignments" />

            <div className="py-6">
                <div className="mx-auto space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-black/50">
                                Job Assignments
                            </h1>
                            <p className="mt-1 text-sm text-black/30">
                                Manage service job assignments
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {can.create && (
                                <Button asChild>
                                    <Link
                                        href={route('job_assignments.create')}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Assign Job
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="outline">
                                <Link href={route('job_assignments.kanban')}>
                                    <ClipboardCheck className="mr-2 h-4 w-4" />
                                    Kanban View
                                </Link>
                            </Button>
                            {trashedCount > 0 && (
                                <Button asChild variant="secondary">
                                    <Link href={route('job_assignments.trash')}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Trash ({trashedCount})
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="flex max-w-md flex-1 items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Search by Job No, RMA, Technician..."
                                value={localFilters.search}
                                onChange={(e) =>
                                    setLocalFilters((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                    }))
                                }
                                onKeyUp={(e) => e.key === 'Enter' && navigate()}
                                disabled={isNavigating}
                            />
                        </div>

                        {/* Stage Filter */}
                        <Select
                            value={localFilters.stage}
                            onValueChange={(v) => {
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    stage: v,
                                }));
                                navigate({ stage: v });
                            }}
                            disabled={isNavigating}
                        >
                            <SelectTrigger className="h-9 w-48">
                                <SelectValue placeholder="All Stages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                {stages.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s.replace('_', ' ').toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Technician Filter */}
                        <Select
                            value={localFilters.technician_filter}
                            onValueChange={(v) => {
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    technician_filter: v,
                                }));
                                navigate({ technician_filter: v });
                            }}
                            disabled={isNavigating}
                        >
                            <SelectTrigger className="h-9 w-48">
                                <SelectValue placeholder="All Technicians" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Technicians
                                </SelectItem>
                                {technicians.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Action Buttons */}
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                className="h-9"
                                onClick={() => navigate()}
                                disabled={isNavigating}
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9"
                                onClick={handleReset}
                                disabled={isNavigating}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* ACTIVE FILTERS */}
                    <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-3">
                        <span className="font-medium text-foreground">
                            Active Filters:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {activeFilterBadges}
                        </div>
                    </div>

                    {/* DATA TABLE */}
                    <DataTable
                        data={assignments.data}
                        pagination={assignments}
                        perPage={parseInt(localFilters.per_page)}
                        onPerPageChange={handlePerPageChange}
                        onPageChange={(page) => navigate({ page })}
                        emptyMessage="No assignments found."
                        isLoading={isNavigating}
                    >
                        <TableHeader>
                            <TableRow className="bg-muted font-semibold text-foreground">
                                <TableHead>Job</TableHead>
                                <TableHead>Technician</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned</TableHead>
                                <TableHead>Started</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Time Spent</TableHead>
                                <TableHead>Billing</TableHead>
                                <TableHead>Merit Points</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Admin Verifier</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.data.map((a: Assignment) => (
                                <TableRow
                                    key={a.id}
                                    className={a.deleted_at ? 'opacity-60' : ''}
                                >
                                    <TableCell>
                                        <div>


                                                {a.deleted_at ? (
                                                    <span className="text-muted-foreground">
                                                {a.job_card.job_no}
                                            </span>
                                                ) : (
                                                    <Link
                                                        href={route(
                                                            'job_assignments.show',
                                                            a.id,
                                                        )}
                                                        className="hover:text-primary  hover:underline"
                                                    >
                                                        <div className="font-medium">
                                                        {a.job_card.job_no}
                                                        </div>

                                                        <div className="text-sm text-muted-foreground">
                                                            {a.job_card.service_inward.rma}{' '}
                                                            –{' '}
                                                            {
                                                                a.job_card.service_inward
                                                                    .contact.name
                                                            }
                                                        </div>
                                                    </Link>
                                                )}

                                                {/*{a.job_card.job_no}*/}


                                        </div>
                                    </TableCell>
                                    <TableCell>{a.user.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {a.status.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(
                                            new Date(a.assigned_at),
                                            'dd MMM yyyy HH:mm',
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {a.started_at
                                            ? format(
                                                  new Date(a.started_at),
                                                  'dd MMM yyyy HH:mm',
                                              )
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {a.completed_at
                                            ? format(
                                                  new Date(a.completed_at),
                                                  'dd MMM yyyy HH:mm',
                                              )
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {a.stage ? (
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                            >
                                                {a.stage.replace('_', ' ')}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {a.time_spent_minutes > 0
                                            ? `${a.time_spent_minutes} min`
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {/*{a.billing_amount > 0*/}
                                        {/*    ? `₹${a.billing_amount.toFixed(2)}`*/}
                                        {/*    : '—'}*/}

                                        {a.billing_amount != null
                                            ? `₹${Number(a.billing_amount).toFixed(2)}`
                                            : '—'}

                                    </TableCell>
                                    <TableCell>
                                        {a.merit_points > 0
                                            ? a.merit_points
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {a.customer_satisfaction_rating
                                            ? `${a.customer_satisfaction_rating}/5`
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {a.admin_verifier
                                            ? a.admin_verifier.name
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TableActions
                                            id={a.id}
                                            editRoute={route(
                                                'job_assignments.edit',
                                                a.id,
                                            )}
                                            deleteRoute={route(
                                                'job_assignments.destroy',
                                                a.id,
                                            )}
                                            restoreRoute={
                                                a.deleted_at
                                                    ? route(
                                                          'job_assignments.restore',
                                                          a.id,
                                                      )
                                                    : undefined
                                            }
                                            forceDeleteRoute={
                                                a.deleted_at
                                                    ? route(
                                                          'job_assignments.forceDelete',
                                                          a.id,
                                                      )
                                                    : undefined
                                            }
                                            isDeleted={!!a.deleted_at}
                                            customActions={
                                                can.admin_close &&
                                                a.stage === 'delivered' &&
                                                !a.deleted_at
                                                    ? [
                                                          {
                                                              label: 'Admin Close',
                                                              icon: ClipboardCheck,
                                                              href: route(
                                                                  'job_assignments.close',
                                                                  a.id,
                                                              ),
                                                              className:
                                                                  'text-green-600 hover:text-green-900',
                                                          },
                                                      ]
                                                    : []
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </DataTable>
                </div>
            </div>
        </AppLayout>
    );
}
