// resources/js/Pages/ServiceInwards/Create.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import React, { useEffect } from 'react';
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
import { router } from '@inertiajs/react';

interface Contact {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    mobile: string;
    company: string | null;
    contact_type: { id: number; name: string };
}
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import TextEditor from '@/components/ui/text-editor';

interface UserOption {
    id: number;
    name: string;
}

/* --------------------------------------------------------------
   Props that come from the controller
   -------------------------------------------------------------- */
interface CreatePageProps {
    contacts: Contact[];
    users: UserOption[];
    nextRma?: string;               // <-- added by nextRma() endpoint
}

export default function Create() {
    const route = useRoute();
    const { users, nextRma } = usePage().props as unknown as CreatePageProps;

    const { data, setData, post, processing, errors } = useForm({
        rma: nextRma ?? '',
        contact_id: '',
        material_type: '',
        brand: '',
        model: '',
        serial_no: '',
        passwords: '',
        photo_url: [] as File[],
        observation: '',
        received_by: '',
        received_date: '',
    });

    /* --------------------------------------------------------------
       Keep the RMA in sync with the suggested value only on first load.
       If the user edits it, we no longer show the “suggested” badge.
       -------------------------------------------------------------- */
    const [suggestedRma, setSuggestedRma] = React.useState<string | null>(nextRma ?? null);

    useEffect(() => {
        if (nextRma && !data.rma) {
            setData('rma', nextRma);
            setSuggestedRma(nextRma);
        }
    }, [nextRma, data.rma, setData]);

    const handleRmaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setData('rma', val);
        // If the user changes the value, hide the suggestion badge
        if (val !== suggestedRma) {
            setSuggestedRma(null);
        }
    };

    /* --------------------------------------------------------------
       Contact autocomplete (unchanged)
       -------------------------------------------------------------- */
    const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

    const handleContactSelect = (contact: Contact | null) => {
        setSelectedContact(contact);
        setData('contact_id', contact ? String(contact.id) : '');
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('service_inwards.store'), {
            forceFormData: true,
        });

    };

    // 🔥 Contact Create Dialog State
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

    const [newContact, setNewContact] = React.useState({
        name: "",
        mobile: "",
        phone: "",
        company: "",
        email: "",
        contact_type_id: "",
        active: true,
        has_web_access: false,
    });

// When user clicks “Create New”
    const handleContactCreate = (name: string) => {
        setNewContact({
            ...newContact,
            name
        });
        setCreateDialogOpen(true);
    };

// Save new contact
    const handleCreateContact = () => {
        router.post(route("contacts.store"), newContact, {
            onSuccess: (page: any) => {
                const created = page.props?.contact;

                if (created) {
                    handleContactSelect(created); // auto-select
                }

                setCreateDialogOpen(false);
            },
            onError: (err) => console.error(err),
        });
    };

    const [selectedPhotos, setSelectedPhotos] = React.useState<File[]>([]);


    return (
        <Layout>
            <Head title="Create Service Inward" />
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('service_inwards.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">New Service Inward</h1>
                            <p className="text-muted-foreground">
                                Register a new device for service
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 bg-white text-black p-6 rounded-lg border shadow"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ---------- RMA ---------- */}
                            <div>
                                <Label htmlFor="rma">
                                    RMA <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="rma"
                                    value={data.rma}
                                    onChange={handleRmaChange}
                                    placeholder="e.g. 12700.1"
                                />
                                {suggestedRma && data.rma === suggestedRma && (
                                    <p className="text-xs text-green-600 mt-1">
                                        Suggested: {suggestedRma}
                                    </p>
                                )}
                                {errors.rma && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.rma}
                                    </p>
                                )}
                            </div>

                            {/* ---------- CONTACT (AUTOCOMPLETE) ---------- */}
                            <div>
                                <Label htmlFor="contact-autocomplete">
                                    Contact <span className="text-red-500">*</span>
                                </Label>
                                <ContactAutocomplete
                                    value={selectedContact}
                                    onSelect={handleContactSelect}
                                    onCreateNew={handleContactCreate}
                                    placeholder="Search contacts by name, phone, email..."
                                    label=""
                                />
                                {errors.contact_id && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.contact_id}
                                    </p>
                                )}
                            </div>

                            {/* ---------- MATERIAL TYPE ---------- */}
                            <div>
                                <Label htmlFor="material_type">
                                    Material Type{' '}
                                    <span className="text-red-500">*</span>
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
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.material_type}
                                    </p>
                                )}
                            </div>

                            {/* ---------- BRAND ---------- */}
                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    value={data.brand}
                                    onChange={(e) => setData('brand', e.target.value)}
                                />
                            </div>

                            {/* ---------- MODEL ---------- */}
                            <div>
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    value={data.model}
                                    onChange={(e) => setData('model', e.target.value)}
                                />
                            </div>

                            {/* ---------- SERIAL NO ---------- */}
                            <div>
                                <Label htmlFor="serial_no">Serial No</Label>
                                <Input
                                    id="serial_no"
                                    value={data.serial_no}
                                    onChange={(e) => setData('serial_no', e.target.value)}
                                />
                                {errors.serial_no && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.serial_no}
                                    </p>
                                )}
                            </div>

                            {/* ---------- RECEIVED BY ---------- */}
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

                            {/* ---------- RECEIVED DATE ---------- */}
                            <div>
                                <Label htmlFor="received_date">Received Date</Label>
                                <Input
                                    id="received_date"
                                    type="date"
                                    value={data.received_date}
                                    onChange={(e) => setData('received_date', e.target.value)}
                                />
                            </div>

                            {/* ---------- PHOTO URL ---------- */}
                            <div>
                                <Label htmlFor="photo_url">Photos</Label>

                                <Input
                                    id="photo_url"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setSelectedPhotos(files);

                                        // Store file names or send actual files later
                                        setData("photo_url", files);
                                    }}
                                />
                                {selectedPhotos.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {selectedPhotos.map((file, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`preview-${index}`}
                                                    className="h-32 w-full object-cover rounded-md border"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>

                        </div>

                        {/* ---------- PASSWORDS ---------- */}
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

                        {/* ---------- OBSERVATION ---------- */}
                        <div>
                            <Label htmlFor="observation">
                                Observation / Issue Description
                            </Label>
                            <Textarea
                                id="observation"
                                value={data.observation}
                                onChange={(e) => setData('observation', e.target.value)}
                                placeholder="Device not powering on..."
                                rows={4}
                            />
                            <TextEditor id={"text"} />
                        </div>


                        {/* ---------- ACTIONS ---------- */}
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('service_inwards.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Create Inward'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 🔥 Create Contact Popup */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Contact</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Name *</Label>
                            <Input
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Mobile *</Label>
                                <Input
                                    value={newContact.mobile}
                                    onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Company</Label>
                            <Input
                                value={newContact.company}
                                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Contact Type</Label>
                            <Select
                                value={newContact.contact_type_id}
                                onValueChange={(value) => setNewContact({ ...newContact, contact_type_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Customer</SelectItem>
                                    <SelectItem value="2">Supplier</SelectItem>
                                    <SelectItem value="3">Partner</SelectItem>
                                    <SelectItem value="4">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-6 pt-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={newContact.active}
                                    onCheckedChange={(v) => setNewContact({ ...newContact, active: v })}
                                />
                                <Label>Active</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={newContact.has_web_access}
                                    onCheckedChange={(v) => setNewContact({ ...newContact, has_web_access: v })}
                                />
                                <Label>Web Access</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateContact}>Create Contact</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </Layout>
    );
}
