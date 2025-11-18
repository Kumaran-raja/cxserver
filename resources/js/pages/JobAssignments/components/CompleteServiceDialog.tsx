// resources/js/Pages/JobAssignments/components/CompleteServiceDialog.tsx
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
import { FileText, Clock } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Assignment } from '../types';

interface Props {
    assignment: Assignment;
}

export default function CompleteServiceDialog({ assignment }: Props) {
    const [open, setOpen] = useState(false);
    const [report, setReport] = useState('');
    const [timeSpent, setTimeSpent] = useState('');
    const [engineerNote, setEngineerNote] = useState('');
    const [loading, setLoading] = useState(false);

    const isValid = report.trim().length > 0 && timeSpent && parseInt(timeSpent) >= 1;

    const handleCompleteService = () => {
        if (!isValid || loading) return;

        setLoading(true);

        router.post(
            route('job_assignments.complete_service', assignment.id),
            {
                report: report.trim(),
                time_spent_minutes: parseInt(timeSpent),
                engineer_note: engineerNote.trim() || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    setOpen(false);
                    setReport('');
                    setTimeSpent('');
                    setEngineerNote('');
                },
            }
        );
    };

    return (
        <>
            {/* Trigger Button */}
            <Button onClick={() => setOpen(true)} size="default">
                <FileText className="mr-2 h-4 w-4" />
                Mark as Completed
            </Button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Complete Service - Job #{assignment.job_card.job_no}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Service Report */}
                        <div>
                            <Label htmlFor="report" className="flex items-center gap-1">
                                Service Report <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="report"
                                placeholder="Describe the repair/work done, issues found, and solution applied..."
                                className="mt-2 min-h-32 resize-none"
                                value={report}
                                onChange={(e) => setReport(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {/* Time Spent */}
                        <div>
                            <Label htmlFor="timeSpent" className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Time Spent (minutes) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="timeSpent"
                                type="number"
                                min="1"
                                placeholder="e.g. 45"
                                className="mt-2"
                                value={timeSpent}
                                onChange={(e) => setTimeSpent(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {/* Engineer Note (Optional) */}
                        <div>
                            <Label htmlFor="engineerNote">
                                Note for Delivery Team (optional)
                            </Label>
                            <Textarea
                                id="engineerNote"
                                placeholder="Any special instructions, pending items, or customer requests..."
                                className="mt-2 min-h-24 resize-none"
                                value={engineerNote}
                                onChange={(e) => setEngineerNote(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCompleteService}
                            disabled={!isValid || loading}
                            className="min-w-32"
                        >
                            {loading ? 'Submitting...' : 'Complete Service'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
