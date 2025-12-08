// resources/js/Pages/Enquiry/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { useRoute } from 'ziggy-js';

import ContactEnquiry from '@/components/blocks/ContactEnquiry';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { dashboard } from '@/routes';
import { index as enquiry } from '@/routes/enquiries/index';
import type { BreadcrumbItem } from '@/types';
import { Contact } from '@/types/contact';
import { Plus } from 'lucide-react';

interface CallLog {
    id: number;
    mobile: string;
    call_type: string;
    duration: number | null;
    enquiry: string | null;
    created_at: string;
    deleted_at: string | null;
    contact: {
        id: number;
        name: string;
        company: string | null;
        mobile: string | null;
    };
    handler: { id: number; name: string } | null;
}

interface EnquiryPageProps {
    call_logs: {
        data: CallLog[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        per_page: number;
    };
    filters: {
        search?: string;
        date_from?: string;
        date_to?: string;
        per_page?: string;
    };
    can: { create: boolean; delete: boolean };
    trashedCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Enquiry', href: enquiry().url },
];

export default function Index() {
    const {
        call_logs,
        filters: serverFilters,
        can,
    } = usePage().props as unknown as EnquiryPageProps;
    const [jobCards, setJobCards] = useState<any[]>([]);

    const [inwards, setInwards] = useState<any[]>([]);
    const [loadingInwards, setLoadingInwards] = useState(false);
    const [loadingJobCards, setLoadingJobCards] = useState(false);

    const route = useRoute();
    const [localFilters, setLocalFilters] = useState({
        contact_id: serverFilters.search || '',
    });

    const [isNavigating, setIsNavigating] = useState(false);

    // Sync server filters → local state
    useEffect(() => {
        setLocalFilters({
            contact_id: serverFilters.search || '',
        });
    }, [serverFilters]);

    // Build URL payload
    const buildPayload = useCallback(
        () => ({
            search: localFilters.contact_id || undefined,
        }),
        [localFilters],
    );

    // Navigate with filters
    const navigate = useCallback(
        (extra = {}) => {
            setIsNavigating(true);
            router.get(
                route('enquiry.index'),
                { ...buildPayload(), ...extra },
                {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsNavigating(false),
                },
            );
        },
        [route, buildPayload],
    );

    // ──────────────────────────────────────────────────────────────
    // CONTACT AUTOCOMPLETE
    // ──────────────────────────────────────────────────────────────
    const [selectedContact, setSelectedContact] = useState<Contact | null>(
        null,
    );

    const handleContactSelect = (contact: Contact | null) => {
        setSelectedContact(contact);
        const contactId = contact ? String(contact.id) : '';
        setLocalFilters((prev) => ({ ...prev, contact_id: contactId }));
        navigate({ search: contactId });
    };

    const handleContactCreate = (name: string) => {
        // Replace with your own “open create modal / redirect” logic
        alert(`Create new contact: "${name}"`);
    };
    const handleGetDetails = async () => {
        if (!selectedContact) return;

        // start both loaders
        setLoadingInwards(true);
        setLoadingJobCards(true);

        try {
            // Inward fetch
            const res1 = await fetch(
                route('service_inwards.by_contact', selectedContact.id)
            );
            const inwardsData = await res1.json();
            setInwards(inwardsData);

            // Job Card fetch
            const res2 = await fetch(
                route('job_cards.by_contact', selectedContact.id)
            );
            const jobData = await res2.json();
            setJobCards(jobData);

        } catch (err) {
            console.error(err);
        } finally {
            // stop both loaders
            setLoadingInwards(false);
            setLoadingJobCards(false);
        }
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enquiry" />
            <div className="py-6">
                <div className="mx-auto space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-black/50">
                                Enquiry
                            </h1>
                            <p className="mt-1 text-sm font-semibold text-black/30">
                                Track your enquiry
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between">
                        <div className="w-full">
                            <ContactEnquiry
                                value={selectedContact}
                                onSelect={handleContactSelect}
                                onCreateNew={handleContactCreate}
                                placeholder="Search contacts by name, phone, email..."
                            />
                        </div>

                        <div className="flex gap-3">
                            {can.create && (
                                <Button onClick={handleGetDetails}>
                                     Get Details
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Mega Search Bar */}

                    <Separator />
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/*{loadingInwards  && <p className="text-sm text-muted-foreground">Loading...</p>}*/}

                        {!loadingInwards  && inwards.length === 0 && (
                            <div className="col-span-full text-center py-10 text-sm text-gray-400">
                                No service records found for this contact
                            </div>

                        )}

                        {inwards.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {item.rma}
                                    </h3>
                                    <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                Inward
            </span>
                                </div>

                                {/* Body Info */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Material</span>
                                        <span className="font-medium text-gray-800">
                    {item.material_type}
                </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Serial No</span>
                                        <span className="font-medium text-gray-800">
                    {item.serial_no ?? 'N/A'}
                </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Contact</span>
                                        <span className="font-medium text-gray-800">
                    {item.contact?.name ?? '-'}
                </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Received by</span>
                                        <span className="font-medium text-gray-800">
                    {item.receiver?.name ?? 'N/A'}
                </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-xs text-gray-400">
                {item.received_date}
            </span>

                                    {/*<button className="text-xs font-medium text-blue-600 hover:underline">*/}
                                    {/*    View Details*/}
                                    {/*</button>*/}
                                </div>
                            </div>
                        ))}

                    </div>
                    {/* Job Cards Section */}
                    <div className="mt-10">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">
                            Job Cards
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {!loadingJobCards && jobCards.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    No job cards found
                                </p>
                            )}

                            {jobCards.map((job) => (
                                <div
                                    key={job.id}
                                    className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {job.job_no}
                                        </h3>
                                        <span className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-full">
                Job Card
            </span>
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">RMA</span>
                                            <span className="font-medium text-gray-800">
                    {job.service_inward?.rma ?? '-'}
                </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Status</span>
                                            <span className="font-medium text-gray-800">
                    {job.status?.name ?? '-'}
                </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Technician</span>
                                            <span className="font-medium text-gray-800">
                    {job.user?.name ?? '-'}
                </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-xs text-gray-400">
                {job.received_at}
            </span>

                                        <button className="text-xs font-medium text-green-600 hover:underline">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
