// resources/js/Pages/JobAssignments/components/StartServiceButton.tsx
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    assignmentId: number;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
    className?: string;
}

export default function StartServiceButton({
                                               assignmentId,
                                               size = 'default',
                                               variant = 'default',
                                               className = '',
                                           }: Props) {
    const [loading, setLoading] = useState(false);

    const handleStartService = () => {
        if (loading) return;

        setLoading(true);

        router.post(
            route('job_assignments.start_service', assignmentId),
            {},
            {
                onFinish: () => setLoading(false),
                onError: () => setLoading(false),
                preserveScroll: true,
            }
        );
    };

    return (
        <Button
            onClick={handleStartService}
            disabled={loading}
            size={size}
            variant={variant}
            className={`font-medium ${className}`}
        >
            <Play className="mr-2 h-4 w-4" />
            {loading ? 'Starting...' : 'Start Service'}
        </Button>
    );
}
