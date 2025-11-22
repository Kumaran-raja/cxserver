import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Package, RefreshCw } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Assignment } from '../types';

interface Props {
    assignment: Assignment;
    initialOtp?: string;
    initialMobile?: string;
}

export default function ConfirmDeliveryOtpDialog({ assignment, initialOtp = '------', initialMobile = 'N/A' }: Props) {
    const [open, setOpen] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [confirmingDelivery, setConfirmingDelivery] = useState(false);

    const confirmDelivery = () => {
        if (otpInput.length !== 6 || confirmingDelivery) return;

        setConfirmingDelivery(true);

        router.post(
            route('job_assignments.confirmDelivery', assignment.id),
            { delivered_otp: otpInput },
            {
                forceFormData: true,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setOpen(false),
                onError: (errors) => {
                    alert(errors.delivered_otp || 'Invalid OTP');
                    setOtpInput('');
                },
                onFinish: () => setConfirmingDelivery(false),
            }
        );
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                <Package className="mr-2 h-4 w-4" />
                Confirm Delivery (OTP)
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Confirm Delivery with OTP
                        </DialogTitle>
                        <DialogDescription>
                            Job #{assignment.job_card.job_no} – Enter 6-digit OTP from customer
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300">
                            <p className="text-sm text-muted-foreground mb-4">Expected OTP Display</p>
                            <div className="text-6xl font-bold font-mono tracking-widest text-green-700 opacity-70">
                                {initialOtp}
                            </div>
                            <p className="text-sm text-muted-foreground mt-5">Mobile: {initialMobile}</p>
                        </div>

                        <div>
                            <Label>Enter OTP from Customer</Label>
                            <Input
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="text-center text-4xl font-mono tracking-widest mt-2"
                                autoFocus
                                disabled={confirmingDelivery}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={confirmingDelivery}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelivery}
                            disabled={otpInput.length !== 6 || confirmingDelivery}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {confirmingDelivery ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                'Confirm Delivery'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
