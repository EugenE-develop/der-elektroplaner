
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
// FIX: Import the newly created DocumentTemplate type.
import { ChecklistTemplate, DocumentTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

async function fetchTemplateData() {
    console.log("Fetching Template Data...");
    const { data: checklistTemplates, error: checklistError } = await supabase
        .from('checklist_templates')
        .select('*');

    if (checklistError) {
        // Handle case where table might not exist without crashing
        if (checklistError.message.includes("does not exist")) {
            console.warn("Table 'checklist_templates' not found. Returning empty array.");
        } else {
            throw checklistError;
        }
    }

    // Placeholder for document_templates, can be expanded later
    const documentTemplates = { data: [], error: null };
    
    const cleanedTemplates = ((checklistTemplates as any[] | null) || [])
        .filter(Boolean)
        .map(template => {
            if (!template) return null;
            return {
                ...template,
                name: template.name || 'Unbenannte Vorlage',
                items: (Array.isArray(template.items) ? template.items : []).map((item: any) => {
                    if (!item) return null;
                    // If item is just a string, convert it to the correct object structure
                    if (typeof item === 'string') {
                        return { id: uuidv4(), text: item };
                    }
                    // If it's an object, ensure it has the required fields
                    if (typeof item === 'object' && typeof item.text === 'string') {
                        return { id: String(item.id || uuidv4()), text: item.text };
                    }
                    return null; // Discard malformed items
                }).filter(Boolean),
            }
        }).filter(Boolean);

    return {
        checklistTemplates: cleanedTemplates as ChecklistTemplate[],
        documentTemplates: (documentTemplates.data as DocumentTemplate[]) || [],
    };
}

export function useTemplateData() {
    return useQuery({
        queryKey: ['templateData'],
        queryFn: fetchTemplateData,
    });
}
