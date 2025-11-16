// resources/js/Pages/JobAssignments/Kanban.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useState, useCallback } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, GripVertical } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { index as job_assignments } from '@/routes/job_assignments';

// Reusable Sortable AssignmentCard
const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
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
                <p><strong>Time Spent:</strong> {assignment.time_spent_minutes ?? '—'} min</p>
                <p>
                    <strong>Billing:</strong>{' '}
                    {assignment.billing_amount != null
                        ? `₹${Number(assignment.billing_amount).toFixed(2)}`
                        : '—'}
                </p>
                <p><strong>Merit:</strong> {assignment.merit_points ?? '—'}</p>
                <Badge variant="outline">{assignment.status.name}</Badge>
            </CardContent>
        </Card>
    );
};

// Reusable KanbanColumn
const KanbanColumn = ({
                          stage,
                          assignments,
                          stageId,
                      }: {
    stage: string;
    assignments: Assignment[];
    stageId: string;
}) => {
    const ids = assignments.map((a) => a.id);

    return (
        <div className="flex min-w-[300px] flex-col rounded-lg bg-muted/50 p-4">
            <h2 className="mb-4 text-lg font-semibold capitalize">
                {stage.replace('_', ' ')} ({assignments.length})
            </h2>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="min-h-[400px] flex-1 space-y-4">
                    {assignments.map((assignment) => (
                        <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};

interface Assignment {
    id: number;
    job_card: {
        id: number;
        job_no: string;
        service_inward: { rma: string; contact: { name: string } };
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
    billing_amount?: number | null;
    delivered_confirmed_at: string | null;
    admin_verifier: { id: number; name: string } | null;
    deleted_at: string | null;
}

interface Props {
    assignments: { [key: string]: Assignment[] };
    stages: string[];
    can: { create: boolean; update_stage: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Job Assignments', href: job_assignments().url },
    { title: 'Kanban View', href: '#' },
];

export default function Kanban() {
    const { assignments: initialAssignments, stages, can } = usePage().props as unknown as Props;
    const route = useRoute();

    const [assignments, setAssignments] = useState(initialAssignments);
    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const findAssignment = (id: number): { assignment: Assignment; stage: string } | null => {
        for (const stage in assignments) {
            const assignment = assignments[stage].find(a => a.id === id);
            if (assignment) return { assignment, stage };
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(Number(event.active.id));
    };

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = Number(active.id);
        const overId = Number(over.id);

        const source = findAssignment(activeId);
        if (!source) return;

        const destination = findAssignment(overId);
        const destStage = destination ? destination.stage : source.stage;

        if (source.stage === destStage && activeId === overId) return;

        const newAssignments = { ...assignments };

        // Remove from source
        newAssignments[source.stage] = newAssignments[source.stage].filter(a => a.id !== activeId);

        // Find new position
        const destAssignments = newAssignments[destStage];
        let newIndex = destAssignments.findIndex(a => a.id === overId);
        if (newIndex === -1) newIndex = destAssignments.length;

        // Insert at new position
        const movedAssignment = { ...source.assignment, stage: destStage };
        destAssignments.splice(newIndex, 0, movedAssignment);

        // Update positions
        destAssignments.forEach((item, idx) => {
            item.position = idx;
        });

        setAssignments(newAssignments);
        setActiveId(null);

        try {
            await router.patch(route('job_assignments.position'), {
                assignment_id: activeId,
                stage: destStage,
                position: newIndex,
            });
        } catch (error) {
            setAssignments(initialAssignments);
        }
    }, [assignments, initialAssignments, route]);

    const activeAssignment = activeId ? findAssignment(activeId)?.assignment : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Job Assignments Kanban" />

            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-black/50">
                                Job Assignments - Kanban
                            </h1>
                            <p className="mt-1 text-sm text-black/30">
                                Drag and drop assignments across stages
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {can.create && (
                                <Button asChild>
                                    <Link href={route('job_assignments.create')}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Assign Job
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="outline">
                                <Link href={route('job_assignments.index')}>
                                    List View
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Kanban Board */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex overflow-x-auto gap-4 pb-4">
                            {stages.map((stage) => (
                                <KanbanColumn
                                    key={stage}
                                    stage={stage}
                                    assignments={assignments[stage] || []}
                                    stageId={stage}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeAssignment ? (
                                <Card className="shadow-lg">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-sm font-medium">
                                            {`Job ${activeAssignment.job_card.job_no}`}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            RMA: {activeAssignment.job_card.service_inward.rma}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-1 text-xs">
                                        <p><strong>Engineer:</strong> {activeAssignment.user.name}</p>
                                        <p><strong>Time Spent:</strong> {activeAssignment.time_spent_minutes ?? '—'} min</p>
                                        <p>
                                            <strong>Billing:</strong>{' '}
                                            {activeAssignment.billing_amount != null
                                                ? `₹${Number(activeAssignment.billing_amount).toFixed(2)}`
                                                : '—'}
                                        </p>
                                        <Badge variant="outline">{activeAssignment.status.name}</Badge>
                                    </CardContent>
                                </Card>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>
        </AppLayout>
    );
}
