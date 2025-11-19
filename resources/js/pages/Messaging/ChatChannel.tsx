import React, { useState, useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';

export default function ChatChannel() {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSend = () => {
        if (message.trim() === '') return;

        // Process: Open new tab to codexsun.com (you can append message as query if needed)
        const url = `https://wa.me/${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        // Optional: Clear input after send
        setMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <Head title="Messaging Channel - CODEXSUN ERP" />

            <div className="flex flex-col h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-800">Support Channel</h1>
                    <p className="text-sm text-gray-500">Send a message to open CODEXSUN portal</p>
                </div>

                {/* Message Area - Empty State */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-3xl mx-auto text-center text-gray-400 mt-20">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4" />
                        <p className="text-lg">Type your message and hit Send to continue on</p>
                        <p className="text-lg font-semibold">codexsun.com</p>
                    </div>
                </div>

                {/* Input Area - Fixed Bottom */}
                <div className="border-t border-gray-200 bg-white px-6 py-4">
                    <div className="max-w-4xl mx-auto flex items-end gap-3">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!message.trim()}
                            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                                message.trim()
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        Press Enter to send • Message will open codexsun.com in new tab
                    </p>
                </div>
            </div>
        </>
    );
}
