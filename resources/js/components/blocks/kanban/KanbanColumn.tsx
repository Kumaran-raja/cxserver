// resources/js/components/kanban/KanbanColumn.tsx
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AssignmentCard } from './AssignmentCard';

interface Assignment {
    id: number;
    // ... same as above
}

export const KanbanColumn = ({ stage, assignments, stageId }: { stage: string; assignments: Assignment[]; stageId: string }) => {
    const ids = assignments.map(a => a.id);

    return (
        <div className="bg-muted/50 rounded-lg p-4 min-w-[300px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 capitalize">
                {stage.replace('_', ' ')} ({assignments.length})
            </h2>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="flex-1 min-h-[400px] space-y-4">
                    {assignments.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};
