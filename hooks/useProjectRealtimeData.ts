import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Project, TodoState } from '../types';

// Default initial state for a project's todo board, ensures consistency.
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
 * Maps a database record from a realtime payload to a sanitized, application-side Project object.
 * This is crucial for maintaining a consistent data structure in the client-side cache.
 * @param dbProject The raw project data from the Supabase realtime payload.
 * @returns A structured and sanitized Project object.
 */
const mapProjectFromRealtime = (dbProject: any): Project => {
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
        erlauterungsbericht: [], 
        fireProtectionDocs: [], 
        technicalDocuments: [], 
        planDocuments: [],
        schematics: [],
        serviceSpecifications: [],
        generalAttachments: [],
    };
};

export function useProjectRealtimeData() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase.channel('public:projects')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
                console.log('Realtime change received!', payload);
                const queryKey = ['projects'];

                switch (payload.eventType) {
                    case 'UPDATE':
                        const updatedProject = mapProjectFromRealtime(payload.new);
                        queryClient.setQueryData<Project[]>(queryKey, oldData => 
                            oldData?.map(p => p.id === updatedProject.id ? updatedProject : p) || []
                        );
                        break;
                    
                    case 'INSERT':
                        const newProject = mapProjectFromRealtime(payload.new);
                        queryClient.setQueryData<Project[]>(queryKey, oldData => 
                            [...(oldData || []), newProject]
                        );
                        break;
                    
                    case 'DELETE':
                        const deletedProjectId = payload.old.id;
                        queryClient.setQueryData<Project[]>(queryKey, oldData =>
                            oldData?.filter(p => p.id !== deletedProjectId) || []
                        );
                        break;
                    
                    default:
                        // Fallback for safety, but we aim to avoid this.
                        queryClient.invalidateQueries({ queryKey });
                        break;
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
}
