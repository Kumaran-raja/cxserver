// resources/js/Pages/JobAssignments/Show.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Modular Action Components
import StartServiceButton from './components/StartServiceButton';
import CompleteServiceDialog from './components/CompleteServiceDialog';
import ReadyForDeliveryDialog from './components/ReadyForDeliveryDialog';
import ConfirmDeliveryDialog from './components/ConfirmDeliveryDialog';
import AdminCloseDialog from './components/AdminCloseDialog';

import type { Props } from './types';

const breadcrumbs = (assignment: Props['assignment']) => [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Job Assignments', href: route('job_assignments.index') },
    { title: `Assignment #${assignment.id}`, href: '#' },
];

export default function Show({ assignment, can, supervisors, users }: Props) {
    const getStageBadge = (stage: string | null) => {
        if (!stage) return <Badge variant="secondary">—</Badge>;
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
            assigned: 'secondary',
            in_progress: 'default',
            completed: 'outline',
            ready_for_delivery: 'secondary',
            delivered: 'default',
            verified: 'outline',
        };
        return (
            <Badge variant={variants[stage] || 'secondary'} className="capitalize">
                {stage.replace('_', ' ')}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(assignment)}>
            <Head title={`Assignment #${assignment.id} - ${assignment.job_card.job_no}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" size="icon">
                                <Link href={route('job_assignments.index')}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Assignment Details</h1>
                                <p className="text-sm text-muted-foreground">
                                    Job #{assignment.job_card.job_no} – RMA: {assignment.job_card.service_inward.rma}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {can.update && (
                                <Button asChild>
                                    <Link href={route('job_assignments.edit', assignment.id)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Link>
                                </Button>
                            )}

                            {/* Stage-Specific Action Buttons */}
                            {assignment.stage === 'assigned' && <StartServiceButton assignmentId={assignment.id} />}
                            {assignment.stage === 'in_progress' && <CompleteServiceDialog assignment={assignment} />}
                            {assignment.stage === 'completed' && <ReadyForDeliveryDialog assignment={assignment} supervisors={supervisors} />}
                            {assignment.stage === 'ready_for_delivery' && <ConfirmDeliveryDialog assignment={assignment} users={users} />}
                            {assignment.stage === 'delivered' && can.adminClose && <AdminCloseDialog assignment={assignment} />}
                        </div>
                    </div>

                    <Separator />

                    {/* Main Content Grid */}
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Left Column - Main Details */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Job & Customer Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Job & Customer Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Job Number</p>
                                            <p className="text-lg font-semibold">{assignment.job_card.job_no}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">RMA Number</p>
                                            <p className="text-lg font-semibold">{assignment.job_card.service_inward.rma}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Customer Details</p>
                                        <div className="space-y-1">
                                            <p className="font-medium">{assignment.job_card.service_inward.contact.name}</p>
                                            <p className="text-sm text-muted-foreground">{assignment.job_card.service_inward.contact.phone}</p>
                                            <p className="text-sm text-muted-foreground">{assignment.job_card.service_inward.contact.email}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assignment Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assignment & Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                                            <p className="font-medium">{assignment.user.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Current Stage</p>
                                            {getStageBadge(assignment.stage)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="font-medium text-muted-foreground">Assigned</p>
                                            <p>{format(new Date(assignment.assigned_at), 'dd MMM yyyy HH:mm')}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Started</p>
                                            <p>{assignment.started_at ? format(new Date(assignment.started_at), 'dd MMM yyyy HH:mm') : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Completed</p>
                                            <p>{assignment.completed_at ? format(new Date(assignment.completed_at), 'dd MMM yyyy HH:mm') : '—'}</p>
                                        </div>
                                    </div>

                                    {assignment.time_spent_minutes > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Time Spent</p>
                                            <p className="font-medium">{assignment.time_spent_minutes} minutes</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Service Report */}
                            {assignment.report && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Service Report</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="whitespace-pre-wrap text-sm">{assignment.report}</p>
                                        {assignment.engineer_note && (
                                            <>
                                                <Separator className="my-4" />
                                                <p className="text-sm italic text-muted-foreground">
                                                    Engineer Note: {assignment.engineer_note}
                                                </p>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Billing & Delivery */}
                            {(assignment.billing_amount || assignment.billing_details || assignment.delivered_confirmed_at) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Billing & Delivery</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {assignment.billing_amount > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Billing Amount</p>
                                                <p className="text-xl font-bold text-green-600">
                                                    ₹{Number(assignment.billing_amount).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        {assignment.billing_details && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Billing Details</p>
                                                <p className="text-sm whitespace-pre-wrap">{assignment.billing_details}</p>
                                            </div>
                                        )}
                                        {assignment.billing_confirmed_by && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Billing Confirmed By</p>
                                                <p className="font-medium">{typeof assignment.billing_confirmed_by === 'string' ? assignment.billing_confirmed_by : assignment.billing_confirmed_by.name}</p>
                                            </div>
                                        )}
                                        {assignment.delivered_confirmed_at && (
                                            <>
                                                <Separator className="my-4" />
                                                <div className="text-sm">
                                                    <p className="font-medium text-muted-foreground">Delivery Confirmed</p>
                                                    <p>
                                                        {format(new Date(assignment.delivered_confirmed_at), 'dd MMM yyyy HH:mm')} by{' '}
                                                        <span className="font-medium">{assignment.delivered_confirmed_by}</span>
                                                    </p>
                                                    {assignment.delivered_otp && (
                                                        <p className="mt-2">
                                                            <span className="text-muted-foreground">OTP Used:</span>{' '}
                                                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                                                {assignment.delivered_otp}
                                                            </code>
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Final Admin Verification */}
                            {assignment.stage === 'verified' && assignment.admin_verifier && (
                                <Card className="border-green-200 bg-green-50">
                                    <CardHeader>
                                        <CardTitle className="text-green-800">Job Closed Successfully</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-green-700">Verified By</p>
                                            <p className="font-medium">{assignment.admin_verifier.name}</p>
                                        </div>
                                        {assignment.admin_verified_at && (
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Closed On</p>
                                                <p>{format(new Date(assignment.admin_verified_at), 'dd MMM yyyy HH:mm')}</p>
                                            </div>
                                        )}
                                        {assignment.customer_satisfaction_rating && (
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Customer Rating</p>
                                                <p className="text-2xl font-bold">
                                                    {assignment.customer_satisfaction_rating}/5 ★
                                                </p>
                                            </div>
                                        )}
                                        {assignment.admin_verification_note && (
                                            <>
                                                <Separator className="my-3" />
                                                <p className="text-sm italic">"{assignment.admin_verification_note}"</p>
                                            </>
                                        )}
                                        {assignment.merit_points > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Merit Points Awarded</p>
                                                <p className="text-xl font-bold text-amber-600">+{assignment.merit_points} pts</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column - Summary */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Current Stage</span>
                                        {getStageBadge(assignment.stage)}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Merit Points</span>
                                        <span className="font-medium">{assignment.merit_points > 0 ? assignment.merit_points : '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Customer Rating</span>
                                        <span className="font-medium">
                                            {assignment.customer_satisfaction_rating ? `${assignment.customer_satisfaction_rating}/5` : '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Admin Verifier</span>
                                        <span className="font-medium">{assignment.admin_verifier?.name || '—'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Audit Trail */}
                            {(assignment.audited_at || assignment.audit_note) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Audit Trail</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {assignment.auditor && (
                                            <p>
                                                <span className="text-muted-foreground">Audited by:</span> {assignment.auditor.name}
                                            </p>
                                        )}
                                        {assignment.audited_at && (
                                            <p>
                                                <span className="text-muted-foreground">On:</span>{' '}
                                                {format(new Date(assignment.audited_at), 'dd MMM yyyy HH:mm')}
                                            </p>
                                        )}
                                        {assignment.audit_note && (
                                            <p className="italic text-muted-foreground">"{assignment.audit_note}"</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
