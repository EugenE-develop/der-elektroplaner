// types.ts

// --- Core & User ---
export type UserRole = 'Geschäftsführung' | 'Leitung' | 'Projektleiter' | 'Systemplaner' | 'Admin' | 'Büro';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    hourly_rate?: number;
}

// --- Project ---
export type ProjectStatus = 'In Planung' | 'In Ausführung' | 'Abgeschlossen' | 'Pausiert';

export interface ChecklistItem {
    id: string;
    text: string;
    isDone: boolean;
}

export interface AssignedPhase {
    phaseId: number;
    note: string;
    interimUpdates: any[];
    startDate?: string;
    completionDate?: string;
    checklist?: ChecklistItem[];
}

export interface Milestone {
    id: string;
    name: string;
    date: string;
    completed: boolean;
}

export interface Memo {
    id: number;
    content: string;
    type: 'general' | 'architect';
    author: string;
    date: string;
}

export interface MemoFolder {
    id: string;
    name: string;
    memos: Memo[];
    files: any[];
}

export interface DocumentFile {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
    createdAt: string;
    version: number;
    parentId: string;
    status: 'Original' | 'Entwurf' | string;
    leistungsphase?: string;
    gebaeudeteil?: string;
    geschoss?: string;
    planIndex?: string;
    annotationsData?: string;
    aiSummary?: string;
    analysisResult?: any;
}

export interface DocumentFolder {
    id: string;
    name: string;
    files: DocumentFile[];
}

export interface Stakeholder {
    contact_id: number;
    project_role: string;
}

export type TodoPriority = 'Niedrig' | 'Mittel' | 'Hoch' | 'Dringend';

export interface TodoItem {
    id: string;
    title: string;
    description: string;
    priority: TodoPriority;
    dueDate: string;
    assigneeId: string | null;
}

export interface TodoState {
    tasks: { [key: string]: TodoItem };
    categories: {
        [key: string]: {
            id: string;
            title: string;
            taskIds: string[];
        };
    };
    categoryOrder: string[];
}

export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string[];
}
export interface GanttChart {
    id: string;
    name: string;
    tasks: GanttTask[];
}

export interface Project {
    id: string;
    name: string;
    projectNumber?: string;
    startDate: string;
    endDate?: string;
    status: ProjectStatus;
    projectCategory?: string;
    grossFloorArea?: number;
    projectLeiterIds: string[];
    deputyProjectLeiterIds: string[];
    assignedPhases: AssignedPhase[];
    assignedSystems: string[];
    representatives?: any[];
    milestones: Milestone[];
    memos: MemoFolder[];
    stakeholders: Stakeholder[];
    logoUrl?: string | null;
    ganttCharts?: GanttChart[];
    todos: TodoState;
    isArchived?: boolean;
    createdAt?: string;

    erlauterungsbericht: any[];
    fireProtectionDocs: DocumentFolder[];
    technicalDocuments: DocumentFolder[];
    planDocuments: DocumentFile[];
    schematics: DocumentFile[];
    serviceSpecifications: DocumentFolder[];
    generalAttachments: DocumentFile[];
}

export interface ProjectRisk {
    level: 'Niedrig' | 'Mittel' | 'Hoch';
    reason: string;
}

// --- General UI & Navigation ---

export interface RecentItem {
    type: 'project' | 'page';
    id: string;
    label: string;
    view: string;
    projectId?: string;
    subView?: string;
}

export interface Theme {
    name: string;
    primary: string;
    hover: string;
}

export interface AppearanceSettings {
    mode: 'light' | 'dark' | 'system';
    fontSize: 'sm' | 'md' | 'lg';
    density: 'comfortable' | 'compact';
}

export interface Message {
    id: number;
    content: string;
    sender_id: string;
    sender_name: string;
    room_id: number;
    created_at: string;
}

// --- Tools & Calculators ---
export interface Leistungsphase {
    id: number;
    name: string;
    prozent: number;
    checked: boolean;
}

export interface HOAI_Ergebnis {
    grundhonorar: number;
    honorarGrundleistungen: number;
    umbauzuschlagBetrag: number;
    instandhaltungszuschlagBetrag: number;
    zwischensumme: number;
    nebenkostenBetrag: number;
    netto: number;
    mwst: number;
    brutto: number;
    totalProzent: number;
}

export interface CatalogEntryData {
    zustaendigkeit: string;
    festlegung: string;
}

export interface VersionInfo {
    index: string;
    datum: string;
    aenderungen: string;
}

// --- Wiki ---
export interface WikiArticle {
    id: number;
    title: string;
    content: string;
    category_id: number;
    author_id: string;
    author_name: string;
    created_at: string;
    last_modified: string;
    attachments: string[];
}

export interface WikiCategory {
    id: number;
    name: string;
}

// --- Contacts ---
export interface Contact {
    id: number;
    name: string;
    company: string;
    role: string;
    email: string;
    phone: string;
    notes: string;
}

// --- Time Tracking ---
export interface TimeEntry {
    id: number;
    user_id: string;
    project_id: string;
    service_phase_id: number;
    entry_date: string;
    duration_hours: number;
    description: string;
    invoice_id?: string | null;
    created_at?: string;
}

// --- Finance ---
export interface FinanceItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    kostengruppe?: string;
    isImported?: boolean;
}

export type OfferStatus = 'Entwurf' | 'Gesendet' | 'Angenommen' | 'Abgelehnt';
export type OrderStatus = 'In Bearbeitung' | 'Abgeschlossen' | 'Storniert';
export type InvoiceStatus = 'Entwurf' | 'Offen' | 'Bezahlt' | 'Überfällig' | 'Storniert';
export type InvoiceType = 'Rechnung' | 'Abschlagsrechnung' | 'Schlussrechnung' | 'Gutschrift';
export type SupplierInvoiceStatus = 'Entwurf' | 'Offen' | 'Bezahlt' | 'Überfällig';
export type DunningStatus = 'Aktiv' | 'Pausiert' | 'Abgeschlossen';

interface FinanceDocumentBase {
    id: string;
    projectId: string;
    items: FinanceItem[];
    netAmount: number;
    taxAmount: number;
    grossAmount: number;
}
export interface Offer extends FinanceDocumentBase {
    contactId: number;
    date: string;
    offerNumber: string;
    validUntil: string;
    status: OfferStatus;
}
export interface Order extends FinanceDocumentBase {
    contactId: number;
    date: string;
    orderNumber: string;
    offerId?: string;
    status: OrderStatus;
}
export interface Invoice extends FinanceDocumentBase {
    contactId: number;
    date: string;
    invoiceNumber: string;
    orderId?: string;
    dueDate: string;
    performanceDate: string;
    status: InvoiceStatus;
    type: InvoiceType;
    amountPaid: number;
}
export interface SupplierInvoice extends FinanceDocumentBase {
    supplierContactId: number;
    invoiceDate: string;
    invoiceNumber: string;
    dueDate: string;
    status: SupplierInvoiceStatus;
    amountPaid: number;
    createdAt: string;
}

// --- Office Management ---
export type AbsenceType = 'Urlaub' | 'Krankheit' | 'Fortbildung' | 'Sonstiges';
export type AbsenceStatus = 'Beantragt' | 'Genehmigt' | 'Abgelehnt';
export interface Absence {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    type: AbsenceType;
    status: AbsenceStatus;
    notes?: string;
    approved_by?: string;
    created_at: string;
}

export interface MailLogEntry {
    id: string;
    direction: 'Eingang' | 'Ausgang';
    mail_date: string;
    sender_or_recipient: string;
    subject: string;
    related_project_id?: string | null;
    processed_by_user_id: string;
    created_at: string;
}

export type ContractCategory = 'Mietvertrag' | 'Softwarelizenz' | 'Versicherung' | 'Wartungsvertrag' | 'Sonstiges';
export type ContractStatus = 'Aktiv' | 'Gekündigt' | 'Abgelaufen';
export interface Contract {
    id: string;
    contract_name: string;
    contract_partner: string;
    category: ContractCategory;
    status: ContractStatus;
    start_date: string;
    end_date?: string | null;
    notice_period_days?: number | null;
    termination_date?: string | null;
    responsible_user_id?: string | null;
    notes?: string;
    file_path?: string | null;
    created_at: string;
}

export type InventoryCategory = 'Computer' | 'Monitor' | 'Softwarelizenz' | 'Firmenfahrzeug' | 'Sonstiges';
export type InventoryStatus = 'Im Lager' | 'In Benutzung' | 'Defekt' | 'Ausgemustert';
export interface InventoryItem {
    id: string;
    item_name: string;
    inventory_number?: string | null;
    category: InventoryCategory;
    status: InventoryStatus;
    purchase_date?: string | null;
    purchase_price?: number | null;
    assigned_to_user_id?: string | null;
    description?: string;
    notes?: string;
    created_at: string;
}

export interface DunningHistoryEntry {
    date: string;
    level: number;
    action: string;
    user_name: string;
}
export interface DunningProcess {
    id: string;
    invoice_id: string;
    dunning_level: number;
    status: DunningStatus;
    last_dunning_date?: string | null;
    next_dunning_date?: string | null;
    history: DunningHistoryEntry[];
    created_at: string;
}

// --- Admin & Settings ---
export interface SystemSetting {
    key: string;
    value: any;
}
export interface AuditLogEntry {
    id: string;
    created_at: string;
    user_id: string;
    user_name: string;
    action: string;
    target_type: string;
    target_id: string;
}
export interface Integration {
    id: string;
    name: string;
    config: any;
    enabled: boolean;
}
export interface RolePermission {
    role: UserRole;
    permissions: string[];
}

// --- Templates & Definitions ---
export interface ChecklistTemplate {
    id: number;
    name: string;
    applicable_phase?: number;
    items: { id: string, text: string }[];
}

export interface DocumentTemplate {
    id: string;
    name: string;
    content: string;
}

// Deprecated or Unused
export interface ServicePhaseDefinition {
    id: number;
    name: string;
    defaultPercentage: number;
}

// --- AI & Analysis ---
export interface SuggestedAction {
    type: 'CREATE_TIME_ENTRY';
    payload: any;
    description: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'radar' | 'heatmap' | 'sankey';

export interface ChartDefinition {
    id: string;
    name: string;
    type: ChartType;
    owner_id: string;
    dataSource: string;
    config: {
        rawJson?: string;
        title?: string;
        xAxis?: {
            type?: 'category' | 'value' | 'time' | 'log';
            sourceColumn?: string;
        };
        yAxis?: {
            type?: 'category' | 'value' | 'time' | 'log';
        };
        series?: {
            type: ChartType;
            sourceColumn: string;
        }[];
    };
    created_at?: string;
}

// Misc
export interface AccordionSection {
    title: string;
    content: string;
}
