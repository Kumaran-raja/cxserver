// resources/js/Pages/JobSpareRequests/Create.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

interface JobCardOption {
    id: number;
    job_no: string;
    service_inward: { rma: string; contact: { name: string } };
}

interface PartOption {
    id: number;
    part_code: string;
    name: string;
    current_stock: number;
}

interface UserOption {
    id: number;
    name: string;
}

interface Props {
    jobCards: JobCardOption[];
    parts: PartOption[];
    technicians: UserOption[];
}

export default function Create() {
    const route = useRoute();
    const { jobCards, parts, technicians } = usePage().props as unknown as Props;

    const { data, setData, post, processing, errors } = useForm({
        job_card_id: '',
        service_part_id: '',
        qty_requested: '',
        user_id: '',
        remarks: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('job_spare_requests.store'));
    };

    return (
        <Layout>
            <Head title="Request Spare Part" />
            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('job_spare_requests.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Request Spare Part</h1>
                            <p className="text-muted-foreground">Request spare for an active job</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-white text-black p-6 rounded-lg shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <Label htmlFor="job_card_id">Job Card <span className="text-red-500">*</span></Label>
                                <Select value={data.job_card_id} onValueChange={v => setData('job_card_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                                    <SelectContent>
                                        {jobCards.map(jc => (
                                            <SelectItem key={jc.id} value={String(jc.id)}>
                                                {jc.job_no} – {jc.service_inward.rma} ({jc.service_inward.contact.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.job_card_id && <p className="mt-1 text-sm text-red-600">{errors.job_card_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="service_part_id">Spare Part <span className="text-red-500">*</span></Label>
                                <Select value={data.service_part_id} onValueChange={v => setData('service_part_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
                                    <SelectContent>
                                        {parts.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.part_code} – {p.name} (Stock: {p.current_stock})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.service_part_id && <p className="mt-1 text-sm text-red-600">{errors.service_part_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="qty_requested">Qty Requested <span className="text-red-500">*</span></Label>
                                <Input
                                    id="qty_requested"
                                    type="number"
                                    min="1"
                                    value={data.qty_requested}
                                    onChange={e => setData('qty_requested', e.target.value)}
                                />
                                {errors.qty_requested && <p className="mt-1 text-sm text-red-600">{errors.qty_requested}</p>}
                            </div>

                            <div>
                                <Label htmlFor="user_id">Requested By <span className="text-red-500">*</span></Label>
                                <Select value={data.user_id} onValueChange={v => setData('user_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                                    <SelectContent>
                                        {technicians.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="remarks">Remarks (optional)</Label>
                                <Textarea
                                    id="remarks"
                                    rows={3}
                                    value={data.remarks}
                                    onChange={e => setData('remarks', e.target.value)}
                                />
                            </div>

                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('job_spare_requests.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Requesting...' : 'Request Spare'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
