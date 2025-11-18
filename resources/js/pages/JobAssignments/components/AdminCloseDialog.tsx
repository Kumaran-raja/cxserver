// resources/js/Pages/JobAssignments/components/AdminCloseDialog.tsx
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
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Star, Trophy } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Assignment } from '../types';

interface Props {
    assignment: Assignment;
}

export default function AdminCloseDialog({ assignment }: Props) {
    const [open, setOpen] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [rating, setRating] = useState('');
    const [meritPoints, setMeritPoints] = useState('');
    const [loading, setLoading] = useState(false);

    const isValid =
        adminNote.trim().length > 0 &&
        rating &&
        parseInt(rating) >= 1 &&
        parseInt(rating) <= 5 &&
        meritPoints &&
        parseInt(meritPoints) >= 0;

    const handleAdminClose = () => {
        if (!isValid || loading) return;

        setLoading(true);

        router.post(
            route('job_assignments.close_admin', assignment.id),
            {
                admin_verification_note: adminNote.trim(),
                customer_satisfaction_rating: parseInt(rating),
                merit_points: parseInt(meritPoints),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setOpen(false);
                    // Reset form
                    setAdminNote('');
                    setRating('');
                    setMeritPoints('');
                },
            }
        );
    };

    return (
        <>
            {/* Trigger Button */}
            <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin Close
            </Button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-700">
                            <ShieldCheck className="h-6 w-6" />
                            Final Admin Verification & Close
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Job #{assignment.job_card.job_no} – Customer: {assignment.job_card.service_inward.contact.name}
                        </p>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Verification Note */}
                        <div>
                            <Label htmlFor="adminNote" className="flex items-center gap-1">
                                Admin Verification Note <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="adminNote"
                                placeholder="Confirm quality of work, customer communication, billing accuracy, and overall satisfaction..."
                                className="mt-2 min-h-32 resize-none"
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {/* Customer Satisfaction Rating */}
                        <div>
                            <Label className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                Customer Satisfaction Rating <span className="text-red-500">*</span>
                            </Label>
                            <Select value={rating} onValueChange={setRating} disabled={loading}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="How satisfied was the customer?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <SelectItem key={r} value={String(r)}>
                                            <span className="flex items-center gap-2">
                                                {r} Star{r > 1 && 's'} {'★'.repeat(r)} {r === 5 && 'Excellent'}
                                                {r === 4 && 'Good'}
                                                {r === 3 && 'Average'}
                                                {r === 2 && 'Below Average'}
                                                {r === 1 && 'Poor'}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Merit Points for Engineer */}
                        <div>
                            <Label htmlFor="meritPoints" className="flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-amber-600" />
                                Merit Points Awarded to Engineer <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="meritPoints"
                                type="number"
                                min="0"
                                placeholder="e.g. 10 (0 = no extra points)"
                                className="mt-2"
                                value={meritPoints}
                                onChange={(e) => setMeritPoints(e.target.value)}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Based on quality, speed, customer feedback, and complexity.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAdminClose}
                            disabled={!isValid || loading}
                            className="min-w-40 bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Closing Job...' : 'Close Job Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
