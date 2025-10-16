import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Contact } from '../types';

// Fetch function
async function fetchContacts(): Promise<Contact[]> {
    console.log("Fetching Contacts Data via useQuery...");
    const { data, error } = await supabase.from('contacts').select('*').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    
    // Data Sanitization: Ensure every contact has safe default values for all properties.
    return (data || [])
        .filter(Boolean) // Remove any null/undefined entries
        .map(contact => ({
            id: contact.id,
            name: contact.name || '',
            company: contact.company || '',
            role: contact.role || '',
            email: contact.email || '',
            phone: contact.phone || '',
            notes: contact.notes || '',
        })) as Contact[];
}

// Custom hook to get contacts
export function useContacts() {
    return useQuery({
        queryKey: ['contacts'],
        queryFn: fetchContacts,
    });
}

// Custom hook for mutations
export function useContactMutations() {
    const queryClient = useQueryClient();

    const createContactMutation = useMutation({
        mutationFn: async (newContact: Partial<Omit<Contact, 'id'>>) => {
            const { data, error } = await supabase.from('contacts').insert([newContact]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    const updateContactMutation = useMutation({
        mutationFn: async (updatedContact: Partial<Contact> & { id: number }) => {
            const { id, ...updates } = updatedContact;
            const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    const deleteContactMutation = useMutation({
        mutationFn: async (contactId: number) => {
            const { error } = await supabase.from('contacts').delete().eq('id', contactId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    return { createContactMutation, updateContactMutation, deleteContactMutation };
}