import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { ChartDefinition } from '../types';

// Fetch function
async function fetchCharts(): Promise<ChartDefinition[]> {
    console.log("Fetching Charts Data via useQuery...");
    const { data, error } = await supabase.from('charts').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    
    // Data Sanitization: Ensure every chart definition has safe defaults.
    return (data || [])
        .filter(Boolean)
        .map(chart => ({
            ...chart,
            name: chart.name || 'Unbenanntes Diagramm',
            dataSource: chart.dataSource || '',
            config: chart.config || {},
        })) as ChartDefinition[];
}

// Custom hook to get charts
export function useCharts() {
    return useQuery({
        queryKey: ['charts'],
        queryFn: fetchCharts,
    });
}

// Custom hook for mutations
export function useChartMutations() {
    const queryClient = useQueryClient();

    const createChartMutation = useMutation({
        mutationFn: async (newChart: Omit<ChartDefinition, 'id' | 'created_at'>): Promise<ChartDefinition> => {
            const { data, error } = await supabase.from('charts').insert([newChart]).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['charts'] });
        },
    });

    const updateChartMutation = useMutation({
        mutationFn: async (updatedChart: ChartDefinition): Promise<ChartDefinition> => {
            const { id, ...updates } = updatedChart;
            const { data, error } = await supabase.from('charts').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['charts'] });
            queryClient.setQueryData(['charts', data.id], data);
        },
    });

    const deleteChartMutation = useMutation({
        mutationFn: async (chartId: string) => {
            const { error } = await supabase.from('charts').delete().eq('id', chartId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['charts'] });
        },
    });

    return { createChartMutation, updateChartMutation, deleteChartMutation };
}