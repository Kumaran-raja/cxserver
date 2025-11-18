// resources/js/Pages/JobAssignments/components/ReadyForDeliveryDialog.tsx
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { IndianRupee, FileCheck } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Assignment } from '../types';

interface Supervisor {
    id: number;
    name: string;
}

interface Props {
    assignment: Assignment;
    supervisors: Supervisor[];
}

export default function ReadyForDeliveryDialog({ assignment, supervisors }: Props) {
    const [open, setOpen] = useState(false);
    const [billingDetails, setBillingDetails] = useState('');
    const [billingAmount, setBillingAmount] = useState('');
    const [supervisorId, setSupervisorId] = useState('');
    const [loading, setLoading] = useState(false);

    const isValid =
        billingDetails.trim().length > 0 &&
        billingAmount &&
        parseFloat(billingAmount) > 0 &&
        supervisorId;

    const handleReadyForDelivery = () => {
        if (!isValid || loading) return;

        setLoading(true);

        router.post(
            route('job_assignments.ready', assignment.id),
            {
                billing_details: billingDetails.trim(),
                billing_amount: parseFloat(billingAmount),
                billing_confirmed_by: supervisorId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setOpen(false);
                    // Reset form
                    setBillingDetails('');
                    setBillingAmount('');
                    setSupervisorId('');
                },
            }
        );
    };

    return (
        <>
            {/* Trigger Button */}
            <Button onClick={() => setOpen(true)} variant="secondary">
                <IndianRupee className="mr-2 h-4 w-4" />
                Ready for Delivery
            </Button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5" />
                            Mark as Ready for Delivery
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Job #{assignment.job_card.job_no} – RMA: {assignment.job_card.service_inward.rma}
                        </p>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Billing Details */}
                        <div>
                            <Label htmlFor="billingDetails" className="flex items-center gap-1">
                                Billing Details <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="billingDetails"
                                placeholder="List all charges: Labor, Parts replaced, Taxes, etc..."
                                className="mt-2 min-h-32 resize-none"
                                value={billingDetails}
                                onChange={(e) => setBillingDetails(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {/* Billing Amount */}
                        <div>
                            <Label htmlFor="billingAmount" className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4" />
                                Total Billing Amount (₹) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="billingAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="e.g. 1250.00"
                                className="mt-2"
                                value={billingAmount}
                                onChange={(e) => setBillingAmount(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {/* Supervisor Confirmation */}
                        <div>
                            <Label htmlFor="supervisor" className="flex items-center gap-1">
                                Confirmed By (Supervisor) <span className="text-red-500">*</span>
                            </Label>
                            <Select value={supervisorId} onValueChange={setSupervisorId} disabled={loading}>
                                <SelectTrigger id="supervisor" className="mt-2">
                                    <SelectValue placeholder="Select supervisor who verified billing" />
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
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReadyForDelivery}
                            disabled={!isValid || loading}
                            className="min-w-36 bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Saving...' : 'Mark Ready for Delivery'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
