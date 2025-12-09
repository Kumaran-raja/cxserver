// resources/js/Pages/OutServiceCenters/Edit.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import JobCardAutocomplete from '@/components/blocks/JobCardAutocomplete';

interface JobCard {
    id: number;
    job_no: string;
    rma: string;
    contact: { id: number; name: string };
    material_name: string;
    delivered_at: string | null;
    service_inward: { brand: string | null; model: string | null };
}

interface User {
    id: number;
    name: string;
    email?: string | null;
}

interface OutServiceCenter {
    id: number;
    job_card_id: number;
    job_card: JobCard;
    service_name: string;
    sent_at: string;
    expected_back: string | null;
    cost: string | null;
    service_status_id: number;
    notes: string | null;
    user_id: number;
    user: User;
    material_name: string | null;
}

export default function Edit() {
    const route = useRoute();
    const { center, users } = usePage().props as { center: OutServiceCenter; users: User[] };

    const { data, setData, put, processing, errors } = useForm({
        job_card_id: String(center.job_card_id),
        service_name: center.service_name,
        sent_at: center.sent_at.slice(0, 16),
        user_id: String(center.user_id),
        expected_back: center.expected_back ?? '',
        cost: center.cost ?? '',
        service_status_id: String(center.service_status_id),
        material_name: center.material_name ?? '',
        notes: center.notes ?? '',
    });

    const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(center.job_card);
    const [selectedUser, setSelectedUser] = useState<User | null>(center.user);

    const handleJobCardSelect = (jobCard: JobCard | null) => {
        setSelectedJobCard(jobCard);
        setData('job_card_id', jobCard ? String(jobCard.id) : '');
    };

    const handleUserChange = (value: string) => {
        setData('user_id', value);
        const user = users.find(u => String(u.id) === value) ?? null;
        setSelectedUser(user);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('out_service_centers.update', center.id));
    };

    return (
        <Layout>
            <Head title={`Edit – ${center.service_name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('out_service_centers.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Edit Out Service Center</h1>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-8 rounded-lg bg-white text-black p-6 shadow"
                    >
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            {/* JOB CARD AUTOCOMPLETE – PRE-FILLED */}
                            <div className="md:col-span-2">
                                <Label>Job Card *</Label>
                                <JobCardAutocomplete
                                    value={selectedJobCard}
                                    onSelect={handleJobCardSelect}
                                    placeholder="Search by RMA, Job #, Contact..."
                                    onCreateNew={(rma) => router.visit(route('jobcards.create'), { data: { rma } })}
                                />
                                {errors.job_card_id && <p className="mt-1 text-sm text-red-600">{errors.job_card_id}</p>}
                            </div>

                            {/* SERVICE NAME */}
                            <div>
                                <Label htmlFor="service_name">Service Name *</Label>
                                <Input
                                    id="service_name"
                                    value={data.service_name}
                                    onChange={e => setData('service_name', e.target.value)}
                                />
                                {errors.service_name && <p className="mt-1 text-sm text-red-600">{errors.service_name}</p>}
                            </div>

                            {/* SENT AT */}
                            <div>
                                <Label htmlFor="sent_at">Sent At *</Label>
                                <Input
                                    id="sent_at"
                                    type="datetime-local"
                                    value={data.sent_at}
                                    onChange={e => setData('sent_at', e.target.value)}
                                />
                                {errors.sent_at && <p className="mt-1 text-sm text-red-600">{errors.sent_at}</p>}
                            </div>

                            {/* EXPECTED BACK */}
                            <div>
                                <Label htmlFor="expected_back">Expected Back</Label>
                                <Input
                                    id="expected_back"
                                    type="date"
                                    value={data.expected_back}
                                    onChange={e => setData('expected_back', e.target.value)}
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
                                    onChange={e => setData('cost', e.target.value)}
                                />
                            </div>

                            {/* SERVICE STATUS */}
                            <div>
                                <Label htmlFor="service_status_id">Status *</Label>
                                <Select value={data.service_status_id} onValueChange={v => setData('service_status_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Sent</SelectItem>
                                        <SelectItem value="2">In Progress</SelectItem>
                                        <SelectItem value="3">Received</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.service_status_id && <p className="mt-1 text-sm text-red-600">{errors.service_status_id}</p>}
                            </div>

                            {/* TECHNICIAN SELECT */}
                            <div>
                                <Label htmlFor="user_id">
                                    Technician <span className="text-red-500">*</span>
                                </Label>
                                <Select value={data.user_id} onValueChange={handleUserChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select technician" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>}
                            </div>

                            {/* MATERIAL NAME */}
                            <div>
                                <Label htmlFor="material_name">Material Name</Label>
                                <Textarea
                                    id="material_name"
                                    rows={2}
                                    value={data.material_name}
                                    onChange={e => setData('material_name', e.target.value)}
                                    placeholder="e.g., Dell Laptop, HP Printer..."
                                />
                                {errors.material_name && <p className="mt-1 text-sm text-red-600">{errors.material_name}</p>}
                            </div>

                            {/* NOTES */}
                            <div className="md:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    rows={3}
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('out_service_centers.index')}>Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !data.job_card_id || !data.user_id}
                            >
                                {processing ? 'Saving...' : 'Update'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
