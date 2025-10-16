import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Absence, MailLogEntry, Contract, InventoryItem, DunningProcess } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Fetch function
async function fetchOfficeData() {
    console.log("Fetching Office Data via useQuery...");
    const [absences, mailLog, contracts, inventoryItems, dunningProcesses] = await Promise.all([
        supabase.from('absences').select('*'),
        supabase.from('mail_log').select('*'),
        supabase.from('contracts').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('dunning_processes').select('*'),
    ]);

    if (absences.error) throw new Error(absences.error.message);
    if (mailLog.error) throw new Error(mailLog.error.message);
    if (contracts.error) throw new Error(contracts.error.message);
    if (inventoryItems.error) throw new Error(inventoryItems.error.message);
    if (dunningProcesses.error) throw new Error(dunningProcesses.error.message);

    const clean = (data: any[] | null) => (data || []).filter(Boolean);

    return {
        absences: clean(absences.data) as Absence[],
        mailLog: clean(mailLog.data) as MailLogEntry[],
        contracts: clean(contracts.data) as Contract[],
        inventoryItems: clean(inventoryItems.data) as InventoryItem[],
        dunningProcesses: (clean(dunningProcesses.data) as DunningProcess[]).map(p => ({
            ...p,
            history: (p.history || []).filter(Boolean),
        })),
    };
}

// Custom hook to get all office data
export function useOfficeData() {
    return useQuery({
        queryKey: ['officeData'],
        queryFn: fetchOfficeData,
    });
}

// Custom hook for mutations
export function useOfficeMutations() {
    const queryClient = useQueryClient();
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['officeData'] });
        },
    };

    // Absences
    const createAbsenceMutation = useMutation({
        mutationFn: async (newData: Partial<Omit<Absence, 'id'>>) => {
            const { data, error } = await supabase.from('absences').insert([newData]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });
    const updateAbsenceMutation = useMutation({
        mutationFn: async (updateData: Partial<Absence> & { id: string }) => {
            const { id, ...updates } = updateData;
            const { data, error } = await supabase.from('absences').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });
    const deleteAbsenceMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('absences').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        ...mutationOptions,
    });

    // Contracts
    const createContractMutation = useMutation({
        mutationFn: async ({ newData, file, userId }: { newData: Partial<Omit<Contract, 'id'>>; file?: File, userId: string }) => {
            let filePath: string | undefined = undefined;
            if (file) {
                filePath = `contracts/${userId}/${uuidv4()}-${file.name}`;
                const { error: uploadError } = await supabase.storage.from('office_documents').upload(filePath, file);
                if (uploadError) throw new Error(`Fehler beim Hochladen der Vertragsdatei: ${uploadError.message}`);
            }
            const { data, error } = await supabase.from('contracts').insert([{ ...newData, file_path: filePath }]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });
    const updateContractMutation = useMutation({
        mutationFn: async ({ updateData, file, userId }: { updateData: Partial<Contract> & { id: string }; file?: File, userId: string }) => {
            const { id, ...updates } = updateData;
            let filePath = updates.file_path;
            if (file) {
                if(updates.file_path) {
                    await supabase.storage.from('office_documents').remove([updates.file_path]);
                }
                filePath = `contracts/${userId}/${uuidv4()}-${file.name}`;
                const { error: uploadError } = await supabase.storage.from('office_documents').upload(filePath, file);
                if (uploadError) throw new Error(`Fehler beim Hochladen der Vertragsdatei: ${uploadError.message}`);
            }
            const { data, error } = await supabase.from('contracts').update({ ...updates, file_path: filePath }).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });
    const deleteContractMutation = useMutation({
         mutationFn: async (contract: Contract) => {
            if (contract.file_path) {
                await supabase.storage.from('office_documents').remove([contract.file_path]);
            }
            const { error } = await supabase.from('contracts').delete().eq('id', contract.id);
            if (error) throw new Error(error.message);
        },
        ...mutationOptions,
    });
    
    // Inventory
    const createInventoryItemMutation = useMutation({
         mutationFn: async (newData: Partial<Omit<InventoryItem, 'id'>>) => {
            const { data, error } = await supabase.from('inventory_items').insert([newData]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });
    const updateInventoryItemMutation = useMutation({
        mutationFn: async (updateData: Partial<InventoryItem> & { id: string }) => {
            const { id, ...updates } = updateData;
            const { data, error } = await supabase.from('inventory_items').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });
    const deleteInventoryItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('inventory_items').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        ...mutationOptions,
    });
    
    // Dunning
    const createDunningProcessMutation = useMutation({
         mutationFn: async (newData: Partial<Omit<DunningProcess, 'id'>>) => {
            const { data, error } = await supabase.from('dunning_processes').insert([newData]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });
    const updateDunningProcessMutation = useMutation({
         mutationFn: async (updateData: Partial<DunningProcess> & { id: string }) => {
            const { id, ...updates } = updateData;
            const { data, error } = await supabase.from('dunning_processes').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        ...mutationOptions,
    });


    return {
        createAbsenceMutation,
        updateAbsenceMutation,
        deleteAbsenceMutation,
        createContractMutation,
        updateContractMutation,
        deleteContractMutation,
        createInventoryItemMutation,
        updateInventoryItemMutation,
        deleteInventoryItemMutation,
        createDunningProcessMutation,
        updateDunningProcessMutation,
    };
}