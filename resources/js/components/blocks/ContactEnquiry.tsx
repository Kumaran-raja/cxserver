'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, Loader2, Plus, Phone, Mail, Building } from 'lucide-react';
import { useRoute } from 'ziggy-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { Switch } from '../ui/switch';

interface Contact {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    mobile: string;
    company: string | null;
    contact_type: { id: number; name: string };
}

interface ContactEnquiryProps {
    value?: Contact | null;
    onSelect: (contact: Contact | null) => void;
    placeholder?: string;
    className?: string;
    onCreateNew?: (name: string) => void;
    label?: string;
}

export default function ContactEnquiry({
                                           value,
                                           onSelect,
                                           placeholder = 'Search contacts...',
                                           className = '',
                                           label,
                                       }: ContactEnquiryProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    // Create dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newContact, setNewContact] = useState({
        name: '',
        mobile: '',
        email: '',
        phone: '',
        company: '',
        contact_type_id: '',
        has_web_access: false,
        active: true,
    });


    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
    const route = useRoute();
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastQueryRef = useRef<string>('');

    // Sync external value
    useEffect(() => {
        if (value) {
            setSelectedContact(value);
            setQuery(value.name);
            setResults([]);
            setShowDropdown(false);
        } else {
            setSelectedContact(null);
            setQuery('');
        }
    }, [value]);

    // Click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node) &&
                containerRef.current && !containerRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showDropdown || selectedContact) return;

            const totalItems = results.length + (query.length >= 2 && results.length === 0 ? 1 : 0);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0) {
                        if (highlightedIndex < results.length) {
                            handleSelect(results[highlightedIndex]);
                        } else if (query.length >= 2 && results.length === 0) {
                            handleOpenCreateDialog();
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setShowDropdown(false);
                    setHighlightedIndex(-1);
                    break;
            }
        };

        if (showDropdown) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [showDropdown, results, highlightedIndex, query, selectedContact]);

    // Scroll highlighted into view
    useEffect(() => {
        const el = itemRefs.current[highlightedIndex];
        el?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex]);

    const cancelPreviousRequest = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
    }, []);

    const triggerSearch = useCallback((search: string) => {
        if (search === lastQueryRef.current || selectedContact) return;
        lastQueryRef.current = search;

        cancelPreviousRequest();

        if (search.length < 2) {
            setResults([]);
            setShowDropdown(false);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true);
        fetchContacts(search, controller.signal);
    }, [selectedContact, cancelPreviousRequest]);

    useEffect(() => {
        const timer = setTimeout(() => triggerSearch(query), 150);
        return () => clearTimeout(timer);
    }, [query, triggerSearch]);

    const fetchContacts = async (search: string, signal: AbortSignal) => {
        try {
            const baseUrl = route('contacts.search');
            const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}q=${encodeURIComponent(search)}`;

            const response = await fetch(url, {
                method: 'GET',
                signal,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setResults(data.contacts ?? []);
            setShowDropdown(true);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Search failed:', error);
                setResults([]);
                setShowDropdown(true);
            }
        } finally {
            if (abortControllerRef.current?.signal === signal) setLoading(false);
        }
    };

    const handleSelect = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setQuery(contact.name);
        setResults([]);
        setShowDropdown(false);
        setHighlightedIndex(-1);
        setLoading(false);
        onSelect(contact);
        inputRef.current?.blur();
    }, [onSelect]);

    const handleClear = useCallback(() => {
        setSelectedContact(null);
        setQuery('');
        setResults([]);
        setShowDropdown(false);
        setLoading(false);
        onSelect(null);
        inputRef.current?.focus();
    }, [onSelect]);

    const handleOpenCreateDialog = useCallback(() => {
        setNewContact(prev => ({ ...prev, name: query.trim() }));
        setCreateDialogOpen(true);
        setShowDropdown(false);
        setHighlightedIndex(-1);
    }, [query]);

    const handleCreateContact = () => {
        router.post(route('contacts.store'), newContact, {
            onSuccess: (page: any) => {
                const created = page.props?.contact;

                if (created) {
                    handleSelect(created);
                }

                setCreateDialogOpen(false);
            },
            onError: (err) => {
                console.error(err);
            },
        });
    };

    const displayValue = selectedContact ? selectedContact.name : query;
    const showCreateButton = query.length >= 2 && results.length === 0 && !loading && !selectedContact;

    return (
        <>
            <div className={cn('w-full flex flex-col space-y-2', className)}>
                {label && <Label htmlFor="contact-autocomplete">{label}</Label>}

                <div ref={containerRef} className="relative">
                    <Input
                        id="contact-autocomplete"
                        ref={inputRef}
                        type="text"
                        value={displayValue}
                        onChange={(e) => {
                            const val = e.target.value;
                            setQuery(val);
                            if (selectedContact) {
                                setSelectedContact(null);
                                onSelect(null);
                            }
                        }}
                        onFocus={() => {
                            if (!selectedContact && query.length >= 2 && (results.length > 0 || showCreateButton)) {
                                setShowDropdown(true);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown' && !selectedContact) {
                                e.preventDefault();
                                setShowDropdown(true);
                                setHighlightedIndex(0);
                            }
                        }}
                        placeholder={placeholder}
                        className="h-12 text-2xl font-extrabold tracking-widest w-full pr-12"
                    />

                    {/* Icons */}
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                    )}

                    {!loading && selectedContact && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}

                    {!loading && !selectedContact && (
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showDropdown ? <ChevronDown className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                        </div>
                    )}

                    {/* Dropdown */}
                    {showDropdown && (
                        <div
                            ref={dropdownRef}
                            className="absolute left-0 right-0 top-full mt-1 z-50 w-full max-w-2xl rounded-md border bg-popover text-popover-foreground shadow-lg max-h-96 overflow-auto"
                        >
                            {results.length > 0 ? (
                                <ul className="py-1">
                                    {results.map((contact, idx) => (
                                        <li
                                            key={contact.id}
                                            ref={el => (itemRefs.current[idx] = el)}
                                            onClick={() => handleSelect(contact)}
                                            onMouseEnter={() => setHighlightedIndex(idx)}
                                            className={cn(
                                                'px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground',
                                                highlightedIndex === idx && 'bg-accent text-accent-foreground'
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{contact.name}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-4">
                                                        {contact.mobile && (
                                                            <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                                                {contact.mobile}
                              </span>
                                                        )}
                                                        {contact.email && (
                                                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                                                {contact.email}
                              </span>
                                                        )}
                                                        {contact.company && (
                                                            <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                                                {contact.company}
                              </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                          {contact.contact_type.name}
                        </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}

                            {showCreateButton && (
                                <div className="border-t pt-2">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            'w-full justify-start',
                                            highlightedIndex === results.length && 'bg-accent text-accent-foreground'
                                        )}
                                        onClick={handleOpenCreateDialog}
                                        onMouseEnter={() => setHighlightedIndex(results.length)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create new contact: <span className="ml-1 font-medium">"{query}"</span>
                                    </Button>
                                </div>
                            )}

                            {!showCreateButton && results.length === 0 && query.length >= 2 && (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    No contacts found
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create New Contact Dialog */}
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

                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Mobile *</Label>
                                <Input
                                    value={newContact.mobile}
                                    onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
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
                                    onCheckedChange={(v) =>
                                        setNewContact({ ...newContact, has_web_access: v })
                                    }
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
        </>
    );
}
