import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { TimeEntry } from '../types';

// Fetch function
async function fetchTimeEntries(): Promise<TimeEntry[]> {
    const { data, error } = await supabase.from('time_entries').select('*');
    if (error) throw new Error(error.message);
    
    // Data Sanitization: Ensure every entry has safe defaults.
    return (data || [])
        .filter(Boolean)
        .map(entry => ({
            ...entry,
            description: entry.description || '',
        })) as TimeEntry[];
}

// Custom hook to get time entries
export function useTimeEntries() {
    return useQuery({
        queryKey: ['time_entries'],
        queryFn: fetchTimeEntries,
    });
}

// Custom hook for mutations
export function useTimeEntryMutations() {
    const queryClient = useQueryClient();
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time_entries'] });
        },
        onError: (error: Error) => {
            console.error("Time Entry Mutation Error:", error.message);
            // Here you could trigger a global error notification
        },
    };

    const createTimeEntryMutation = useMutation({
        mutationFn: async (newEntry: Omit<TimeEntry, 'id' | 'invoice_id' | 'created_at'>) => {
            const { data, error } = await supabase.from('time_entries').insert([newEntry]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions
    });

    const updateTimeEntryMutation = useMutation({
        mutationFn: async (updatedEntry: TimeEntry) => {
            const { id, ...updates } = updatedEntry;
            const { data, error } = await supabase.from('time_entries').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions
    });

    const deleteTimeEntryMutation = useMutation({
        mutationFn: async (entryId: number) => {
            const { error } = await supabase.from('time_entries').delete().eq('id', entryId);
            if (error) throw new Error(error.message);
        },
        ...mutationOptions
    });

    return { createTimeEntryMutation, updateTimeEntryMutation, deleteTimeEntryMutation };
}