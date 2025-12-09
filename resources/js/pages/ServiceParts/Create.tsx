// resources/js/Pages/ServiceParts/Create.tsx
import Layout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Create() {
    const route = useRoute();
    const { data, setData, post, processing, errors } = useForm({
        part_code: '',
        name: '',
        brand: '',
        model: '',
        unit_price: '',
        current_stock: '0',
        remarks: '',
        barcode: '',
    });

    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [altText, setAltText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removePreview = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => formData.append(key, value));
        files.forEach(file => formData.append('images[]', file));
        if (altText) formData.append('alt_text', altText);

        router.post(route('service_parts.store'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setFiles([]);
                setPreviews([]);
                setAltText('');
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    return (
        <Layout>
            <Head title="Add Service Part" />
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('service_parts.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Add New Part</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 bg-white text-black p-6 rounded-lg shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="part_code">Part Code *</Label>
                                <Input id="part_code" value={data.part_code} onChange={e => setData('part_code', e.target.value)} />
                                {errors.part_code && <p className="mt-1 text-sm text-red-600">{errors.part_code}</p>}
                            </div>
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input id="brand" value={data.brand} onChange={e => setData('brand', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="model">Model</Label>
                                <Input id="model" value={data.model} onChange={e => setData('model', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="unit_price">Unit Price *</Label>
                                <Input id="unit_price" type="number" step="0.01" value={data.unit_price} onChange={e => setData('unit_price', e.target.value)} />
                                {errors.unit_price && <p className="mt-1 text-sm text-red-600">{errors.unit_price}</p>}
                            </div>
                            <div>
                                <Label htmlFor="current_stock">Current Stock *</Label>
                                <Input
                                    id="current_stock"
                                    type="number"
                                    min="0"
                                    value={data.current_stock}
                                    onChange={e => setData('current_stock', Number(e.target.value).toString())}
                                />

                                {errors.current_stock && <p className="mt-1 text-sm text-red-600">{errors.current_stock}</p>}
                            </div>
                            <div>
                                <Label htmlFor="barcode">Barcode</Label>
                                <Input id="barcode" value={data.barcode} onChange={e => setData('barcode', e.target.value)} />
                                {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="remarks">Remarks (optional)</Label>
                                <Textarea id="remarks" rows={3} value={data.remarks} onChange={e => setData('remarks', e.target.value)} />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Images (Optional)</h3>
                            <Input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} />
                            <div className="flex gap-3 mt-3">
                                <Input placeholder="Alt text (optional)" value={altText} onChange={e => setAltText(e.target.value)} />
                            </div>
                            {previews.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative">
                                            <img src={src} alt="Preview" className="h-32 w-32 object-cover rounded border" />
                                            <button
                                                type="button"
                                                onClick={() => removePreview(i)}
                                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                                            >
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
                                {processing ? 'Creating...' : 'Create Part'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
