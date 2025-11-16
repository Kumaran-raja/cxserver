// resources/js/components/kanban/AssignmentCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';

interface Assignment {
    id: number;
    job_card: { job_no: string; service_inward: { rma: string } };
    user: { name: string };
    time_spent_minutes: number;
    billing_amount?: number | null;
    merit_points: number;
    status: { name: string };
}

export const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: assignment.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="mb-4 cursor-grab active:cursor-grabbing"
            {...attributes}
        >
            <CardHeader className="p-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-sm font-medium">
                        {assignment.job_card.job_no}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        RMA: {assignment.job_card.service_inward.rma}
                    </p>
                </div>
                <button {...listeners} className="text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-4 w-4" />
                </button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-1 text-xs">
                <p><strong>Engineer:</strong> {assignment.user.name}</p>
                <p><strong>Time Spent:</strong> {assignment.time_spent_minutes || '—'} min</p>
                <p>
                    <strong>Billing:</strong>{' '}
                    {assignment.billing_amount != null
                        ? `₹${Number(assignment.billing_amount).toFixed(2)}`
                        : '—'}
                </p>
                <p><strong>Merit:</strong> {assignment.merit_points || '—'}</p>
                <Badge variant="outline">{assignment.status.name}</Badge>
            </CardContent>
        </Card>
    );
};
