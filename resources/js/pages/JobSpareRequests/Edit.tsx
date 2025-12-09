// resources/js/Pages/JobSpareRequests/Edit.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage }  from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

interface Request {
    id: number;
    job_card: { job_no: string; service_inward: { rma: string; contact: { name: string } } };
    service_part: { part_code: string; name: string };
    requester: { id: number; name: string };
    qty_requested: number;
    qty_issued: number;
    status: string;
    remarks: string | null;
}

interface UserOption {
    id: number;
    name: string;
}

interface Props {
    request: Request;
    technicians: UserOption[];
}

export default function Edit() {
    const route = useRoute();
    const { request, technicians } = usePage().props as unknown as Props;

    const { data, setData, put, processing, errors } = useForm({
        qty_requested: String(request.qty_requested),
        qty_issued: String(request.qty_issued),
        status: request.status,
        remarks: request.remarks || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('job_spare_requests.update', request.id));
    };

    return (
        <Layout>
            <Head title="Edit Spare Request" />
            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('job_spare_requests.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Spare Request</h1>
                            <p className="text-muted-foreground">Update request status and issued qty</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-white text-black p-6 rounded-lg shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <Label>Job Card</Label>
                                <Input value={`${request.job_card.job_no} – ${request.job_card.service_inward.rma} (${request.job_card.service_inward.contact.name})`} disabled />
                            </div>

                            <div>
                                <Label>Spare Part</Label>
                                <Input value={`${request.service_part.part_code} – ${request.service_part.name}`} disabled />
                            </div>

                            <div>
                                <Label>Requested By</Label>
                                <Input value={request.requester.name} disabled />
                            </div>

                            <div>
                                <Label htmlFor="qty_requested">Qty Requested <span className="text-red-500">*</span></Label>
                                <Input id="qty_requested" type="number" min="1" value={data.qty_requested} onChange={e => setData('qty_requested', e.target.value)} />
                                {errors.qty_requested && <p className="mt-1 text-sm text-red-600">{errors.qty_requested}</p>}
                            </div>

                            <div>
                                <Label htmlFor="qty_issued">Qty Issued <span className="text-red-500">*</span></Label>
                                <Input id="qty_issued" type="number" min="0" value={data.qty_issued} onChange={e => setData('qty_issued', e.target.value)} />
                                {errors.qty_issued && <p className="mt-1 text-sm text-red-600">{errors.qty_issued}</p>}
                            </div>

                            <div>
                                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                <Select value={data.status} onValueChange={v => setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="issued">Issued</SelectItem>
                                        <SelectItem value="customer_will_bring">Customer Will Bring</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea id="remarks" rows={3} value={data.remarks} onChange={e => setData('remarks', e.target.value)} />
                            </div>

                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('job_spare_requests.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Request'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
