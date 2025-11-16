// resources/js/Pages/JobAssignments/Show.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Play, ArrowLeft } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { index as job_assignments } from '@/routes/job_assignments';

interface Assignment {
    id: number;
    job_card: {
        job_no: string;
        service_inward: {
            rma: string;
            contact: { name: string; phone: string };
            product: string;
            issue: string;
        };
    };
    user: { name: string };
    status: { name: string };
    stage: string;
    remarks?: string;
    assigned_at: string;
    started_at?: string | null;
    completed_at?: string | null;
    time_spent_minutes?: number;
    billing_amount?: number | null;
    merit_points?: number;
    // Add more as needed
}

interface Props {
    assignment: Assignment;
    can: { update: boolean; start_service: boolean; admin_close: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Job Assignments', href: job_assignments().url },
    { title: `Job ${assignment?.job_card?.job_no || 'Details'}`, href: '#' },
];

export default function Show({ assignment, can }: Props) {
    const route = useRoute();

    const handleStartService = () => {
        if (confirm('Start service for this job?')) {
            router.post(route('job_assignments.start_service', assignment.id), {}, {
                onSuccess: () => router.reload(),
            });
        }
    };

    if (!assignment) return <div>Assignment not found.</div>;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Job ${assignment.job_card.job_no}`} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={route('job_assignments.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Job {assignment.job_card.job_no}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    RMA: {assignment.job_card.service_inward.rma}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {can.start_service && (
                                <Button onClick={handleStartService} variant="default">
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Service
                                </Button>
                            )}
                            {can.update && (
                                <Button asChild variant="outline">
                                    <Link href={route('job_assignments.edit', assignment.id)}>
                                        Edit
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p><strong>Customer:</strong> {assignment.job_card.service_inward.contact.name}</p>
                                    <p><strong>Phone:</strong> {assignment.job_card.service_inward.contact.phone}</p>
                                </div>
                                <div>
                                    <p><strong>Product:</strong> {assignment.job_card.service_inward.product}</p>
                                    <p><strong>Issue:</strong> {assignment.job_card.service_inward.issue}</p>
                                </div>
                                <div>
                                    <p><strong>Assigned To:</strong> {assignment.user.name}</p>
                                    <p><strong>Stage:</strong> <Badge>{assignment.stage.replace('_', ' ')}</Badge></p>
                                </div>
                                <div>
                                    <p><strong>Status:</strong> <Badge variant="outline">{assignment.status.name}</Badge></p>
                                    <p><strong>Assigned At:</strong> {new Date(assignment.assigned_at).toLocaleDateString()}</p>
                                    {assignment.started_at && <p><strong>Started At:</strong> {new Date(assignment.started_at).toLocaleDateString()}</p>}
                                </div>
                                {assignment.remarks && <p className="col-span-full"><strong>Remarks:</strong> {assignment.remarks}</p>}
                                {assignment.time_spent_minutes && <p><strong>Time Spent:</strong> {assignment.time_spent_minutes} min</p>}
                                {assignment.billing_amount != null && <p><strong>Billing:</strong> ₹{Number(assignment.billing_amount).toFixed(2)}</p>}
                                {assignment.merit_points && <p><strong>Merit Points:</strong> {assignment.merit_points}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
