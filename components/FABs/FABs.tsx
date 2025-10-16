import React, { useState, FC } from 'react';
import EmployeeChat from '../EmployeeChat/EmployeeChat';
// FIX: Changed import to be a relative path.
import { User, Project } from '../../types';
import { Sparkles, MessageSquare, Plus } from 'lucide-react';

const FABs: FC<{ currentUser: User; users: User[]; projects: Project[]; onOpenAiChat: () => void; }> = ({ currentUser, users, projects, onOpenAiChat }) => {
    const [isEmployeeChatOpen, setIsEmployeeChatOpen] = useState(false);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

    const toggleFabMenu = () => {
        setIsFabMenuOpen(prev => !prev);
        // Ensure chats are closed when menu is closed
        if (isFabMenuOpen) {
            setIsEmployeeChatOpen(false);
        }
    };
    
    const openAiChat = () => {
        onOpenAiChat();
        setIsEmployeeChatOpen(false);
        setIsFabMenuOpen(false);
    };

    const openEmployeeChat = () => {
        setIsEmployeeChatOpen(true);
        setIsFabMenuOpen(false);
    };

    return (
        <>
            <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex flex-col items-end gap-3 print:hidden">
                {isFabMenuOpen && (
                     <div className="flex flex-col items-end gap-3 bg-card p-3 rounded-lg shadow-lg border border-border">
                        <button onClick={openAiChat} className="w-40 flex items-center justify-start gap-3 p-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span>AI Assistenz</span>
                        </button>
                        <button onClick={openEmployeeChat} className="w-40 flex items-center justify-start gap-3 p-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <span>Mitarbeiter-Chat</span>
                        </button>
                    </div>
                )}
                <button 
                    onClick={toggleFabMenu} 
                    className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover transition-transform hover:scale-105"
                    aria-label={isFabMenuOpen ? "Menü schließen" : "Menü öffnen"}
                >
                    <Plus className={`w-8 h-8 transition-transform duration-300 ${isFabMenuOpen ? 'rotate-45' : ''}`} />
                </button>
            </div>
            {isEmployeeChatOpen && <EmployeeChat currentUser={currentUser} allUsers={users} onClose={() => setIsEmployeeChatOpen(false)} />}
        </>
    );
};

export default FABs;