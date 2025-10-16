

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { ServicePhaseDefinition, SystemSetting, AuditLogEntry, Integration, RolePermission } from '../types';

async function fetchAdminData() {
    console.log("Fetching Admin Data...");
    const { data: systemSettings, error } = await supabase.from('system_settings').select('*');
    if (error) {
        // Don't throw an error if the table just doesn't exist, as it's a setup step.
        // The UI will handle this case gracefully.
        if (error.message.includes("does not exist")) {
            console.warn("system_settings table not found. Returning empty array.");
            return {
                systemSettings: [],
                auditLog: [],
                integrations: [],
                rolePermissions: [],
            };
        }
        throw error;
    }

    const [auditLog, integrations, rolePermissions] = await Promise.all([
        supabase.from('audit_log').select('*').limit(100).order('created_at', { ascending: false }),
        supabase.from('integrations').select('*'),
        supabase.from('role_permissions').select('*'),
    ]);

    if (auditLog.error) throw auditLog.error;
    if (integrations.error) throw integrations.error;
    if (rolePermissions.error) throw rolePermissions.error;
    
    const clean = (res: { data: any[] | null, error: any }) => {
        if (res.error) throw res.error;
        return (res.data || []).filter(Boolean);
    };

    return {
        systemSettings: (systemSettings || []).filter(Boolean) as SystemSetting[],
        auditLog: clean(auditLog) as AuditLogEntry[],
        integrations: clean(integrations) as Integration[],
        rolePermissions: clean(rolePermissions) as RolePermission[],
    };
}

export function useAdminData() {
    // FIX: Removed the `select` property as it was redundant and related to the now-removed `servicePhaseDefinitions`.
    return useQuery({
        queryKey: ['adminData'],
        queryFn: fetchAdminData,
    });
}


// Custom hook for admin data mutations
export function useAdminDataMutations() {
    const queryClient = useQueryClient();

    const updateSystemSettingsMutation = useMutation({
        mutationFn: async (settings: SystemSetting[]) => {
            const { error } = await supabase.from('system_settings').upsert(settings, { onConflict: 'key' });
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminData'] });
        },
    });

    return { updateSystemSettingsMutation };
}