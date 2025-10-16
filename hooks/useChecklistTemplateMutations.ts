import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { ChecklistTemplate } from '../types';

export function useChecklistTemplateMutations() {
    const queryClient = useQueryClient();
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templateData'] });
        },
        onError: (error: Error) => {
            console.error(error.message);
            // Here you could call a global error handler/toast notification
        }
    };

    const createTemplateMutation = useMutation({
        mutationFn: async (newData: Partial<Omit<ChecklistTemplate, 'id'>>) => {
            const { data, error } = await supabase.from('checklist_templates').insert([newData]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions
    });
    
    const updateTemplateMutation = useMutation({
        mutationFn: async (updateData: ChecklistTemplate) => {
            const { id, ...updates } = updateData;
            const { data, error } = await supabase.from('checklist_templates').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions
    });
    
    const deleteTemplateMutation = useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        ...mutationOptions
    });

    return { createTemplateMutation, updateTemplateMutation, deleteTemplateMutation };
}