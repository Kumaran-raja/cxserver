// resources/js/Pages/ServiceInwards/Edit.tsx
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
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useRoute } from 'ziggy-js';
import React from 'react';
import ContactAutocomplete from '@/components/blocks/ContactAutocomplete';
import TextEditor from '@/components/ui/text-editor';

interface Contact {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    mobile: string;
    company: string | null;
    contact_type: { id: number; name: string };
}

interface ServiceInward {
    id: number;
    rma: string;
    contact_id: number;
    material_type: string;
    brand: string | null;
    model: string | null;
    serial_no: string | null;
    passwords: string | null;
    photo_url: string | null;
    observation: string | null;
    received_date: string | null;
    received_by: string | null;
}

interface UserOption {
    id: number;
    name: string;
}

interface EditPageProps {
    inward: ServiceInward;
    contacts: Contact[];          // still passed (for fallback)
    users: UserOption[];
}

/* ------------------------------------------------------------------ */
/*  Helper: turn the existing contact_id into a full Contact object   */
/* ------------------------------------------------------------------ */
const findContactById = (contacts: Contact[], id: number): Contact | null =>
    contacts.find((c) => c.id === id) ?? null;

export default function Edit() {
    const route = useRoute();
    const { inward, contacts, users } = usePage().props as unknown as EditPageProps;

    /* ---------- INITIAL FORM DATA ---------- */
    const { data, setData, put, processing, errors } = useForm({
        rma: inward.rma,
        contact_id: String(inward.contact_id),
        material_type: inward.material_type,
        brand: inward.brand || '',
        model: inward.model || '',
        serial_no: inward.serial_no || '',
        passwords: inward.passwords || '',
        photo_url: inward.photo_url || '',
        observation: inward.observation || '',
        received_by: inward.received_by ? String(inward.received_by) : '',
        received_date: inward.received_date || '',
    });

    /* ---------- CONTACT AUTOCOMPLETE STATE ---------- */
    const initialContact = React.useMemo(
        () => findContactById(contacts, inward.contact_id),
        [contacts, inward.contact_id]
    );

    const [selectedContact, setSelectedContact] = React.useState<Contact | null>(initialContact);

    const handleContactSelect = (contact: Contact | null) => {
        setSelectedContact(contact);
        setData('contact_id', contact ? String(contact.id) : '');
    };

    const handleContactCreate = (name: string) => {
        // Replace with your own “open create modal / redirect” logic
        alert(`Create new contact: "${name}"`);
    };

    /* ---------- SUBMIT ---------- */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('service_inwards.update', inward.id));
    };

    return (
        <Layout>
            <Head title="Edit Service Inward" />
            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('service_inwards.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Service Inward</h1>
                            <p className="text-muted-foreground">Update inward details</p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 rounded-lg bg-white text-black p-6 shadow"
                    >
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* RMA */}
                            <div>
                                <Label htmlFor="rma">
                                    RMA <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="rma"
                                    value={data.rma}
                                    onChange={(e) => setData('rma', e.target.value)}
                                    placeholder="RMA-2025-001"
                                />
                                {errors.rma && <p className="mt-1 text-sm text-red-600">{errors.rma}</p>}
                            </div>

                            {/* CONTACT (AUTOCOMPLETE) */}
                            <div>
                                <Label htmlFor="contact-autocomplete">
                                    Contact <span className="text-red-500">*</span>
                                </Label>
                                <ContactAutocomplete
                                    value={selectedContact}
                                    onSelect={handleContactSelect}
                                    onCreateNew={handleContactCreate}
                                    placeholder="Search contacts..."
                                />
                                {errors.contact_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.contact_id}</p>
                                )}
                            </div>

                            {/* MATERIAL TYPE */}
                            <div>
                                <Label htmlFor="material_type">
                                    Material Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.material_type}
                                    onValueChange={(v) => setData('material_type', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="laptop">Laptop</SelectItem>
                                        <SelectItem value="desktop">Desktop</SelectItem>
                                        <SelectItem value="printer">Printer</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.material_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.material_type}</p>
                                )}
                            </div>

                            {/* BRAND */}
                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    value={data.brand}
                                    onChange={(e) => setData('brand', e.target.value)}
                                    placeholder="Dell, HP, etc."
                                />
                            </div>

                            {/* MODEL */}
                            <div>
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    value={data.model}
                                    onChange={(e) => setData('model', e.target.value)}
                                    placeholder="Latitude 7420"
                                />
                            </div>

                            {/* SERIAL NO */}
                            <div>
                                <Label htmlFor="serial_no">Serial No</Label>
                                <Input
                                    id="serial_no"
                                    value={data.serial_no}
                                    onChange={(e) => setData('serial_no', e.target.value)}
                                    placeholder="ABC123XYZ"
                                />
                                {errors.serial_no && (
                                    <p className="mt-1 text-sm text-red-600">{errors.serial_no}</p>
                                )}
                            </div>

                            {/* RECEIVED BY */}
                            <div>
                                <Label htmlFor="received_by">Received By</Label>
                                <Select
                                    value={data.received_by}
                                    onValueChange={(v) => setData('received_by', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select receiver (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* RECEIVED DATE */}
                            <div>
                                <Label htmlFor="received_date">Received Date</Label>
                                <Input
                                    id="received_date"
                                    type="date"
                                    value={data.received_date}
                                    onChange={(e) => setData('received_date', e.target.value)}
                                />
                            </div>

                            {/* PHOTO URL */}
                            <div>
                                <Label htmlFor="photo_url">Photo URL</Label>
                                <Input
                                    id="photo_url"
                                    value={data.photo_url}
                                    onChange={(e) => setData('photo_url', e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* PASSWORDS */}
                        <div>
                            <Label htmlFor="passwords">Passwords / Access Info</Label>
                            <Textarea
                                id="passwords"
                                value={data.passwords}
                                onChange={(e) => setData('passwords', e.target.value)}
                                placeholder="BIOS: 1234, Windows: pass@123"
                                rows={2}
                            />
                        </div>

                        {/* OBSERVATION */}
                        <div>
                            <Label htmlFor="observation">Observation / Issue Description</Label>
                            {/*<Textarea*/}
                            {/*    id="observation"*/}
                            {/*    value={data.observation}*/}
                            {/*    onChange={(e) => setData('observation', e.target.value)}*/}
                            {/*    placeholder="Device not powering on..."*/}
                            {/*    rows={4}*/}
                            {/*/>*/}
                            <TextEditor
                                id="observation"
                                value={data.observation}
                                onChange={(html) => setData("observation", html)}
                            />
                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('service_inwards.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Inward'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
