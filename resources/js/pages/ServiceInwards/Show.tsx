// resources/js/Pages/ServiceInwards/Show.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Image } from 'lucide-react';
import { format } from 'date-fns';
import ServiceInwardNotes from './ServiceInwardNotes'; // ← Fixed path
import DOMPurify from "dompurify";
interface ServiceInward {
    id: number;
    rma: string;
    material_type: string;
    brand: string | null;
    model: string | null;
    serial_no: string | null;
    passwords: string | null;
    photo_urls: string[] | null;

    observation: string | null;
    received_date: string | null;
    contact: { name: string; company: string | null; mobile: string; email: string | null };
    receiver: { name: string } | null;
}

interface ShowPageProps {
    inward: ServiceInward;
    can: { edit: boolean; delete: boolean };
    notes?: any[];           // ← From lazy
    notes_filters?: any;     // ← From controller
}

export default function Show() {
    const route = useRoute();
    const { inward, can, notes = [], notes_filters = {} } = usePage<ShowPageProps>().props;

    return (
        <Layout>
            <Head title={`Inward ${inward.rma}`} />
            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('service_inwards.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div className="flex gap-2">
                            {can.edit && (
                                <Button asChild size="sm">
                                    <Link
                                        href={route(
                                            'service_inwards.edit',
                                            inward.id,
                                        )}
                                    >
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="space-y-6 rounded-lg bg-white text-black p-6 shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {inward.rma}
                                </h1>
                                <p className="text-muted-foreground">
                                    Received on{' '}
                                    {inward.received_date
                                        ? format(
                                              new Date(inward.received_date),
                                              'dd MMMM yyyy',
                                          )
                                        : '—'}
                                </p>
                            </div>
                            <Badge variant="outline" className="text-lg text-black">
                                {inward.material_type.toUpperCase()}
                            </Badge>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="mb-2 font-semibold">Customer</h3>
                                <p className="font-medium">
                                    {inward.contact.name}
                                </p>
                                {inward.contact.company && (
                                    <p className="text-muted-foreground">
                                        {inward.contact.company}
                                    </p>
                                )}
                                <p className="text-sm">
                                    {inward.contact.mobile}
                                </p>
                                {inward.contact.email && (
                                    <p className="text-sm">
                                        {inward.contact.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <h3 className="mb-2 font-semibold">Device</h3>
                                {(inward.brand || inward.model) && (
                                    <p className="font-medium">
                                        {inward.brand} {inward.model}
                                    </p>
                                )}
                                {inward.serial_no && (
                                    <p className="text-sm">
                                        S/N: {inward.serial_no}
                                    </p>
                                )}
                            </div>
                        </div>

                        {inward.photo_urls && inward.photo_urls.length > 0 && (
                            <div>
                                <h3 className="mb-2 font-semibold">Photos</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {inward.photo_urls.map((url: string, index: number) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img
                                                src={url}
                                                alt={`photo-${index}`}
                                                className="h-32 w-full object-cover rounded-md border hover:opacity-80 transition"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}


                        {inward.passwords && (
                            <div>
                                <h3 className="mb-2 font-semibold">
                                    Access Info
                                </h3>
                                <pre className="rounded bg-muted p-3 text-sm whitespace-pre-wrap text-white">
                                    {inward.passwords}
                                </pre>
                            </div>
                        )}

                        {inward.observation && (
                            <div>
                                <h3 className="mb-2 font-semibold">
                                    Observation
                                </h3>
                                <div className="whitespace-pre-wrap"  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(inward.observation ?? "")
                                }}/>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            Received by:{' '}
                            <span className="font-medium">
                                {inward.receiver?.name || '—'}
                            </span>
                        </div>
                    </div>

                    {/* Chat Notes – Always Visible */}
                    <div className="mt-8">
                        <ServiceInwardNotes
                            inwardId={inward.id}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
