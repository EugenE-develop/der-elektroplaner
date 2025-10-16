import React, { FC } from 'react';
import Icon from '../shared/Icon';

const bottomNavItems = [
    { id: 'dashboard', label: 'Dashboard', iconName: "LayoutDashboard" },
    { id: 'projekte', label: 'Projekte', iconName: "FolderKanban" },
    { id: 'wiki', label: 'Wiki', iconName: "BookOpen" },
    { id: 'kontakte', label: 'Kontakte', iconName: "Contact" },
];

const MobileBottomNav: FC<{ activeView: string; setActiveView: (view: string) => void; onOpenMenu: () => void; }> = ({ activeView, setActiveView, onOpenMenu }) => {
    
    const handlePress = (action: () => void) => {
        if ('vibrate' in navigator) navigator.vibrate(50);
        action();
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden print:hidden">
            <div className="flex h-16 items-center justify-around">
                {bottomNavItems.map(item => (
                    <button key={item.id} onClick={() => handlePress(() => setActiveView(item.id))} className={`flex h-full w-1/4 flex-col items-center justify-center rounded-lg p-2 transition-colors ${activeView === item.id ? 'text-primary' : 'text-text-light'}`}>
                        <div className="mb-0.5 h-7 w-7"><Icon name={item.iconName} /></div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
                <button onClick={() => handlePress(onOpenMenu)} className="flex h-full w-1/4 flex-col items-center justify-center rounded-lg p-2 text-text-light">
                     <div className="mb-1 h-6 w-6"><Icon name="Menu" /></div>
                    <span className="text-[10px] font-medium">Mehr</span>
                </button>
            </div>
        </nav>
    );
};

export default MobileBottomNav;