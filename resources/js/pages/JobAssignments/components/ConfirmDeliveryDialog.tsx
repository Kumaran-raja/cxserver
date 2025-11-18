// resources/js/Pages/JobAssignments/components/ConfirmDeliveryDialog.tsx
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, CheckCircle, RefreshCw } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Assignment } from '../types';

interface Props {
    assignment: Assignment;
    users: { id: number; name: string }[];
}

export default function ConfirmDeliveryDialog({ assignment, users }: Props) {
    const [open, setOpen] = useState(false);
    const [deliverById, setDeliverById] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Safely read flash data
    const { props } = usePage();
    const flash = (props as any).flash || {};

    const isOtpGenerated = !!flash?.otpGenerated;
    const currentOtp = flash?.otp || '------';
    const customerMobile = flash?.formattedMobile || flash?.customerMobile || 'N/A';

    // Clear flash messages after reading (prevents re-trigger)
    useEffect(() => {
        if (isOtpGenerated) {
            // Auto-clear flash after 2 seconds to avoid stale data on reopen
            const timer = setTimeout(() => {
                router.visit(route('job_assignments.show', assignment.id), {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['assignment', 'can', 'supervisors', 'users'],
                });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOtpGenerated, assignment.id]);

    const generateOtp = () => {
        if (!deliverById || loading) return;
        setLoading(true);
        router.post(
            route('job_assignments.generateOtp', assignment.id),
            { deliver_by: deliverById },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            }
        );
    };

    const confirmDelivery = () => {
        if (otpInput.length !== 6 || loading) return;
        setLoading(true);
        router.post(
            route('job_assignments.confirm', assignment.id),
            { delivered_otp: otpInput },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setOpen(false);
                    setOtpInput('');
                    setDeliverById('');
                },
            }
        );
    };

    const handleResend = () => {
        setOtpInput('');
        generateOtp();
    };

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Confirm Delivery
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Confirm Delivery
                        </DialogTitle>
                        <DialogDescription>
                            Job #{assignment.job_card.job_no} – {assignment.job_card.service_inward.contact.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Select Delivery Person */}
                        {!isOtpGenerated && (
                            <div>
                                <Label>Label>Delivery Person</Label>
                                <Select value={deliverById} onValueChange={setDeliverById}>
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Who will deliver?" />
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
                        )}

                        {/* OTP Generated State */}
                        {isOtpGenerated ? (
                            <div className="space-y-4">
                                {/* Success Alert */}
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        <strong>OTP Generated Successfully!</strong>
                                    </AlertDescription>
                                </Alert>

                                {/* Display OTP & Mobile */}
                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border text-center">
                                    <p className="text-sm text-muted-foreground">Send this OTP to customer:</p>
                                    <div className="text-4xl font-mono font-bold tracking-wider text-primary">
                                        {currentOtp}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Customer Mobile: <strong>{customerMobile}</strong>
                                    </p>
                                </div>

                                {/* Enter OTP */}
                                <div>
                                    <Label>Ask Customer for OTP</Label>
                                    <Input
                                        maxLength={6}
                                        placeholder="Enter 6-digit OTP"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                        className="text-center text-2xl font-mono tracking-wider mt-2"
                                        autoFocus
                                    />
                                </div>

                                {/* Resend Option */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend OTP
                                </Button>
                            </div>
                        ) : (
                            /* Generate OTP Button */
                            <Button
                                onClick={generateOtp}
                                disabled={!deliverById || loading}
                                className="w-full h-12 text-lg"
                            >
                                {loading ? 'Generating OTP...' : 'Generate OTP'}
                            </Button>
                        )}
                    </div>

                    {/* Footer - Only show Confirm when OTP entered */}
                    {isOtpGenerated && (
                        <DialogFooter className="flex sm:justify-between gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDelivery}
                                disabled={otpInput.length !== 6 || loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {loading ? 'Confirming...' : 'Confirm Delivery'}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
