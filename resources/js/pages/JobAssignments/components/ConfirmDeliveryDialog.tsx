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
import { Package, CheckCircle, RefreshCw, MessageCircle } from 'lucide-react';
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

    const { props } = usePage();
    const flash = (props as any).flash || {};

    const isOtpGenerated = !!flash?.otpGenerated;
    const currentOtp = flash?.otp || '------';
    const customerMobile = flash?.formattedMobile || flash?.customerMobile || 'N/A';
    const whatsappNumber = flash?.whatsappNumber; // Clean 91xxxxxxxxxx

    // Auto-clear flash after showing
    useEffect(() => {
        if (isOtpGenerated && whatsappNumber) {
            const timer = setTimeout(() => {
                router.visit(route('job_assignments.show', assignment.id), {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['assignment', 'can', 'supervisors', 'users'],
                });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOtpGenerated, assignment.id, whatsappNumber]);

    // === OPEN WHATSAPP WITH OTP MESSAGE ===
    const openWhatsAppWithOtp = () => {
        if (!whatsappNumber || !currentOtp) return;

        const message = encodeURIComponent(
            `Hello ${assignment.job_card.service_inward.contact.name}!\n\nYour deliveryaf OTP for collecting repaired item (Job #${assignment.job_card.job_no}) is:\n\n*${currentOtp}*\n\nPlease share this with our delivery executive.\nThank you! 🚀\n\n— CODEXSUN Service Team`
        );

        const waUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
    };

    // Trigger OTP generation
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
                onSuccess: () => {
                    // Auto-open WhatsApp as soon as OTP is generated
                    setTimeout(openWhatsAppWithOtp, 800);
                },
            }
        );
    };

    // Confirm delivery with OTP
    const confirmDelivery = () => {
        if (otpInput.length !== 6 || loading) return;
        setLoading(true);
        router.post(
            route('job_assignments.confirmDelivery', assignment.id),
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
            <Button onClick={() => setOpen(true)} size="sm">
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
                        {/* Step 1: Choose Delivery Person */}
                        {!isOtpGenerated && (
                            <div>
                                <Label>Delivery Person</Label>
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

                        {/* Step 2: OTP Generated → Show WhatsApp Button */}
                        {isOtpGenerated ? (
                            <div className="space-y-5">
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        <strong>OTP Generated!</strong> Tap below to send via WhatsApp.
                                    </AlertDescription>
                                </Alert>

                                {/* WhatsApp Send Button */}
                                <Button
                                    onClick={openWhatsAppWithOtp}
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                                >
                                    <MessageCircle className="mr-2 h-5 w-5" />
                                    Send OTP on WhatsApp Now
                                </Button>

                                {/* Display OTP (for backup) */}
                                <div className="p-4 bg-muted/50 rounded-lg text-center border">
                                    <p className="text-sm text-muted-foreground mb-2">Backup OTP (if needed)</p>
                                    <code className="text-3xl font-mono font-bold tracking-widest text-primary">
                                        {currentOtp}
                                    </code>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Mobile: {customerMobile}
                                    </p>
                                </div>

                                {/* Enter OTP from Customer */}
                                <div>
                                    <Label>Enter OTP received from customer</Label>
                                    <Input
                                        maxLength={6}
                                        placeholder="000000"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                        className="text-center text-2xl font-mono tracking-widest mt-2"
                                        autoFocus
                                    />
                                </div>

                                <Button variant="outline" size="sm" onClick={handleResend} disabled={loading} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Regenerate & Resend OTP
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={generateOtp}
                                disabled={!deliverById || loading}
                                className="w-full h-12 text-lg bg-[#25D366] hover:bg-[#128C7E]"
                            >
                                {loading ? 'Generating...' : 'Generate OTP & Send via WhatsApp'}
                            </Button>
                        )}
                    </div>

                    {/* Confirm Button – only when OTP entered */}
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
