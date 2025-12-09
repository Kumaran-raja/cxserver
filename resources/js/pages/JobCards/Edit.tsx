// resources/js/Pages/JobCards/Edit.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import ServiceInwardAutocomplete from '@/components/blocks/ServiceInwardAutocomplete';
import React, { useEffect } from 'react';
import { ServiceInward } from '@/types';

interface JobCard {
    id: number;
    service_inward_id: number;
    user_id: number;
    service_status_id: number;
    diagnosis: string | null;
    estimated_cost: string | null;
    advance_paid: string | null;
    remarks: string | null;
    spares_applied: string | null;
    service_inward: ServiceInward;
    status: { id: number; name: string };
    user: { id: number; name: string };
    entryBy?: { id: number; name: string } | null;  // Optional
}

interface UserOption {
    id: number;
    name: string;
}

interface Props {
    job: JobCard;
    users: UserOption[];
}

export default function Edit() {
    const route = useRoute();
    const { job, users } = usePage().props as unknown as Props;
    const [selectedInward, setSelectedInward] = React.useState<ServiceInward | null>(null);

    const { data, setData, put, processing, errors } = useForm({
        service_inward_id: String(job.service_inward_id),
        user_id: String(job.user_id),
        diagnosis: job.diagnosis || '',
        estimated_cost: job.estimated_cost || '',
        advance_paid: job.advance_paid || '',
        remarks: job.remarks || '',
        spares_applied: job.spares_applied || '',
    });

    useEffect(() => {
        setSelectedInward(job.service_inward);
        setData('service_inward_id', String(job.service_inward_id));
    }, [job]);

    const handleInwardSelect = (inward: ServiceInward | null) => {
        setSelectedInward(inward);
        setData('service_inward_id', inward ? String(inward.id) : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('job_cards.update', job.id));
    };

    return (
        <Layout>
            <Head title="Edit Job Card" />
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('job_cards.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Job Card</h1>
                            <p className="text-muted-foreground">
                                Job No: <strong>JOB-{String(job.id).padStart(6, '0')}</strong>
                                {job.entryBy && (
                                    <> | Entered by: <strong>{job.entryBy.name}</strong></>
                                )}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-white text-black p-6 rounded-lg shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Service Inward */}
                            <div>
                                <Label htmlFor="service_inward_id">
                                    Service Inward <span className="text-red-500">*</span>
                                </Label>
                                <ServiceInwardAutocomplete
                                    value={selectedInward}
                                    onSelect={handleInwardSelect}
                                    placeholder="Search by RMA, Serial, Customer..."
                                />
                                {errors.service_inward_id && (
                                    <p className="text-sm text-red-600 mt-1">{errors.service_inward_id}</p>
                                )}
                            </div>

                            {/* Assigned Technician */}
                            <div>
                                <Label htmlFor="user_id">
                                    First Diagnosis by <span className="text-red-500">*</span>
                                </Label>
                                <Select value={data.user_id} onValueChange={(v) => setData('user_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && (
                                    <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>
                                )}
                            </div>

                            {/* Diagnosis */}
                            <div className="md:col-span-2">
                                <Label htmlFor="diagnosis">Diagnosis</Label>
                                <Textarea
                                    id="diagnosis"
                                    value={data.diagnosis}
                                    onChange={(e) => setData('diagnosis', e.target.value)}
                                    placeholder="Describe the issue..."
                                    rows={4}
                                />
                            </div>

                            {/* Cost Fields */}
                            <div>
                                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                                <Input
                                    id="estimated_cost"
                                    type="number"
                                    step="0.01"
                                    value={data.estimated_cost}
                                    onChange={(e) => setData('estimated_cost', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="advance_paid">Advance Paid</Label>
                                <Input
                                    id="advance_paid"
                                    type="number"
                                    step="0.01"
                                    value={data.advance_paid}
                                    onChange={(e) => setData('advance_paid', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Remarks & Spares */}
                            <div>
                                <Label htmlFor="remarks">Remarks</Label>
                                <Input
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    placeholder="e.g. Customer approved, parts pending..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="spares_applied">Spares Applied</Label>
                                <Input
                                    id="spares_applied"
                                    value={data.spares_applied}
                                    onChange={(e) => setData('spares_applied', e.target.value)}
                                    placeholder="Yes, No, HDD+RAM"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('job_cards.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Job Card'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
