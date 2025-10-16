import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Project, TodoState } from '../types';

// Default initial state for a project's todo board
const defaultTodos: TodoState = {
    tasks: {},
    categories: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'inprogress': { id: 'inprogress', title: 'In Bearbeitung', taskIds: [] },
        'done': { id: 'done', title: 'Erledigt', taskIds: [] }
    },
    categoryOrder: ['todo', 'inprogress', 'done']
};

/**
 * Converts an application-side project object (camelCase) to a database-side payload (lowercase/snake_case).
 * This function ONLY includes fields that exist in the 'projects' table schema provided by the user.
 * @param projectData The partial project data from the application.
 * @returns An object with keys formatted for the database.
 */
const projectToDbPayload = (projectData: Partial<Project>): any => {
    const payload: { [key: string]: any } = {};
    for (const key in projectData) {
        if (Object.prototype.hasOwnProperty.call(projectData, key)) {
            const value = (projectData as any)[key];
            
            // Map from camelCase to snake_case/lowercase and check if it's a valid DB column
            if (key === 'projectNumber') payload['projectnumber'] = value;
            else if (key === 'startDate') payload['startdate'] = value;
            else if (key === 'endDate') payload['enddate'] = value;
            else if (key === 'projectCategory') payload['projectcategory'] = value;
            else if (key === 'grossFloorArea') payload['grossfloorarea'] = value;
            else if (key === 'projectLeiterIds') payload['projectleiterids'] = value;
            else if (key === 'deputyProjectLeiterIds') payload['deputyprojectleiterids'] = value;
            else if (key === 'assignedPhases') payload['assignedphases'] = value;
            else if (key === 'assignedSystems') payload['assignedsystems'] = value;
            else if (key === 'logoUrl') payload['logourl'] = value;
            else if (key === 'ganttCharts') payload['ganttcharts'] = value;
            else if (key === 'isArchived') payload['is_archived'] = value;
            else if (key === 'createdAt') payload['created_at'] = value;
            // These keys are the same in DB and app and are valid columns
            else if (['id', 'name', 'status', 'representatives', 'milestones', 'memos', 'stakeholders', 'todos'].includes(key)) {
                payload[key] = value;
            }
            // All other keys from the Project type (like 'erlauterungsbericht', 'planDocuments') are intentionally ignored.
        }
    }
    return payload;
};

/**
 * Maps a database record (lowercase/snake_case keys) to a sanitized, application-side Project object (camelCase).
 * @param dbProject The raw project data from Supabase.
 * @returns A structured and sanitized Project object.
 */
const mapProjectFromDb = (dbProject: any): Project => {
    return {
        id: dbProject.id,
        name: dbProject.name || 'Unbenanntes Projekt',
        projectNumber: dbProject.projectnumber,
        startDate: dbProject.startdate || new Date().toISOString(),
        endDate: dbProject.enddate,
        status: dbProject.status || 'In Planung',
        projectCategory: dbProject.projectcategory,
        grossFloorArea: dbProject.grossfloorarea,
        projectLeiterIds: Array.isArray(dbProject.projectleiterids) ? dbProject.projectleiterids : [],
        deputyProjectLeiterIds: Array.isArray(dbProject.deputyprojectleiterids) ? dbProject.deputyprojectleiterids : [],
        assignedPhases: Array.isArray(dbProject.assignedphases) ? dbProject.assignedphases : [],
        assignedSystems: Array.isArray(dbProject.assignedsystems) ? dbProject.assignedsystems : [],
        representatives: Array.isArray(dbProject.representatives) ? dbProject.representatives : [],
        milestones: Array.isArray(dbProject.milestones) ? dbProject.milestones : [],
        memos: Array.isArray(dbProject.memos) ? dbProject.memos : [],
        stakeholders: Array.isArray(dbProject.stakeholders) ? dbProject.stakeholders : [],
        logoUrl: dbProject.logourl,
        ganttCharts: Array.isArray(dbProject.ganttcharts) ? dbProject.ganttcharts : [],
        todos: (dbProject.todos && dbProject.todos.tasks) ? dbProject.todos : defaultTodos,
        isArchived: dbProject.is_archived || false,
        createdAt: dbProject.created_at,
        
        // Fields from Project type that are NOT in the database; provide safe defaults.
        // This prevents runtime errors if other parts of the app expect these fields.
        erlauterungsbericht: [], 
        fireProtectionDocs: [], 
        technicalDocuments: [], 
        planDocuments: [],
        schematics: [],
        serviceSpecifications: [],
        generalAttachments: [],
    };
};

// Fetch function
async function fetchProjects(): Promise<Project[]> {
    console.log("Fetching Projects Data via useQuery...");
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        // FIX: Use 'startdate' (lowercase) for ordering to match the database schema
        .order('startdate', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    
    return (data || []).filter(Boolean).map(mapProjectFromDb);
}

// Custom hook to get projects
export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: fetchProjects,
    });
}

// Custom hook for project mutations
export function useProjectMutations() {
    const queryClient = useQueryClient();

    const createProjectMutation = useMutation({
        mutationFn: async (newProject: Partial<Project>) => {
            const payload = projectToDbPayload(newProject);
            const { error } = await supabase.from('projects').insert([payload]);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: Error) => {
            console.error(error.message);
        }
    });

    const updateProjectMutation = useMutation({
        mutationFn: async ({ projectId, updates }: { projectId: string, updates: Partial<Project> }) => {
            const payload = projectToDbPayload(updates);
            const { error } = await supabase
                .from('projects')
                .update(payload)
                .eq('id', projectId);

            if (error) {
                throw new Error(`Update fehlgeschlagen. Überprüfen Sie die Schreib-Berechtigungen (Row Level Security). Details: ${error.message}`);
            }
        },
        onMutate: async ({ projectId, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['projects'] });
            const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
            queryClient.setQueryData<Project[]>(['projects'], old =>
                old?.map(p => (p.id === projectId ? { ...p, ...updates } : p))
            );
            return { previousProjects };
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (err, variables, context) => {
            if (context?.previousProjects) {
                queryClient.setQueryData(['projects'], context.previousProjects);
            }
        },
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const { data: files, error: listError } = await supabase.storage.from('project_files').list(projectId, { limit: 1000 });
            if (listError) console.error("Error listing project files for deletion:", listError);

            if (files && files.length > 0) {
                const filePaths = files.map(file => `${projectId}/${file.name}`);
                const { error: removeError } = await supabase.storage.from('project_files').remove(filePaths);
                if (removeError) console.error("Error deleting project files from storage:", removeError);
            }

            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: Error) => {
            console.error(error.message);
        }
    });

    return { createProjectMutation, updateProjectMutation, deleteProjectMutation };
}