// resources/js/Pages/Messaging/WhatsAppContacts.tsx
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';

interface Contact {
    id: number;
    name: string;
    mobile: string;
    company: string | null;
    contact_type: { name: string };
}

interface ChatMessage {
    id: number;
    message: string;
    type: 'incoming' | 'outgoing';
    sent_at: string;
    user_name: string;
}

interface PageProps {
    contacts: Contact[];
    defaultGreeting?: string;
    chatHistory?: ChatMessage[];     // ← Now passed from controller when contact pre-selected
    selected_contact_id?: number;    // ← Optional: open specific contact on load
}

const WhatsAppContacts: React.FC = () => {
    const { contacts: initialContacts, defaultGreeting = '', chatHistory: initialHistory = [], selected_contact_id } = usePage<PageProps>().props;
    const { props } = usePage();
    const flash = (props as any).flash;

    const [contacts] = useState<Contact[]>(initialContacts);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>(initialContacts);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialHistory);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, post, processing, reset, errors } = useForm({
        contact_id: '',
        message: defaultGreeting,
    });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (flash?.message) {
            if (flash.type === 'success') {
                toast.success(flash.message);
            } else {
                toast.error(flash.message);
            }
        }
    }, [flash]);

    // Find and auto-select contact on first load
    useEffect(() => {
        if (selected_contact_id && !selectedContact) {
            const contact = contacts.find(c => c.id === selected_contact_id);
            if (contact) {
                setSelectedContact(contact);
                setData({ contact_id: String(contact.id), message: defaultGreeting });
            }
        }
    }, [selected_contact_id, contacts, defaultGreeting, setData, selectedContact]);

    // Filter contacts
    useEffect(() => {
        const lower = searchQuery.toLowerCase();
        setFilteredContacts(
            contacts.filter(c =>
                c.name.toLowerCase().includes(lower) ||
                c.mobile.includes(searchQuery) ||
                (c.company && c.company.toLowerCase().includes(lower))
            )
        );
    }, [searchQuery, contacts]);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = `${ta.scrollHeight}px`;
        }
    }, [data.message]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const selectContact = (contact: Contact) => {
        setSelectedContact(contact);
        setData({ contact_id: String(contact.id), message: defaultGreeting || `Hello ${contact.name.split(' ')[0]},` });

        // Load chat history via Inertia visit (preserves scroll, state, flash, etc.)
        router.visit(route('messaging.whatsapp'), {
            data: { contact_id: contact.id },
            preserveState: true,
            preserveScroll: true,
            only: ['chatHistory', 'flash'],
        });
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedContact || processing) return;

        post(route('messaging.whatsapp.send'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Add message locally for instant feedback
                const newMsg: ChatMessage = {
                    id: Date.now(),
                    message: data.message.trim(),
                    type: 'outgoing',
                    sent_at: new Date().toISOString(),
                    user_name: 'You'
                };
                setChatHistory(prev => [...prev, newMsg]);

                // Open WhatsApp
                const phone = selectedContact.mobile.replace(/[^0-9]/g, '');
                const text = encodeURIComponent(data.message.trim());
                window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');

                // Reset message
                reset('message');
                setData('message', defaultGreeting);
            },
            onError: () => {
                alert('Failed to save message. Check logs.');
            }
        });
    };

    return (
        <>
            <Head title="WhatsApp Messenger - CODEXSUN ERP" />

            <Toaster position="top-right" />

            <div className="flex h-screen bg-gray-100">
                {/* LEFT PANEL */}
                <div className="w-full max-w-sm bg-white border-r border-gray-200 flex flex-col">
                    <div className="bg-[#075e54] text-white p-4">
                        <h1 className="text-xl font-semibold">WhatsApp Messenger</h1>
                        <p className="text-sm opacity-90">{contacts.length} Contacts</p>
                    </div>

                    <div className="p-3 border-b">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                onClick={() => selectContact(contact)}
                                className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition ${
                                    selectedContact?.id === contact.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                                }`}
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {contact.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{contact.name}</h3>
                                    <p className="text-sm text-gray-600 truncate">{contact.company || 'No company'}</p>
                                    <p className="text-sm text-green-600 font-medium">{contact.mobile}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 flex flex-col bg-[#0b141a]">

                    {/*{flash && (*/}
                    {/*    <div className={`mx-auto max-w-4xl px-6 py-3 text-center text-sm font-medium rounded-lg mb-4 ${*/}
                    {/*        flash.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'*/}
                    {/*    }`}>*/}
                    {/*        {flash.message}*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    {selectedContact ? (
                        <>
                            <div className="bg-[#075e54] text-white p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-white font-bold">
                                    {selectedContact.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg">{selectedContact.name}</h2>
                                    <p className="text-sm opacity-90">{selectedContact.mobile}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 1200 1200'%3E%3Cdefs%3E%3Cpattern id='wa' x='0' y='0' width='300' height='300' patternUnits='userSpaceOnUse'%3E%3Cpath d='M150 0L0 150L150 300L300 150L150 0Z' fill='%23025e54' fill-opacity='0.06'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23wa)'/%3E%3C/svg%3E")`,
                            }}>
                                <div className="max-w-4xl mx-auto space-y-4">
                                    {chatHistory.length === 0 ? (
                                        <p className="text-center text-white/60 mt-20">No messages yet. Start the conversation!</p>
                                    ) : (
                                        chatHistory.map((msg) => (
                                            <div key={msg.id} className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                                    msg.type === 'outgoing'
                                                        ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none'
                                                        : 'bg-white text-gray-900 rounded-tl-none'
                                                }`}>
                                                    {msg.type === 'incoming' && (
                                                        <p className="text-xs font-semibold text-green-600 mb-1">{msg.user_name}</p>
                                                    )}
                                                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                                                    <p className="text-xs text-gray-500 text-right mt-1">
                                                        {format(new Date(msg.sent_at), 'HH:mm')}
                                                        {msg.type === 'outgoing' && ' ✓✓'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            <form onSubmit={sendMessage} className="p-4 bg-[#f0f2f5]">
                                <div className="max-w-4xl mx-auto bg-white rounded-full shadow-2xl flex items-center px-5 py-3">
                                    <textarea
                                        ref={textareaRef}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(e);
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        className="flex-1 resize-none outline-none max-h-32 overflow-y-auto px-2 text-gray-800"
                                        rows={1}
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing || !data.message.trim()}
                                        className={`ml-3 p-3 rounded-full transition-all ${
                                            data.message.trim() && !processing
                                                ? 'bg-[#00a884] hover:bg-[#008f73] text-white shadow-lg'
                                                : 'bg-gray-300 text-gray-500'
                                        }`}
                                    >
                                        <svg className="w-6 h-6 rotate-45" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                                        </svg>
                                    </button>
                                </div>
                                {errors.message && <p className="text-red-500 text-xs text-center mt-2">{errors.message}</p>}
                                <p className="text-center text-xs text-gray-600 mt-2">
                                    Press Enter to send • Saved in Contact Notes • 100% Inertia
                                </p>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <p className="text-2xl font-light">Select a contact to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default WhatsAppContacts;
