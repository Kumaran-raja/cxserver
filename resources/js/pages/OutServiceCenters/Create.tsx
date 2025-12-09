// resources/js/Pages/OutServiceCenters/Create.tsx
import JobCardAutocomplete from '@/components/blocks/JobCardAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRoute } from 'ziggy-js';

interface JobCard {
    id: number;
    job_no: string;
    rma: string;
    contact: { id: number; name: string };
    material_type: string;
    delivered_at: string | null;
    service_inward: { brand: string | null; model: string | null };
}

interface User {
    id: number;
    name: string;
    email?: string | null;
}

export default function Create() {
    const route = useRoute();
    const { users } = usePage().props as { users: User[] };

    const { data, setData, post, processing, errors } = useForm({
        job_card_id: '',
        service_name: '',
        sent_at: '',
        expected_back: '',
        cost: '',
        service_status_id: '',
        notes: '',
        user_id: '',
        material_name: '',
    });

    const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(
        null,
    );
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleJobCardSelect = (jobCard: JobCard | null) => {
        setSelectedJobCard(jobCard);
        setData('job_card_id', jobCard ? String(jobCard.id) : '');
    };

    const handleUserSelect = (user: User | null) => {
        setSelectedUser(user);
        setData('user_id', user ? String(user.id) : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('out_service_centers.store'));
    };

    return (
        <Layout>
            <Head title="Add Out Service Center" />
            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('out_service_centers.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">
                            Add Out Service Center
                        </h1>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-8 rounded-lg bg-white text-black p-6 shadow"
                    >
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* JOB CARD AUTOCOMPLETE */}
                            <div className="md:col-span-2">
                                <Label>Job Card *</Label>
                                <JobCardAutocomplete
                                    value={selectedJobCard}
                                    onSelect={handleJobCardSelect}
                                    placeholder="Search by RMA, Job #, Contact..."
                                    onCreateNew={(rma) =>
                                        router.visit(route('jobcards.create'), {
                                            data: { rma },
                                        })
                                    }
                                />
                                {errors.job_card_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.job_card_id}
                                    </p>
                                )}
                            </div>

                            {/* SERVICE NAME */}
                            <div>
                                <Label htmlFor="service_name">
                                    Service Name *
                                </Label>
                                <Input
                                    id="service_name"
                                    value={data.service_name}
                                    onChange={(e) =>
                                        setData('service_name', e.target.value)
                                    }
                                />
                                {errors.service_name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.service_name}
                                    </p>
                                )}
                            </div>

                            {/* SENT AT */}
                            <div>
                                <Label htmlFor="sent_at">Sent At *</Label>
                                <Input
                                    id="sent_at"
                                    type="datetime-local"
                                    value={data.sent_at}
                                    onChange={(e) =>
                                        setData('sent_at', e.target.value)
                                    }
                                />
                                {errors.sent_at && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.sent_at}
                                    </p>
                                )}
                            </div>

                            {/* EXPECTED BACK */}
                            <div>
                                <Label htmlFor="expected_back">
                                    Expected Back
                                </Label>
                                <Input
                                    id="expected_back"
                                    type="date"
                                    value={data.expected_back}
                                    onChange={(e) =>
                                        setData('expected_back', e.target.value)
                                    }
                                />
                            </div>

                            {/* COST */}
                            <div>
                                <Label htmlFor="cost">Cost</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    value={data.cost}
                                    onChange={(e) =>
                                        setData('cost', e.target.value)
                                    }
                                />
                            </div>

                            {/* SERVICE STATUS */}
                            <div>
                                <Label htmlFor="service_status_id">
                                    Status *
                                </Label>
                                <Select
                                    value={data.service_status_id}
                                    onValueChange={(v) =>
                                        setData('service_status_id', v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Sent</SelectItem>
                                        <SelectItem value="2">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="3">
                                            Received
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.service_status_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.service_status_id}
                                    </p>
                                )}
                            </div>

                            {/* TECHNICIAN SELECT */}
                            <div>
                                <Label htmlFor="user_id">
                                    Technician{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.user_id}
                                    onValueChange={(v) => {
                                        setData('user_id', v);
                                        const user =
                                            users.find(
                                                (u) => String(u.id) === v,
                                            ) ?? null;
                                        setSelectedUser(user);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select technician" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem
                                                key={u.id}
                                                value={String(u.id)}
                                            >
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.user_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="material_name">
                                    Material Name
                                </Label>
                                <Textarea
                                    id="material_name"
                                    value={data.material_name}
                                    onChange={e => setData('material_name', e.target.value)}
                                    placeholder="e.g., Dell Laptop, HP Printer..."
                                />
                                {errors.material_name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.material_name}
                                    </p>
                                )}
                            </div>

                            {/* NOTES */}
                            <div className="md:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('out_service_centers.index')}>
                                    Cancel
                                </Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.job_card_id ||
                                    !data.user_id
                                }
                            >
                                {processing ? 'Creating...' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
