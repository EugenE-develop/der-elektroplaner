// stories/mockData.ts
// FIX: Added 'id' to ChecklistTemplate items.
import { User, Project, Contact, FinanceItem, Absence, ServicePhaseDefinition, GanttChart, ChecklistTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const mockCurrentUser: User = { id: '1', name: 'Max Mustermann', email: 'max@test.com', role: 'Geschäftsführung' };
export const mockAdminUser: User = { id: '2', name: 'Admina Stator', email: 'admin@test.com', role: 'Admin' };
export const mockProjektleiter: User = { id: '3', name: 'Petra Projekt', email: 'petra@test.com', role: 'Projektleiter' };
export const mockSystemplaner: User = { id: '4', name: 'Sven System', email: 'sven@test.com', role: 'Systemplaner' };

export const mockUsers: User[] = [mockCurrentUser, mockAdminUser, mockProjektleiter, mockSystemplaner];

export const mockGanttChart: GanttChart = {
    id: 'gantt-p1',
    name: 'Bauablaufplan Innovationshub',
    tasks: [
        { id: 'task-1', name: 'Grundlagenermittlung & Planung', start: '2024-08-01', end: '2024-08-15', progress: 80, dependencies: [] },
        { id: 'task-2', name: 'Genehmigungsphase', start: '2024-08-16', end: '2024-09-10', progress: 50, dependencies: ['task-1'] },
        { id: 'task-3', name: 'Ausführungsplanung', start: '2024-09-11', end: '2024-10-05', progress: 20, dependencies: ['task-2'] },
        { id: 'task-4', name: 'Vorbereitung Vergabe', start: '2024-10-06', end: '2024-10-20', progress: 0, dependencies: ['task-3'] },
        { id: 'task-5', name: 'Rohbau', start: '2024-10-21', end: '2024-11-30', progress: 0, dependencies: ['task-3'] },
        { id: 'task-6', name: 'Installation TGA', start: '2024-12-01', end: '2025-01-15', progress: 0, dependencies: ['task-5'] },
    ]
};

export const mockProjects: Project[] = [
    {
        id: 'p1',
        name: 'Bürogebäude "Innovationshub"',
        projectNumber: '2024-001',
        startDate: '2024-01-15',
        status: 'In Ausführung',
        projectLeiterIds: ['3'],
        deputyProjectLeiterIds: [],
        // FIX: Added the required 'interimUpdates' property to each AssignedPhase object to match the type definition.
        assignedPhases: [
            { phaseId: 1, note: '', interimUpdates: [] }, 
            { phaseId: 2, note: '', interimUpdates: [] }, 
            { phaseId: 3, note: '', interimUpdates: [] }, 
            { phaseId: 5, note: '', interimUpdates: [] }
        ],
        assignedSystems: ['4411', '4441', '4451', '4511', '4561', '4571'],
        representatives: [], milestones: [], memos: [], erlauterungsbericht: [], fireProtectionDocs: [], technicalDocuments: [], planDocuments: [], serviceSpecifications: [], stakeholders: [],
        ganttCharts: [mockGanttChart],
        todos: { tasks: {}, categories: {
            'todo': { id: 'todo', title: 'To Do', taskIds: [] },
            'inprogress': { id: 'inprogress', title: 'In Bearbeitung', taskIds: [] },
            'done': { id: 'done', title: 'Erledigt', taskIds: [] }
        }, categoryOrder: ['todo', 'inprogress', 'done'] },
        isArchived: false,
        // FIX: Add missing properties to satisfy Project type
        schematics: [],
        generalAttachments: [],
    },
    {
        id: 'p2',
        name: 'Wohnkomplex "Sonnenallee"',
        projectNumber: '2023-045',
        startDate: '2023-08-01',
        endDate: '2024-06-30',
        status: 'Abgeschlossen',
        projectLeiterIds: ['3'],
        deputyProjectLeiterIds: [],
        // FIX: Added the required 'interimUpdates' property to each AssignedPhase object to match the type definition.
        assignedPhases: [
            { phaseId: 1, note: '', interimUpdates: [] }, 
            { phaseId: 2, note: '', interimUpdates: [] }, 
            { phaseId: 3, note: '', interimUpdates: [] }, 
            { phaseId: 4, note: '', interimUpdates: [] }, 
            { phaseId: 5, note: '', interimUpdates: [] }, 
            { phaseId: 6, note: '', interimUpdates: [] }, 
            { phaseId: 7, note: '', interimUpdates: [] }, 
            { phaseId: 8, note: '', interimUpdates: [] }
        ],
        assignedSystems: ['4441', '4444', '4451', '4523'],
        representatives: [], milestones: [], memos: [], erlauterungsbericht: [], fireProtectionDocs: [], technicalDocuments: [], planDocuments: [], serviceSpecifications: [], stakeholders: [],
        todos: { tasks: {}, categories: {
            'todo': { id: 'todo', title: 'To Do', taskIds: [] },
            'inprogress': { id: 'inprogress', title: 'In Bearbeitung', taskIds: [] },
            'done': { id: 'done', title: 'Erledigt', taskIds: [] }
        }, categoryOrder: ['todo', 'inprogress', 'done'] },
        isArchived: false,
        // FIX: Add missing properties to satisfy Project type
        schematics: [],
        generalAttachments: [],
    },
    {
        id: 'p3',
        name: 'Archiviertes Projekt "Altbau Sanierung"',
        projectNumber: '2022-019',
        startDate: '2022-03-01',
        endDate: '2023-05-30',
        status: 'Abgeschlossen',
        projectLeiterIds: ['4'],
        deputyProjectLeiterIds: [],
        // FIX: Added the required 'interimUpdates' property to each AssignedPhase object to match the type definition.
        assignedPhases: [{ phaseId: 1, note: '', interimUpdates: [] }, { phaseId: 8, note: '', interimUpdates: [] }],
        assignedSystems: ['4441'],
        representatives: [], milestones: [], memos: [], erlauterungsbericht: [], fireProtectionDocs: [], technicalDocuments: [], planDocuments: [], serviceSpecifications: [], stakeholders: [],
        todos: { tasks: {}, categories: {
            'todo': { id: 'todo', title: 'To Do', taskIds: [] },
            'inprogress': { id: 'inprogress', title: 'In Bearbeitung', taskIds: [] },
            'done': { id: 'done', title: 'Erledigt', taskIds: [] }
        }, categoryOrder: ['todo', 'inprogress', 'done'] },
        isArchived: true,
        // FIX: Add missing properties to satisfy Project type
        schematics: [],
        generalAttachments: [],
    },
];

export const mockContacts: Contact[] = [
    { id: 1, name: 'Architekturbüro Klinke', company: 'Klinke & Partner', role: 'Architekt', email: 'info@klinke.de', phone: '0123456789', notes: '' },
    { id: 2, name: 'Bauherr Invest GmbH', company: 'Invest GmbH', role: 'Bauherr', email: 'kontakt@invest.de', phone: '0987654321', notes: '' },
];

const mockFinanceItems: FinanceItem[] = [
    { id: 'fi1', description: 'Planungsleistung LP 1-3', quantity: 1, unit: 'pauschal', unitPrice: 15000, total: 15000 },
];

export const mockFinanceData = {
    offers: [{ id: 'o1', offerNumber: 'A-2024-01', projectId: 'p1', contactId: 2, date: '2024-01-10', validUntil: '2024-02-10', status: 'Angenommen' as const, items: mockFinanceItems, netAmount: 15000, taxAmount: 2850, grossAmount: 17850 }],
    orders: [],
    invoices: [],
    supplierInvoices: [],
};

export const mockAbsences: Absence[] = [
    { id: 'a1', user_id: '3', start_date: '2024-08-01', end_date: '2024-08-14', type: 'Urlaub', status: 'Genehmigt', created_at: '2024-06-15' },
    { id: 'a2', user_id: '4', start_date: '2024-07-29', end_date: '2024-07-29', type: 'Krankheit', status: 'Genehmigt', created_at: '2024-07-29' }
];

export const mockOfficeData = {
    absences: mockAbsences,
    mailLog: [],
    contracts: [],
    inventoryItems: [],
    dunningProcesses: [],
};

export const mockChecklistTemplates: ChecklistTemplate[] = [
    { id: 1, name: 'LP1 Grundlagenermittlung', applicable_phase: 1, items: [{ id: uuidv4(), text: 'Grundlagenermittlung durchführen' }, { id: uuidv4(), text: 'Beratungsgespräch mit Bauherr' }] },
    { id: 2, name: 'LP2 Vorplanung', applicable_phase: 2, items: [{ id: uuidv4(), text: 'Vorplanung erstellen' }, { id: uuidv4(), text: 'Kostenschätzung nach DIN 276' }] },
];


export const mockAdminData = {
    systemSettings: [],
    auditLog: [],
    integrations: [],
    rolePermissions: [],
};