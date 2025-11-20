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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Package, RefreshCw, MessageCircle, Send } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Assignment } from '../types';

interface Props {
    assignment: Assignment;
    users: { id: number; name: string }[];
}

export default function ConfirmDeliveryDialog({ assignment, users }: Props) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'select' | 'otp'>('select');
    const [deliverById, setDeliverById] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [loading, setLoading] = useState(false);

    const [otp, setOtp] = useState('------');
    const [mobile, setMobile] = useState('N/A');
    const [waNumber, setWaNumber] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    const openDialog = () => {
        setOpen(true);
        setStep('select');
        setDeliverById('');
        setOtpInput('');
        setOtp('------');
        setMobile('N/A');
        setWaNumber('');
        setShowAlert(false);
        setLoading(false);
    };

// ConfirmDeliveryDialog.tsx – FINAL BULLETPROOF VERSION
    const generateOtp = () => {
        if (!deliverById || loading) return;
        setLoading(true);

        // FORCE POST METHOD + REFRESH CSRF IF NEEDED
        router.post(
            route('job_assignments.generateOtp', assignment.id),
            { deliver_by: deliverById },
            {
                preserveState: true,
                preserveScroll: true,
                forceFormData: true, // ← THIS FIXES THE GET ERROR!
                onSuccess: (page: any) => {
                    const flash = page.props.flash || {};
                    console.log('OTP Generated:', flash);

                    if (flash.otp) {
                        setOtp(flash.otp);
                        setMobile(flash.formattedMobile || flash.customerMobile || 'N/A');
                        setWaNumber((flash.whatsappNumber || '').replace(/[^0-9]/g, ''));
                        setStep('otp');
                        setShowAlert(true);

                        setTimeout(() => {
                            const message = encodeURIComponent(
                                `Hello ${assignment.job_card.service_inward.contact.name}!\n\nYour delivery OTP for collecting repaired item (Job #${assignment.job_card.job_no}) is:\n\n*${flash.otp}*\n\nPlease share this with our delivery executive.\nThank you! 🚀\n\n— CODEXSUN Service Team`
                            );
                            window.open(`https://wa.me/${(flash.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
                        }, 800);
                    }
                    setLoading(false);
                },
                onError: (errors) => {
                    setLoading(false);
                    alert('Error: ' + JSON.stringify(errors));
                },
            }
        );
    };

    const confirmDelivery = () => {
        if (otpInput.length !== 6 || loading) return;
        setLoading(true);

        router.post(
            route('job_assignments.confirmDelivery', assignment.id),
            { delivered_otp: otpInput },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
                onSuccess: () => setOpen(false),
            }
        );
    };

    const resend = () => {
        setOtpInput('');
        setOtp('------');
        setShowAlert(false);
        generateOtp();
    };

    const alertMessage = `Hello ${assignment.job_card.service_inward.contact.name}!\n\nYour delivery OTP for collecting repaired item (Job #${assignment.job_card.job_no}) is:\n\n*${otp}*\n\nPlease share this with our delivery executive.\nThank you! 🚀\n\n— CODEXSUN Service Team`;

    return (
        <>
            <Button onClick={openDialog} size="sm">
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

                    <div className="py-6 space-y-6">
                        {step === 'select' && (
                            <>
                                <div>
                                    <Label>Delivery Person</Label>
                                    <Select value={deliverById} onValueChange={setDeliverById}>
                                        <SelectTrigger className="mt-2">
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

                                <Button
                                    onClick={generateOtp}
                                    disabled={!deliverById || loading}
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-12 text-lg"
                                >
                                    {loading ? 'Generating OTP...' : 'Generate OTP & Send'}
                                </Button>
                            </>
                        )}

                        {step === 'otp' && (
                            <>
                                {showAlert && (
                                    <Alert className="bg-green-50 border-green-300">
                                        <Send className="h-5 w-5 text-green-600" />
                                        <AlertTitle className="text-green-800 font-bold">OTP Message Ready!</AlertTitle>
                                        <AlertDescription className="text-sm whitespace-pre-line mt-2">
                                            {alertMessage}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300">
                                    <p className="text-sm text-muted-foreground mb-4">Customer OTP</p>
                                    <div className="text-7xl font-bold font-mono tracking-widest text-green-700">
                                        {otp}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-5">Mobile: {mobile}</p>
                                </div>

                                <Button
                                    onClick={() => {
                                        const message = encodeURIComponent(alertMessage);
                                        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-12"
                                >
                                    <MessageCircle className="mr-2 h-5 w-5" />
                                    Resend on WhatsApp
                                </Button>

                                <div>
                                    <Label>Enter OTP from Customer</Label>
                                    <Input
                                        maxLength={6}
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="text-center text-4xl font-mono tracking-widest mt-2"
                                        autoFocus
                                    />
                                </div>

                                <Button variant="outline" onClick={resend} disabled={loading} className="w-full">
                                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Regenerate OTP
                                </Button>
                            </>
                        )}
                    </div>

                    {step === 'otp' && (
                        <DialogFooter className="gap-3">
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
