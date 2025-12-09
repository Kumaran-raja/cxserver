// resources/js/Pages/JobCards/Create.tsx
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
import React from 'react';
import { ServiceInward } from '@/types';

interface StatusOption {
    id: number;
    name: string;
}

interface UserOption {
    id: number;
    name: string;
}

interface Props {
    inwards: never[];
    statuses: StatusOption[];
    users: UserOption[];  // Added
}

export default function Create() {
    const route = useRoute();
    const { users } = usePage().props as unknown as Props;
    const [selectedInward, setSelectedInward] = React.useState<ServiceInward | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        service_inward_id: '',
        user_id: '',           // Assigned technician
        service_status_id: '1',
        diagnosis: '',
        estimated_cost: '0',
        advance_paid: '0',
        remarks: '',
        spares_applied: '',
    });

    const handleInwardSelect = (inward: ServiceInward | null) => {
        setSelectedInward(inward);
        setData('service_inward_id', inward ? String(inward.id) : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('job_cards.store'));
    };

    return (
        <Layout>
            <Head title="Create Job Card" />
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('job_cards.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">New Job Card</h1>
                            <p className="text-muted-foreground">Create a service job</p>
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
                                        <SelectValue placeholder="Select technician..." />
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
                                <Textarea className="h-32"
                                          id="diagnosis"
                                          value={data.diagnosis}
                                          onChange={(e) => setData('diagnosis', e.target.value)}
                                          placeholder="Describe the issue..."
                                          rows={3}
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
                                {processing ? 'Creating...' : 'Create Job Card'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
