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
                route('enquiries.index'),
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
    const [contactEnquiryId, setContactEnquiryId] = useState<number | null>(null);

    const handleGetDetails = () => {
        if (!selectedContact) return;

        setLoadingInwards(true);
        setLoadingJobCards(true);

        // ✅ Create CallLog using Inertia POST (CSRF safe)
        router.post(route('calls.quickStore'),
            {
                contact_id: selectedContact.id,
            },
            {
                preserveState: true,
                onSuccess: (page) => {
                    const createdId =
                        (page.props as any)?.flash?.created_id ?? null;

                    if (createdId) {
                        setContactEnquiryId(createdId);
                    }
                },
                onFinish: async () => {
                    try {
                        // ✅ Fetch Service Inwards
                        const res1 = await fetch(
                            route('service_inwards.by_contact', selectedContact.id),
                            { credentials: 'same-origin' }
                        );
                        const inwardsData = await res1.json();
                        setInwards(inwardsData);

                        // ✅ Fetch Job Cards
                        const res2 = await fetch(
                            route('job_cards.by_contact', selectedContact.id),
                            { credentials: 'same-origin' }
                        );
                        const jobData = await res2.json();
                        setJobCards(jobData);

                    } catch (err) {
                        console.error(err);
                    } finally {
                        setLoadingInwards(false);
                        setLoadingJobCards(false);
                    }
                },
            }
        );
    };

    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSendMessage = () => {
        if (!contactEnquiryId || !message.trim()) return;

        setSending(true);

        router.post(
            route('calls.updateEnquiry'),
            {
                id: contactEnquiryId,
                enquiry: message,
            },
            {
                preserveState: true,
                onSuccess: () => {
                    setMessage('');
                },
                onFinish: () => setSending(false),
            }
        );
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
                    {/* Main Layout (After Separator) */}
                    <div className="mt-6 flex flex-col lg:flex-row gap-6">

                        {/* LEFT CONTENT → 70% */}
                        <div className="w-full lg:w-[70%] space-y-10">

                            {/* ================= INWARDS ================= */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                                    Service Inwards
                                </h2>

                                {!loadingInwards && inwards.length === 0 && (
                                    <div className="text-center py-10 text-sm text-gray-400 bg-white rounded-xl border">
                                        No service records found
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {inwards.map((item) => (
                                        <div
                                            key={item.id}
                                            className="w-full rounded-xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">

                                                {/* RMA */}
                                                <div className="font-semibold text-gray-800 min-w-[120px]">
                                                    {item.rma}
                                                </div>

                                                {/* Contact */}
                                                <div className="text-gray-600">
                                                    <span className="text-gray-400">Contact:</span>{' '}
                                                    {item.contact?.name ?? '-'}
                                                </div>
                                                {/* Material */}
                                                <div className="text-gray-600">
                                                    <span className="text-gray-400">Material:</span>{' '}
                                                    {item.material_type}
                                                </div>

                                                {/* Serial */}
                                                <div className="text-gray-600">
                                                    <span className="text-gray-400">Serial:</span>{' '}
                                                    {item.serial_no ?? 'N/A'}
                                                </div>



                                                {/* Receiver */}
                                                <div className="text-gray-600">
                                                    <span className="text-gray-400">By:</span>{' '}
                                                    {item.receiver?.name ?? 'N/A'}
                                                </div>

                                                {/* Date */}
                                                <div className="text-xs text-gray-400">
                                                    {item.received_date}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ================= JOB CARDS ================= */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                                    Job Cards
                                </h2>

                                {!loadingJobCards && jobCards.length === 0 && (
                                    <div className="text-center py-10 text-sm text-gray-400 bg-white rounded-xl border">
                                        No job cards found
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {jobCards.map((job) => (
                                        <div
                                            key={job.id}
                                            className="w-full rounded-xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">

                                                {/* Job No */}
                                                <div className="font-semibold text-gray-800 min-w-[120px]">
                                                    {job.job_no}
                                                </div>

                                                {/* RMA */}
                                                <div className="text-gray-600">
                                                    <span className="text-gray-400">RMA:</span>{' '}
                                                    {job.service_inward?.rma ?? '-'}
                                                </div>

                                                {/* Status */}
                                                <div className="text-gray-600">
                                                    <span className="text-gray-400">Status:</span>{' '}
                                                    {job.status?.name ?? '-'}
                                                </div>

                                                {/* Technician */}
                                                <div className="text-gray-600">
                                                    <span className="text-gray-400">Tech:</span>{' '}
                                                    {job.user?.name ?? '-'}
                                                </div>

                                                {/* Date */}
                                                <div className="text-xs text-gray-400">
                                                    {job.received_at}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>


                        {/* RIGHT PANEL → 30% (Sticky Chat Placeholder) */}
                        <div className="w-full lg:w-[30%]">
                            <div className="lg:sticky lg:top-24 space-y-4">
                                <div className="bg-white border rounded-xl p-4 min-h-[300px] shadow-sm flex flex-col">

                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                        Customer Chat
                                    </h3>

                                    {/* Messages Preview */}
                                    <div className="flex-1 overflow-y-auto text-sm text-gray-700 mb-3">
                                        {contactEnquiryId ? (
                                            <div className="text-xs text-gray-500">
                                                Linked to CallLog #{contactEnquiryId}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-red-400">
                                                Select customer & click “Get Details” first.
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Box */}
                                    <div className="flex gap-2 mt-auto">
                                        <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type message..."
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring accent-black"
                                        />

                                        <button
                                            onClick={handleSendMessage}
                                            disabled={sending || !contactEnquiryId}
                                            className="bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm"
                                        >
                                            {sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
