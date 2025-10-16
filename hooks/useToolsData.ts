
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { GanttChart } from '../types';

async function fetchToolsData() {
    console.log("Fetching Tools Data...");
    const { data, error } = await supabase.from('gantt_charts').select('*');
    if (error) throw error;
    
    const cleanedGanttCharts = ((data as GanttChart[]) || [])
        .filter(Boolean)
        .map(chart => ({
            ...chart,
            tasks: (chart.tasks || []).filter(Boolean)
        }));
        
    return {
        ganttCharts: cleanedGanttCharts,
    };
}

export function useToolsData() {
    return useQuery({
        queryKey: ['toolsData'],
        queryFn: fetchToolsData,
    });
}