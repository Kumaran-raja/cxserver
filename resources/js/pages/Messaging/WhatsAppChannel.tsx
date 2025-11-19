// resources/js/Pages/Messaging/WhatsAppChannel.tsx
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Head, usePage } from '@inertiajs/react';

interface PageProps {
    mobile: string;
    defaultText: string;
}

const WhatsAppChannel: React.FC = () => {
    const { mobile, defaultText } = usePage<PageProps>().props;

    const [message, setMessage] = useState<string>(defaultText || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [message]);

    useEffect(() => {
        textareaRef.current?.focus();
        // Pre-fill with default text from backend
        if (defaultText) setMessage(defaultText);
    }, [defaultText]);

    const handleSend = (): void => {
        if (!message.trim()) return;

        // WhatsApp API format
        const phone = mobile.replace(/[^0-9]/g, ''); // Clean number
        const text = encodeURIComponent(message.trim());
        const url = `https://wa.me/${phone}?text=${text}`;

        window.open(url, '_blank', 'noopener,noreferrer');

        // Optional: Clear after send
        // setMessage(defaultText || '');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <Head title="WhatsApp Support - CODEXSUN ERP" />

            <div className="flex flex-col h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 text-center">
                    <h1 className="text-2xl font-bold text-green-600">WhatsApp Support</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Chat directly with CODEXSUN support team
                    </p>
                </header>

                {/* Empty Chat Area */}
                <main className="flex-1 overflow-y-auto px-6 py-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="bg-green-100 rounded-full w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                            <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 5.843h-.004c-1.575-.053-3.22-.917-4.407-2.582l-.003-.006-3.45 1.021 1.043-3.398-.007-.007c-1.745-1.297-2.781-3.007-2.78-4.907.001-3.073 2.506-5.568 5.59-5.568 1.493 0 2.895.582 3.947 1.634 1.052 1.052 1.634 2.454 1.634 3.947-.001 3.074-2.507 5.569-5.59 5.569z"/>
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-700">
                            Send your message to start WhatsApp chat
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Support Number: <strong>{mobile.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</strong>
                        </p>
                    </div>
                </main>

                {/* Input Bar */}
                <footer className="border-t border-gray-200 bg-white px-6 py-4">
                    <div className="max-w-4xl mx-auto flex items-end gap-3">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-32"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!message.trim()}
                            className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                message.trim()
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                            </svg>
                            Send
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        Press Enter to send • Opens WhatsApp in new tab
                    </p>
                </footer>
            </div>
        </>
    );
};

export default WhatsAppChannel;
