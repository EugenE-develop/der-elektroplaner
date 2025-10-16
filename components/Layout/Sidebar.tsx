import React, { FC, ReactNode } from 'react';
import { User } from '../../types';
import { navItems } from '../../navigation';
import Icon from '../shared/Icon';

const Sidebar: FC<{ activeView: string; setActiveView: (view: string) => void; currentUser: User | null; className?: string; }> = ({ activeView, setActiveView, currentUser, className }) => {
    if (!currentUser) return null;

    return (
        <aside className={`flex h-full w-64 flex-shrink-0 flex-col border-r border-border bg-card ${className || ''}`}>
            <div className="border-b border-border p-4 md:hidden">
                <span className="text-lg font-semibold text-text">Menü</span>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {navItems.map((item, index) => {
                    if (item.type === 'divider') {
                        return <hr key={`divider-${index}`} className="my-2 border-border" />;
                    }
                    if (!item.roles.includes(currentUser.role)) {
                        return null;
                    }
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeView === item.id ? 'bg-primary text-white' : 'text-text hover:bg-secondary'}`}
                        >
                            <div className="h-6 w-6"><Icon name={item.icon} /></div>
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

const MobileSidebar: FC<{ isOpen: boolean; onClose: () => void; children: ReactNode }> = ({ isOpen, onClose, children }) => (
    <>
        <div 
            className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />
        <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {children}
        </div>
    </>
);


export { Sidebar, MobileSidebar };