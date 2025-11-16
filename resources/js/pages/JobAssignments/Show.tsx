// resources/js/Pages/JobAssignments/Show.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowLeft,
    CheckCircle,
    Edit,
    FileText,
    IndianRupee,
    Package,
    Play,
    ShieldCheck,
} from 'lucide-react';
import { JSX, useState } from 'react';
import { useRoute } from 'ziggy-js';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Assignment {
    id: number;
    job_card: {
        id: number;
        job_no: string;
        service_inward: {
            rma: string;
            contact: { name: string; phone: string; email: string };
        };
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
    report?: string;
    engineer_note?: string;
    future_note?: string;
    billing_details?: string;
    billing_confirmed_by?: { id: number; name: string } | null;
    delivered_otp?: string;
    delivered_confirmed_by?: string;
    audit_note?: string;
    admin_verification_note?: string;
    auditor?: { id: number; name: string } | null;
    audited_at?: string | null;
    admin_verified_at?: string | null;
}

interface Props {
    assignment: Assignment;
    can: {
        update: boolean;
        delete: boolean;
        adminClose: boolean;
    };
    supervisors: { id: number; name: string }[];
    users: { id: number; name: string }[];
}

const breadcrumbs = (assignment: Assignment) => [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Job Assignments', href: route('job_assignments.index') },
    { title: `Assignment #${assignment.id}`, href: '#' },
];

export default function Show({ assignment, can, supervisors, users }: Props) {
    const route = useRoute();

    // Complete Service Dialog
    const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
    const [report, setReport] = useState('');
    const [engineerNote, setEngineerNote] = useState('');
    const [timeSpent, setTimeSpent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ready for Delivery Dialog
    const [openBillingDialog, setOpenBillingDialog] = useState(false);
    const [billingDetails, setBillingDetails] = useState('');
    const [billingAmount, setBillingAmount] = useState('');
    const [supervisorId, setSupervisorId] = useState('');
    const [isBillingSubmitting, setIsBillingSubmitting] = useState(false);

    // Confirm Delivery Dialog
    const [openDeliveryDialog, setOpenDeliveryDialog] = useState(false);
    const [deliverById, setDeliverById] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [isOtpGenerated, setIsOtpGenerated] = useState(false);
    const [isDeliverySubmitting, setIsDeliverySubmitting] = useState(false);

    // Admin Close Dialog
    const [openAdminDialog, setOpenAdminDialog] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [rating, setRating] = useState('');
    const [meritPoints, setMeritPoints] = useState('');
    const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

    const handleAction = (url: string, method: 'get' | 'post' = 'get') => {
        if (method === 'post') {
            router.post(url);
        } else {
            router.visit(url);
        }
    };

    // 1. assigned → in_progress
    const handleStartService = () => {
        handleAction(route('job_assignments.start_service', assignment.id), 'post');
    };

    // 2. in_progress → completed
    const handleCompleteService = () => {
        if (!report.trim() || !timeSpent || parseInt(timeSpent) < 1) return;
        setIsSubmitting(true);
        router.post(
            route('job_assignments.complete_service', assignment.id),
            {
                report,
                time_spent_minutes: parseInt(timeSpent),
                engineer_note: engineerNote,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setOpenCompleteDialog(false);
                    setReport('');
                    setEngineerNote('');
                    setTimeSpent('');
                },
            },
        );
    };

    // 3. completed → ready_for_delivery
    const handleReadyForDelivery = () => {
        if (!billingDetails.trim() || !billingAmount || parseFloat(billingAmount) <= 0 || !supervisorId) return;
        setIsBillingSubmitting(true);
        router.post(
            route('job_assignments.ready', assignment.id),
            {
                billing_details: billingDetails,
                billing_amount: parseFloat(billingAmount),
                billing_confirmed_by: supervisorId,
            },
            {
                onFinish: () => {
                    setIsBillingSubmitting(false);
                    setOpenBillingDialog(false);
                    setBillingDetails('');
                    setBillingAmount('');
                    setSupervisorId('');
                },
            },
        );
    };

    // 4. ready_for_delivery → delivered
    const handleGenerateOtp = () => {
        if (!deliverById) return;
        router.post(
            route('job_assignments.generateOtp', assignment.id),
            { deliver_by: deliverById },
            {
                onSuccess: () => setIsOtpGenerated(true),
            },
        );
    };

    const handleConfirmDelivery = () => {
        if (!otpInput || otpInput.length !== 6) return;
        setIsDeliverySubmitting(true);
        router.post(
            route('job_assignments.confirm', assignment.id),
            { delivered_otp: otpInput },
            {
                onFinish: () => {
                    setIsDeliverySubmitting(false);
                    setOpenDeliveryDialog(false);
                    setDeliverById('');
                    setOtpInput('');
                    setIsOtpGenerated(false);
                },
            },
        );
    };

    // 5. delivered → verified
    const handleAdminClose = () => {
        if (!adminNote.trim() || !rating || !meritPoints || parseInt(meritPoints) < 0 || parseInt(rating) < 1 || parseInt(rating) > 5) return;
        setIsAdminSubmitting(true);
        router.post(
            route('job_assignments.close_admin', assignment.id),
            {
                admin_verification_note: adminNote,
                customer_satisfaction_rating: parseInt(rating),
                merit_points: parseInt(meritPoints),
            },
            {
                onFinish: () => {
                    setIsAdminSubmitting(false);
                    setOpenAdminDialog(false);
                    setAdminNote('');
                    setRating('');
                    setMeritPoints('');
                },
            },
        );
    };

    const getStageBadge = (stage: string | null): JSX.Element => {
        if (!stage) return <Badge variant="secondary">—</Badge>;
        const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
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
                <div className="mx-auto space-y-6 sm:px-6 lg:px-8">
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

                        <div className="flex gap-2">
                            {can.update && (
                                <Button asChild>
                                    <Link href={route('job_assignments.edit', assignment.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            )}

                            {/* Stage-specific Buttons */}
                            {assignment.stage === 'assigned' && (
                                <Button onClick={handleStartService}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Service
                                </Button>
                            )}

                            {assignment.stage === 'in_progress' && (
                                <Button onClick={() => setOpenCompleteDialog(true)} variant="default">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Mark as Completed
                                </Button>
                            )}

                            {assignment.stage === 'completed' && (
                                <Button onClick={() => setOpenBillingDialog(true)} variant="secondary">
                                    <IndianRupee className="mr-2 h-4 w-4" />
                                    Ready for Delivery
                                </Button>
                            )}

                            {assignment.stage === 'ready_for_delivery' && (
                                <Button onClick={() => setOpenDeliveryDialog(true)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirm Delivery
                                </Button>
                            )}

                            {assignment.stage === 'delivered' && can.adminClose && (
                                <Button onClick={() => setOpenAdminDialog(true)} className="bg-green-600 hover:bg-green-700">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Admin Close
                                </Button>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* 2. Complete Service Dialog */}
                    <Dialog open={openCompleteDialog} onOpenChange={setOpenCompleteDialog}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Mark as Completed</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="report">Service Report *</Label>
                                    <Textarea
                                        id="report"
                                        value={report}
                                        onChange={(e) => setReport(e.target.value)}
                                        className="mt-1 min-h-32"
                                        placeholder="Describe the work done..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="timeSpent">Time Spent (minutes) *</Label>
                                    <Input
                                        id="timeSpent"
                                        type="number"
                                        min="1"
                                        value={timeSpent}
                                        onChange={(e) => setTimeSpent(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="engineerNote">Future Note (optional)</Label>
                                    <Textarea
                                        id="engineerNote"
                                        value={engineerNote}
                                        onChange={(e) => setEngineerNote(e.target.value)}
                                        className="mt-1 min-h-24"
                                        placeholder="Notes for delivery team..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenCompleteDialog(false)} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCompleteService}
                                    disabled={!report.trim() || !timeSpent || parseInt(timeSpent) < 1 || isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Complete'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* 3. Ready for Delivery Dialog */}
                    <Dialog open={openBillingDialog} onOpenChange={setOpenBillingDialog}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Ready for Delivery</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="billingDetails">Billing Details *</Label>
                                    <Textarea
                                        id="billingDetails"
                                        value={billingDetails}
                                        onChange={(e) => setBillingDetails(e.target.value)}
                                        className="mt-1 min-h-32"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="billingAmount">Billing Amount (₹) *</Label>
                                    <Input
                                        id="billingAmount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={billingAmount}
                                        onChange={(e) => setBillingAmount(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="supervisor">Confirmed By (Supervisor) *</Label>
                                    <Select value={supervisorId} onValueChange={setSupervisorId}>
                                        <SelectTrigger id="supervisor">
                                            <SelectValue placeholder="Select supervisor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {supervisors.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenBillingDialog(false)} disabled={isBillingSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleReadyForDelivery}
                                    disabled={!billingDetails.trim() || !billingAmount || parseFloat(billingAmount) <= 0 || !supervisorId || isBillingSubmitting}
                                >
                                    {isBillingSubmitting ? 'Submitting...' : 'Mark Ready'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* 4. Confirm Delivery Dialog */}
                    <Dialog open={openDeliveryDialog} onOpenChange={setOpenDeliveryDialog}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Confirm Delivery</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="deliverBy">Deliver By *</Label>
                                    <Select value={deliverById} onValueChange={setDeliverById}>
                                        <SelectTrigger id="deliverBy">
                                            <SelectValue placeholder="Select delivery person" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {!isOtpGenerated ? (
                                    <Button onClick={handleGenerateOtp} disabled={!deliverById}>
                                        Generate & Send OTP via WhatsApp
                                    </Button>
                                ) : (
                                    <>
                                        <div>
                                            <Label htmlFor="otpInput">Enter OTP (sent to customer)</Label>
                                            <Input
                                                id="otpInput"
                                                type="text"
                                                maxLength={6}
                                                value={otpInput}
                                                onChange={(e) => setOtpInput(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            {isOtpGenerated && (
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpenDeliveryDialog(false)} disabled={isDeliverySubmitting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmDelivery}
                                        disabled={!otpInput || otpInput.length !== 6 || isDeliverySubmitting}
                                    >
                                        {isDeliverySubmitting ? 'Confirming...' : 'Confirm Delivery'}
                                    </Button>
                                </DialogFooter>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* 5. Admin Close Dialog */}
                    <Dialog open={openAdminDialog} onOpenChange={setOpenAdminDialog}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Admin Close</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="adminNote">Verification Note *</Label>
                                    <Textarea
                                        id="adminNote"
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        className="mt-1 min-h-24"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="rating">Customer Rating (1-5) *</Label>
                                    <Select value={rating} onValueChange={setRating}>
                                        <SelectTrigger id="rating">
                                            <SelectValue placeholder="Select rating" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5].map((r) => (
                                                <SelectItem key={r} value={String(r)}>
                                                    {r} ★
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="meritPoints">Merit Points *</Label>
                                    <Input
                                        id="meritPoints"
                                        type="number"
                                        min="0"
                                        value={meritPoints}
                                        onChange={(e) => setMeritPoints(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenAdminDialog(false)} disabled={isAdminSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAdminClose}
                                    disabled={!adminNote.trim() || !rating || !meritPoints || parseInt(meritPoints) < 0 || parseInt(rating) < 1 || parseInt(rating) > 5 || isAdminSubmitting}
                                >
                                    {isAdminSubmitting ? 'Closing...' : 'Close Job'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Main Grid - All Cards */}
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Job & Customer */}
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

                            {/* Assignment & Status */}
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
                                            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                                            <Badge variant="outline">{assignment.status.name}</Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Current Stage</p>
                                        {getStageBadge(assignment.stage)}
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
                                                <Separator className="my-3" />
                                                <p className="text-sm italic text-muted-foreground">Engineer Note: {assignment.engineer_note}</p>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Delivery & Billing */}
                            {(assignment.billing_amount > 0 || assignment.delivered_confirmed_at || assignment.billing_details) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Delivery & Billing</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {assignment.billing_amount > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Billing Amount</p>
                                                {/*<p className="text-xl font-bold text-green-600">₹{assignment.billing_amount.toFixed(2)}</p>*/}

                                                {assignment.billing_amount != null
                                                    ? `₹${Number(assignment.billing_amount).toFixed(2)}`
                                                    : '—'}
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
                                                <p className="font-medium">{assignment.billing_confirmed_by.name}</p>
                                            </div>
                                        )}
                                        {assignment.delivered_confirmed_at && (
                                            <>
                                                <Separator className="my-3" />
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Delivery Confirmed</p>
                                                    <p>
                                                        {format(new Date(assignment.delivered_confirmed_at), 'dd MMM yyyy HH:mm')} by {assignment.delivered_confirmed_by}
                                                    </p>
                                                </div>
                                                {assignment.delivered_otp && (
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">OTP Used</p>
                                                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{assignment.delivered_otp}</code>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Admin Verification */}
                            {assignment.stage === 'verified' && assignment.admin_verifier && (
                                <Card className="border-green-200 bg-green-50">
                                    <CardHeader>
                                        <CardTitle className="text-green-800">Admin Verification Complete</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-green-700">Verified By</p>
                                            <p className="font-medium">{assignment.admin_verifier.name}</p>
                                        </div>
                                        {assignment.admin_verified_at && (
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Verified At</p>
                                                <p>{format(new Date(assignment.admin_verified_at), 'dd MMM yyyy HH:mm')}</p>
                                            </div>
                                        )}
                                        {assignment.customer_satisfaction_rating && (
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Customer Rating</p>
                                                <p className="text-2xl font-bold">{assignment.customer_satisfaction_rating}/5 ★</p>
                                            </div>
                                        )}
                                        {assignment.admin_verification_note && (
                                            <>
                                                <Separator />
                                                <p className="text-sm italic">"{assignment.admin_verification_note}"</p>
                                            </>
                                        )}
                                        {assignment.merit_points > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Merit Points Awarded</p>
                                                <p className="text-lg font-bold">+{assignment.merit_points} points</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column: Summary */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Merit Points</span>
                                        <span className="font-medium">{assignment.merit_points > 0 ? assignment.merit_points : '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Customer Rating</span>
                                        <span className="font-medium">{assignment.customer_satisfaction_rating ? `${assignment.customer_satisfaction_rating}/5` : '—'}</span>
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
                                            <p><span className="text-muted-foreground">Audited by:</span> {assignment.auditor.name}</p>
                                        )}
                                        {assignment.audited_at && (
                                            <p><span className="text-muted-foreground">On:</span> {format(new Date(assignment.audited_at), 'dd MMM yyyy HH:mm')}</p>
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
