

import { createContext, useContext } from 'react';
import { 
    Project, User, ProjectRisk, WikiCategory, WikiArticle, Offer, 
    Order, Invoice, SupplierInvoice, TimeEntry, Contact, Absence, MailLogEntry, Contract, 
    InventoryItem, DunningProcess, ChecklistTemplate, SuggestedAction
} from '../types';

export interface AppContextType {
    // Data
    users: User[];
    projects: Project[];
    projectRisks: Record<string, ProjectRisk>;
    checklistTemplates: ChecklistTemplate[];
    timeEntries: TimeEntry[];
    contacts: Contact[];
    financeData: {
        offers: Offer[];
        orders: Order[];
        invoices: Invoice[];
        supplierInvoices: SupplierInvoice[];
    };
    officeData: {
        absences: Absence[];
        mailLog: MailLogEntry[];
        contracts: Contract[];
        inventoryItems: InventoryItem[];
        dunningProcesses: DunningProcess[];
    };
    
    // Current User
    currentUser: User | null;

    // Mutations
    handleCreateUser: (userData: any) => Promise<void>;
    handleUpdateUser: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; error?: any; }>;
    handleDeleteUser: (userId: string) => Promise<void>;
    handleCreateProject: (projectData: Partial<Project>) => Promise<void>;
    handleUpdateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
    handleDeleteProject: (projectId: string) => Promise<void>;
    handleCreateTimeEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
    handleUpdateTimeEntry: (entry: TimeEntry) => Promise<void>;
    handleDeleteTimeEntry: (id: number) => Promise<void>;

    // AI Actions
    suggestedAction: SuggestedAction | null;
    setSuggestedAction: (action: SuggestedAction | null) => void;

    // Errors
    errors: { id: string; message: string; details?: any }[];
    addError: (message: string, details?: any) => void;
    clearError: (id: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a DataProvider');
    }
    return context;
};