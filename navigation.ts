import { UserRole } from './types';

export type NavItem = {
    type: 'item';
    id: string;
    label: string;
    icon: string; // The Lucide icon name string
    roles: UserRole[];
} | {
    type: 'divider';
};

export const navItems: NavItem[] = [
    { type: 'item', id: 'dashboard', label: 'Dashboard', icon: "LayoutDashboard", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'] },
    { type: 'item', id: 'projekte', label: 'Projekte', icon: "FolderKanban", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'] },
    { type: 'item', id: 'analyse', label: 'Analyse-Center', icon: "AreaChart", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'] },
    { type: 'item', id: 'zeiterfassung', label: 'Zeiterfassung', icon: "Clock", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Büro'] },
    { type: 'item', id: 'projektauslastung', label: 'Zeitstrahl', icon: "BarChart3", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter'] },
    { type: 'item', id: 'wiki', label: 'Wiki', icon: "BookOpen", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'] },
    { type: 'item', id: 'kontakte', label: 'Kontakte', icon: "Contact", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'] },
    { type: 'item', id: 'buero', label: 'Büro', icon: "Building", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'] },
    { type: 'divider' },
    { type: 'item', id: 'berichte', label: 'Berichte', icon: "PieChart", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Admin', 'Büro'] },
    { type: 'item', id: 'finanzen', label: 'Finanzen', icon: "Landmark", roles: ['Geschäftsführung', 'Leitung', 'Büro'] },
    { type: 'divider' },
    // Admin Section
    { type: 'item', id: 'admin-dashboard', label: 'Admin Übersicht', icon: "ServerCog", roles: ['Admin'] },
    { type: 'item', id: 'benutzer', label: 'Benutzer', icon: "Users", roles: ['Geschäftsführung', 'Leitung', 'Admin'] },
    { type: 'item', id: 'stammdaten', label: 'Stammdaten', icon: "Database", roles: ['Admin'] },
    { type: 'item', id: 'systemeinstellungen', label: 'Systemeinstellungen', icon: "SlidersHorizontal", roles: ['Admin'] },
    { type: 'item', id: 'systemprotokoll', label: 'Systemprotokoll', icon: "ShieldAlert", roles: ['Admin'] },
    { type: 'item', id: 'integrationen', label: 'Integrationen', icon: "Plug", roles: ['Admin'] },
    { type: 'item', id: 'rollen', label: 'Rollen & Rechte', icon: "UserCog", roles: ['Admin'] },
    { type: 'divider' },
    { type: 'item', id: 'einstellungen', label: 'Einstellungen', icon: "Settings", roles: ['Geschäftsführung', 'Leitung', 'Projektleiter', 'Systemplaner', 'Admin', 'Büro'] },
];