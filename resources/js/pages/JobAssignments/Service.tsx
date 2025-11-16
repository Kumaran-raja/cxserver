// resources/js/Pages/Service.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Play } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { index as job_assignments } from '@/routes/job_assignments';

interface Assignment {
    id: number;
    stage: string;
    job_card: {
        job_no: string;
        service_inward: {
            rma: string;
            product: string;
            issue: string;
        };
    };
    // Add more fields as needed
}

interface Props {
    assignments: Assignment[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Service', href: '#' },
];

export default function Service() {
    const route = useRoute();
    const { assignments } = usePage().props as unknown as Props;

    const [isStarting, setIsStarting] = useState<number | null>(null);

    const handleStartService = (assignmentId: number) => {
        setIsStarting(assignmentId);
        router.post(
            route('job_assignments.start', assignmentId),
            {},
            {
                onFinish: () => setIsStarting(null),
                onSuccess: () => {
                    // Reload or redirect to Kanban
                    router.visit(route('job_assignments.kanban'), { method: 'get' });
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Service Management" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Service Management</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                View and start your assigned services
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={route('job_assignments.create')}>
                                Assign New Job
                            </Link>
                        </Button>
                    </div>

                    <Separator />

                    {/* Assignments List */}
                    <div className="space-y-4">
                        {assignments.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No assigned services found.</p>
                            </div>
                        ) : (
                            assignments.map((assignment) => (
                                <Card key={assignment.id}>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-sm font-medium">
                                            Job No: {assignment.job_card.job_no} | RMA: {assignment.job_card.service_inward.rma}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-1 text-xs">
                                        <p><strong>Product:</strong> {assignment.job_card.service_inward.product}</p>
                                        <p><strong>Issue:</strong> {assignment.job_card.service_inward.issue}</p>
                                        <p><strong>Stage:</strong> {assignment.stage}</p>
                                        {assignment.stage === 'assigned' && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleStartService(assignment.id)}
                                                disabled={isStarting === assignment.id}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                {isStarting === assignment.id ? 'Starting...' : 'Start Service'}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
