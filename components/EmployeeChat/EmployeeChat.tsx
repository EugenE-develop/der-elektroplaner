

import React, { FC, useState } from 'react';
// FIX: Changed import to be a relative path.
import { User, Message } from '../../types';

interface EmployeeChatProps {
    currentUser: User;
    allUsers: User[];
    onClose: () => void;
}

const EmployeeChat: FC<EmployeeChatProps> = ({ currentUser, allUsers, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        const newMessage: Message = {
            id: Date.now(),
            content: input,
            sender_id: currentUser.id,
            sender_name: currentUser.name,
            room_id: 1, // General room
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
        setInput('');
    };

    return (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-card rounded-lg shadow-2xl flex flex-col border border-border z-40">
            <header className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-semibold">Mitarbeiter-Chat</h3>
                <button onClick={onClose} className="text-2xl text-text-light hover:text-text">&times;</button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto">
                <p className="text-center text-sm text-text-light">Chat-Funktionalität in Entwicklung.</p>
                {messages.map(msg => (
                    <div key={msg.id} className={`flex my-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 rounded-lg ${msg.sender_id === currentUser.id ? 'bg-primary text-white' : 'bg-secondary'}`}>
                            <strong>{msg.sender_name}:</strong> {msg.content}
                        </div>
                    </div>
                ))}
            </main>
            <footer className="p-4 border-t border-border">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="flex-grow p-2 border rounded" 
                        placeholder="Nachricht eingeben..."
                    />
                    <button onClick={handleSend} className="px-4 py-2 bg-primary text-white rounded">Senden</button>
                </div>
            </footer>
        </div>
    );
};

export default EmployeeChat;
