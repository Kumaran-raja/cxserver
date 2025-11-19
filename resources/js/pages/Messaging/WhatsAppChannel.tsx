import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { format } from 'date-fns';

interface PageProps {
    mobile: string;
    defaultText?: string;
}

const WhatsAppChannel: React.FC = () => {
    const { mobile, defaultText = '' } = usePage<PageProps>().props;

    const [message, setMessage] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dummy static conversation (real WhatsApp feel)
    const dummyMessages = [
        { id: 1, text: "Hello, I'm having issue with invoice generation in CODEXSUN ERP", sender: 'customer', time: new Date(Date.now() - 60*60*1000) },
        { id: 2, text: "Hi! Welcome to CODEXSUN Support 👋\nThanks for reaching out.", sender: 'support', time: new Date(Date.now() - 55*60*1000) },
        { id: 3, text: "Can you please share your company ID or the invoice number?", sender: 'support', time: new Date(Date.now() - 54*60*1000) },
        { id: 4, text: "Yes sure, Company ID: CDX-2025-0871", sender: 'customer', time: new Date(Date.now() - 50*60*1000) },
        { id: 5, text: "Checking your account now...\nOne moment please ⏳", sender: 'support', time: new Date(Date.now() - 48*60*1000) },
        { id: 6, text: "Found the issue! Your tax template was disabled after the latest update.", sender: 'support', time: new Date(Date.now() - 45*60*1000) },
        { id: 7, text: "I've fixed it from backend. Please try generating invoice again now ✅", sender: 'support', time: new Date(Date.now() - 44*60*1000) },
        { id: 8, text: "It worked!! Thank you so much 😍", sender: 'customer', time: new Date(Date.now() - 40*60*1000) },
        { id: 9, text: "You're most welcome!\nAnything else I can help with today?", sender: 'support', time: new Date(Date.now() - 30*60*1000) },
    ];

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Auto resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [message]);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSend = () => {
        if (!message.trim()) return;

        const phone = mobile.replace(/[^0-9]/g, '');
        const text = encodeURIComponent(message.trim());
        const waUrl = `https://wa.me/${phone}?text=${text}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');
        setMessage('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date: Date) => format(date, 'p');

    return (
        <>
            <Head title="Live Support - CODEXSUN ERP" />

            <div className="flex flex-col h-screen bg-gray-100">
                {/* WhatsApp Header */}
                <header className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center font-bold text-lg">
                        CS
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold">CODEXSUN Support</h2>
                        <p className="text-xs opacity-90">Online • Click below to continue on WhatsApp</p>
                    </div>
                    <svg className="w-6 h-6 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </header>

                {/* Messages Area - Real WhatsApp Gradient Background */}
                <main className="flex-1 overflow-y-auto px-2 py-4" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%2309867a' fill-opacity='0.08' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundColor: '#0b141a',
                    backgroundAttachment: 'fixed'
                }}>
                    <div className="max-w-4xl mx-auto space-y-3 px-4">
                        {dummyMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-md ${
                                        msg.sender === 'customer'
                                            ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none'
                                            : 'bg-white text-gray-900 rounded-tl-none'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    <p className={`text-xs mt-1 ${
                                        msg.sender === 'customer' ? 'text-gray-600' : 'text-gray-500'
                                    } text-right`}>
                                        {formatTime(msg.time)}
                                        {msg.sender === 'customer' && (
                                            <span className="ml-1">✓✓</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        <div className="flex justify-start">
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-md">
                                <div className="flex space-x-2">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        </div>

                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Input Bar - Exact WhatsApp Style */}
                <footer className="bg-[#f0f2f5] border-t border-gray-200 px-2 py-2">
                    <div className="max-w-4xl mx-auto bg-white rounded-full shadow-lg flex items-center px-4 py-2">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 resize-none outline-none px-2 py-2 max-h-32 overflow-y-auto text-gray-800"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim()}
                            className={`ml-2 p-3 rounded-full rounded-full transition-all ${
                                message.trim()
                                    ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-md'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <svg className="w-6 h-6 rotate-45" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                            </svg>
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-500 mt-2 pb-2">
                        Press Enter to send • Opens WhatsApp with your message
                    </p>
                </footer>
            </div>
        </>
    );
};

export default WhatsAppChannel;
