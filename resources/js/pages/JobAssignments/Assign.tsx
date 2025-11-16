// resources/js/Pages/JobAssignments/Assign.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, ClipboardList, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { index as job_assignments } from '@/routes/job_assignments';

interface JobCard {
    id: number;
    job_no: string;
    service_inward: {
        rma: string;
        contact: { name: string; phone: string };
        product: string;
        issue: string;
    };
}

interface Technician {
    id: number;
    name: string;
}

interface ServiceStatus {
    id: number;
    name: string;
}

interface Props {
    jobCards: JobCard[];
    technicians?: Technician[];
    statuses: ServiceStatus[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Job Assignments', href: job_assignments().url },
    { title: 'Assign New Job', href: '#' },
];

export default function Assign() {
    const route = useRoute();
    const { jobCards, technicians, statuses } = usePage().props as unknown as Props;

    const [selectedJobCard, setSelectedJobCard] = useState<string>('');
    const [selectedTechnician, setSelectedTechnician] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedJob = jobCards.find(jc => jc.id === Number(selectedJobCard));

    useEffect(() => {
        // Auto-select first available job card if only one exists
        if (jobCards.length === 1 && !selectedJobCard) {
            setSelectedJobCard(String(jobCards[0].id));
        }
    }, [jobCards, selectedJobCard]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedJobCard || !selectedTechnician || !selectedStatus) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            route('job_assignments.store'),
            {
                job_card_id: selectedJobCard,
                user_id: selectedTechnician,
                service_status_id: selectedStatus,
                remarks,
            },
            {
                onFinish: () => setIsSubmitting(false),
                onSuccess: () => {
                    router.visit(route('job_assignments.kanban'), { method: 'get' });
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assign Job to Technician" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Assign Job</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Select a job card and assign it to a technician
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={route('job_assignments.kanban')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Kanban
                            </Link>
                        </Button>
                    </div>

                    <Separator />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Job Card Selection */}
                        <div className="space-y-3">
                            <Label htmlFor="job_card" className="text-base font-medium">
                                Select Job Card <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedJobCard}
                                onValueChange={setSelectedJobCard}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="job_card" className="w-full">
                                    <SelectValue placeholder="Choose a job card..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobCards.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No available job cards
                                        </SelectItem>
                                    ) : (
                                        jobCards.map((jc) => (
                                            <SelectItem key={jc.id} value={String(jc.id)}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{jc.job_no}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        RMA: {jc.service_inward.rma} | {jc.service_inward.contact.name}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Job Card Details (Preview) */}
                        {selectedJob && (
                            <div className="rounded-lg border bg-card p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">Job Card Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Job No:</span>{' '}
                                        <Badge variant="secondary">{selectedJob.job_no}</Badge>
                                    </div>
                                    <div>
                                        <span className="font-medium">RMA:</span>{' '}
                                        {selectedJob.service_inward.rma}
                                    </div>
                                    <div>
                                        <span className="font-medium">Customer:</span>{' '}
                                        {selectedJob.service_inward.contact.name}
                                    </div>
                                    <div>
                                        <span className="font-medium">Phone:</span>{' '}
                                        {selectedJob.service_inward.contact.phone || '—'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Product:</span>{' '}
                                        {selectedJob.service_inward.product}
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="font-medium">Issue:</span>{' '}
                                        <span className="text-muted-foreground">
                                            {selectedJob.service_inward.issue || 'Not specified'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Technician Selection */}
                        <div className="space-y-3">
                            <Label htmlFor="technician" className="text-base font-medium">
                                Assign to Technician <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedTechnician}
                                onValueChange={setSelectedTechnician}
                                disabled={isSubmitting || !selectedJobCard || !technicians || technicians.length === 0}
                            >
                                <SelectTrigger id="technician" className="w-full">
                                    <SelectValue placeholder="Choose a technician..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(!technicians || technicians.length === 0) ? (
                                        <SelectItem value="none" disabled>
                                            No technicians available
                                        </SelectItem>
                                    ) : (
                                        technicians.map((tech) => (
                                            <SelectItem key={tech.id} value={String(tech.id)}>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    {tech.name}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Service Status */}
                        <div className="space-y-3">
                            <Label htmlFor="status" className="text-base font-medium">
                                Initial Service Status <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedStatus}
                                onValueChange={setSelectedStatus}
                                disabled={isSubmitting || !selectedJobCard}
                            >
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue placeholder="Select status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem key={status.id} value={String(status.id)}>
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Remarks */}
                        <div className="space-y-3">
                            <Label htmlFor="remarks" className="text-base font-medium">
                                Remarks (Optional)
                            </Label>
                            <textarea
                                id="remarks"
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Any special instructions for the technician..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <Separator />

                        {/* Submit */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                Assignment will start in <strong>Assigned</strong> stage
                            </div>
                            <Button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    !selectedJobCard ||
                                    !selectedTechnician ||
                                    !selectedStatus
                                }
                                className="min-w-32"
                            >
                                {isSubmitting ? 'Assigning...' : 'Assign Job'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
