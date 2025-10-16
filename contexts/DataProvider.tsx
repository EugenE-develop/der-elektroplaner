import React, { FC, ReactNode, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';
import { User, Project, TimeEntry, SuggestedAction } from '../types';
import { AppContext, AppContextType } from './AppContext';
import { useProjects, useProjectMutations } from '../hooks/useProjects';
import { useContacts, useContactMutations } from '../hooks/useContacts';
import { useFinanceData } from '../hooks/useFinanceData';
import { useOfficeData } from '../hooks/useOfficeData';
import { useAdminData } from '../hooks/useAdminData';
import { useTemplateData } from '../hooks/useTemplateData';
import { useTimeEntries, useTimeEntryMutations } from '../hooks/useTimeEntries';
import { USER_ROLES } from '../constants';

interface DataProviderProps {
    currentUser: User;
    children: ReactNode; // Changed from a render prop function to ReactNode
}

// Helper to sanitize user data from the database
const mapUserFromDb = (user: any): User => ({
  id: user.id,
  name: typeof user.name === 'string' ? user.name : 'Unbekannter Benutzer',
  email: typeof user.email === 'string' ? user.email : '',
  role: USER_ROLES.includes(user.role) ? user.role : 'Systemplaner',
  hourly_rate: typeof user.hourly_rate === 'number' && !isNaN(user.hourly_rate) ? user.hourly_rate : undefined,
});


export const DataProvider: FC<DataProviderProps> = ({ currentUser, children }) => {
    const queryClient = useQueryClient();
    const [errors, setErrors] = useState<{ id: string; message: string; details?: any }[]>([]);
    const [suggestedAction, setSuggestedAction] = useState<SuggestedAction | null>(null);

    // --- DATA FETCHING ---
    const { data: users = [], isLoading: isUsersLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;
            return ((data || []).filter(Boolean)).map(mapUserFromDb); // Sanitize the full user list
        },
    });
    const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
    const { data: contacts = [], isLoading: isContactsLoading } = useContacts();
    const { data: financeData, isLoading: isFinanceLoading } = useFinanceData();
    const { data: officeData, isLoading: isOfficeLoading } = useOfficeData();
    const { data: adminData, isLoading: isAdminLoading } = useAdminData();
    const { data: templateData, isLoading: isTemplatesLoading } = useTemplateData();
    const { data: timeEntries = [], isLoading: isTimeEntriesLoading } = useTimeEntries();


    // --- MUTATIONS ---
    const { createProjectMutation, updateProjectMutation, deleteProjectMutation } = useProjectMutations();
    const { createTimeEntryMutation, updateTimeEntryMutation, deleteTimeEntryMutation } = useTimeEntryMutations();


    const addError = useCallback((message: string, details?: any) => {
        const id = uuidv4();
        setErrors(prev => [...prev, { id, message, details }]);
        setTimeout(() => clearError(id), 6000);
    }, []);

    const clearError = useCallback((id: string) => {
        setErrors(prev => prev.filter(e => e.id !== id));
    }, []);

    const handleCreateUser = async (userData: any) => {
        const { email, password, name, role } = userData;

        // Step 1: Create the user in Supabase Auth.
        // This requires "Enable email confirmation" to be disabled in Supabase project settings.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            addError(`Fehler bei der Benutzer-Authentifizierung: ${authError.message}`);
            return;
        }

        if (!authData.user) {
            addError('Benutzer konnte nicht in der Authentifizierung erstellt werden.');
            return;
        }

        // Step 2: Create the user profile in the 'users' table.
        // This requires an RLS policy allowing INSERT for authorized roles.
        const { error: profileError } = await supabase.from('users').insert({
            id: authData.user.id,
            name,
            email,
            role,
        });

        if (profileError) {
            // In a production app, you might want to delete the auth user to clean up.
            // This requires an admin client: await supabase.auth.admin.deleteUser(authData.user.id);
            addError(`Benutzerprofil konnte nicht erstellt werden: ${profileError.message}. Prüfen Sie die RLS-Richtlinie für INSERT auf 'users'.`);
            return;
        }

        // Step 3: Invalidate the query to refresh the user list in the UI.
        await queryClient.invalidateQueries({ queryKey: ['users'] });
    };

    const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
        const { data, error } = await supabase.from('users').update(updates).eq('id', userId);
        if (error) {
            addError('Benutzer konnte nicht aktualisiert werden.', error);
            return { success: false, error };
        }
        await queryClient.invalidateQueries({ queryKey: ['users'] });
        return { success: true };
    };

    const handleDeleteUser = async (userId: string) => {
        // This only deletes the user profile from the 'public.users' table.
        // The authentication user in 'auth.users' remains for security reasons, as
        // deleting it requires admin privileges not available on the client.
        const { error } = await supabase.from('users').delete().eq('id', userId);

        if (error) {
            addError(`Benutzerprofil konnte nicht gelöscht werden: ${error.message}`);
            return;
        }

        await queryClient.invalidateQueries({ queryKey: ['users'] });
    };

    const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
        try {
            await updateProjectMutation.mutateAsync({ projectId, updates });
        } catch (error: any) {
            addError(error.message || 'Projekt-Update fehlgeschlagen.');
        }
    };

    const contextValue: AppContextType = useMemo(() => ({
        // Data
        users,
        projects,
        contacts,
        timeEntries,
        financeData: financeData || { offers: [], orders: [], invoices: [], supplierInvoices: [] },
        officeData: officeData || { absences: [], mailLog: [], contracts: [], inventoryItems: [], dunningProcesses: [] },
        projectRisks: {}, // Placeholder
        checklistTemplates: templateData?.checklistTemplates || [],
        
        // Current User
        currentUser,

        // Mutations
        handleCreateProject: (p) => createProjectMutation.mutateAsync(p).then(() => {}),
        handleUpdateProject,
        handleDeleteProject: (id) => deleteProjectMutation.mutateAsync(id).then(() => {}),
        handleCreateTimeEntry: (entry) => createTimeEntryMutation.mutateAsync(entry).then(() => {}),
        handleUpdateTimeEntry: (entry) => updateTimeEntryMutation.mutateAsync(entry).then(() => {}),
        handleDeleteTimeEntry: (id) => deleteTimeEntryMutation.mutateAsync(id).then(() => {}),
        handleCreateUser,
        handleUpdateUser,
        handleDeleteUser,

        // AI Actions
        suggestedAction,
        setSuggestedAction,

        // Errors
        errors,
        addError,
        clearError,
    }), [
        users, projects, contacts, timeEntries, financeData, officeData, adminData, templateData, currentUser,
        createProjectMutation, updateProjectMutation, deleteProjectMutation,
        createTimeEntryMutation, updateTimeEntryMutation, deleteTimeEntryMutation,
        errors, addError, clearError, suggestedAction
    ]);

    const isLoading = isUsersLoading || isProjectsLoading || isContactsLoading || isFinanceLoading || isOfficeLoading || isAdminLoading || isTemplatesLoading || isTimeEntriesLoading;
    
    // Show a loading indicator for the whole app while initial data is being fetched
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Lade Anwendungsdaten...</div>;
    }

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};