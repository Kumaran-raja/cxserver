// resources/js/Pages/CallLogs/Create.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import React, { useState } from 'react';
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
import { ArrowLeft } from 'lucide-react';
import ContactAutocomplete from '@/components/blocks/ContactAutocomplete';
import axios from 'axios';

interface Contact {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    mobile: string;
    company: string | null;
    contact_type: { id: number; name: string };
}

interface UserOption {
    id: number;
    name: string;
}

interface CreatePageProps {
    contacts: Contact[];
    users: UserOption[];
}

export default function Create() {
    const route = useRoute();
    const { users } = usePage().props as unknown as CreatePageProps;

    const { data, setData, post, processing, errors } = useForm({
        mobile: '',
        contact_id: '',
        new_contact_name: '', // For new contact creation
        call_type: 'incoming',
        duration: '',
        enquiry: '',
        user_id: '',
    });

    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [history, setHistory] = useState<any>(null); // For contact history

    const handleMobileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const mobile = e.target.value;
        setData('mobile', mobile);
        // Search for contact by mobile
        if (mobile.length >= 5) {
            const response = await axios.get(route('contacts.search', { q: mobile }));
            const contacts = response.data.contacts || [];
            if (contacts.length > 0) {
                const contact = contacts[0];
                setSelectedContact(contact);
                setData('contact_id', String(contact.id));
                // Fetch history
                const historyRes = await axios.get(route('contacts.history', contact.id));
                setHistory(historyRes.data.history);
            } else {
                setSelectedContact(null);
                setData('contact_id', '');
                setHistory(null);
            }
        }
    };

    const handleContactSelect = (contact: Contact | null) => {
        setSelectedContact(contact);
        setData({ ...data, contact_id: contact ? String(contact.id) : '', mobile: contact?.mobile || data.mobile });
        if (contact) {
            axios.get(route('contacts.history', contact.id)).then(res => setHistory(res.data.history));
        } else {
            setHistory(null);
        }
    };

    const handleContactCreate = (name: string) => {
        setData('new_contact_name', name);
        // Trigger store with new contact flag
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('calls.store'));
    };

    return (
        <Layout>
            <Head title="Create Call Log" />
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('calls.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">New Call Log</h1>
                            <p className="text-muted-foreground">
                                Log a new call
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 bg-white text-black p-6 rounded-lg border shadow"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mobile */}
                            <div>
                                <Label htmlFor="mobile">
                                    Mobile <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="mobile"
                                    value={data.mobile}
                                    onChange={handleMobileChange}
                                    placeholder="Enter mobile number"
                                />
                                {errors.mobile && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.mobile}
                                    </p>
                                )}
                            </div>

                            {/* Contact Autocomplete */}
                            <div>
                                <Label htmlFor="contact-autocomplete">Contact</Label>
                                <ContactAutocomplete
                                    value={selectedContact}
                                    onSelect={handleContactSelect}
                                    onCreateNew={handleContactCreate}
                                    placeholder="Search contacts..."
                                />
                                {errors.contact_id && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.contact_id}
                                    </p>
                                )}
                            </div>

                            {/* Call Type */}
                            <div>
                                <Label htmlFor="call_type">
                                    Call Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.call_type}
                                    onValueChange={(v) => setData('call_type', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="incoming">Incoming</SelectItem>
                                        <SelectItem value="outgoing">Outgoing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Duration */}
                            <div>
                                <Label htmlFor="duration">Duration (seconds)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={data.duration}
                                    onChange={(e) => setData('duration', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Enquiry */}
                        <div>
                            <Label htmlFor="enquiry">Enquiry / Query</Label>
                            <Textarea
                                id="enquiry"
                                value={data.enquiry}
                                onChange={(e) => setData('enquiry', e.target.value)}
                                placeholder="Details of the call..."
                                rows={4}
                            />
                        </div>

                        {/* Handler */}
                        <div>
                            <Label htmlFor="user_id">Handled By</Label>
                            <Select
                                value={data.user_id}
                                onValueChange={(v) => setData('user_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select handler (optional)" />
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

                        {/* History Display */}
                        {history && (
                            <div className="mt-6 p-4 border rounded bg-muted">
                                <h3 className="font-bold mb-2">Contact History</h3>
                                {/* Render history items */}
                                <ul>
                                    {history.service_inwards?.map((item: any) => (
                                        <li key={item.id}>Service Inward: {item.rma}</li>
                                    ))}
                                    {history.job_cards?.map((item: any) => (
                                        <li key={item.id}>Job Card: {item.id}</li>
                                    ))}
                                    {/* Add more history items */}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('calls.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Create Call Log'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
