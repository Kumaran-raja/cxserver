// resources/js/Pages/ServiceParts/Edit.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trash2, Check, GripVertical } from 'lucide-react';
import React, { useState, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ServicePart, ServicePartImage } from '@/types/service-parts';
import { Storage } from '@/utils/storage';

interface Props {
    part: ServicePart & { images: ServicePartImage[] };
}

function SortableImage({ img, onSetPrimary, onRemove }: { img: ServicePartImage; onSetPrimary: () => void; onRemove: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: img.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <img src={Storage.url(img.thumb_path)} alt={img.alt_text ?? ''} className="h-32 w-32 object-cover rounded border" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!img.is_primary && (
                    <Button type="button" size="icon" variant="ghost" className="text-white" onClick={onSetPrimary}>
                        <Check className="h-4 w-4" />
                    </Button>
                )}
                <Button type="button" size="icon" variant="ghost" className="text-white" onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="text-white cursor-grab" {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4" />
                </Button>
            </div>
            {img.is_primary && (
                <div className="absolute top-1 left-1 bg-green-600 text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                </div>
            )}
        </div>
    );
}

export default function Edit({ part }: Props) {
    const route = useRoute();
    const { flash } = usePage().props as any;

    // Local state for form
    const [formData, setFormData] = useState({
        part_code: part.part_code,
        name: part.name,
        brand: part.brand ?? '',
        model: part.model ?? '',
        unit_price: part.unit_price,
        current_stock: part.current_stock,
        remarks: part.remarks ?? '',
        barcode: part.barcode ?? '',
    });

    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [altText, setAltText] = useState('');
    const [existingImages, setExistingImages] = useState<ServicePartImage[]>(part.images);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        setFiles(p => [...p, ...newFiles]);
        newFiles.forEach(f => {
            const reader = new FileReader();
            reader.onloadend = () => setPreviews(p => [...p, reader.result as string]);
            reader.readAsDataURL(f);
        });
    };

    const removePreview = (i: number) => {
        setFiles(p => p.filter((_, idx) => idx !== i));
        setPreviews(p => p.filter((_, idx) => idx !== i));
    };

    const removeExisting = (id: number) => {
        setExistingImages(p => p.filter(img => img.id !== id));
        router.delete(route('service_parts.images.destroy', id), { preserveScroll: true });
    };

    const setPrimary = (id: number) => {
        router.post(route('service_parts.images.primary', [part.id, id]), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setExistingImages(p => p.map(img => ({ ...img, is_primary: img.id === id })));
            }
        });
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = existingImages.findIndex(i => i.id === active.id);
        const newIdx = existingImages.findIndex(i => i.id === over.id);
        const newOrder = arrayMove(existingImages, oldIdx, newIdx);
        setExistingImages(newOrder);
        router.post(route('service_parts.images.reorder', part.id), { order: newOrder.map(i => i.id) }, { preserveScroll: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        fd.append('_method', 'PUT'); // Spoof PUT
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v as string));
        files.forEach(f => fd.append('images[]', f));
        if (altText) fd.append('alt_text', altText);

        router.post(route('service_parts.update', part.id), fd, {
            onSuccess: () => {
                setFiles([]);
                setPreviews([]);
                setAltText('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                router.reload({ only: ['part'] });
            },
            onError: (err) => {
                setErrors(err);
                console.error('Validation errors:', err);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Layout>
            <Head title="Edit Service Part" />
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('service_parts.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Edit Part – {part.part_code}</h1>
                    </div>

                    {flash?.success && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded">
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 bg-white text-black p-6 rounded-lg shadow">
                        {/* Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="part_code">Part Code *</Label>
                                <Input id="part_code" value={formData.part_code} onChange={e => setFormData(p => ({ ...p, part_code: e.target.value }))} />
                                {errors.part_code && <p className="mt-1 text-sm text-red-600">{errors.part_code}</p>}
                            </div>
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input id="brand" value={formData.brand} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} />
                            </div>
                            <div>
                                <Label htmlFor="model">Model</Label>
                                <Input id="model" value={formData.model} onChange={e => setFormData(p => ({ ...p, model: e.target.value }))} />
                            </div>
                            <div>
                                <Label htmlFor="unit_price">Unit Price *</Label>
                                <Input id="unit_price" type="number" step="0.01" value={formData.unit_price} onChange={e => setFormData(p => ({ ...p, unit_price: e.target.value }))} />
                                {errors.unit_price && <p className="mt-1 text-sm text-red-600">{errors.unit_price}</p>}
                            </div>
                            <div>
                                <Label htmlFor="current_stock">Current Stock *</Label>
                                <Input id="current_stock" type="number" min="0" value={formData.current_stock} onChange={e => setFormData(p => ({ ...p, current_stock: e.target.value }))} />
                                {errors.current_stock && <p className="mt-1 text-sm text-red-600">{errors.current_stock}</p>}
                            </div>
                            <div>
                                <Label htmlFor="barcode">Barcode</Label>
                                <Input id="barcode" value={formData.barcode} onChange={e => setFormData(p => ({ ...p, barcode: e.target.value }))} />
                                {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea id="remarks" rows={3} value={formData.remarks} onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))} />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Images</h3>

                            {existingImages.length > 0 && (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={existingImages.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-wrap gap-3 mb-6">
                                            {existingImages.map(img => (
                                                <SortableImage key={img.id} img={img} onSetPrimary={() => setPrimary(img.id)} onRemove={() => removeExisting(img.id)} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}

                            <Input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="mb-2" />
                            <div className="flex gap-3 mb-3">
                                <Input placeholder="Alt text (optional)" value={altText} onChange={e => setAltText(e.target.value)} />
                            </div>

                            {previews.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative">
                                            <img src={src} alt="Preview" className="h-32 w-32 object-cover rounded border" />
                                            <button type="button" onClick={() => removePreview(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('service_parts.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Update Part'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
