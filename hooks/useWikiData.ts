import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { WikiCategory, WikiArticle } from '../types';

const mapWikiArticleFromDb = (a: any): WikiArticle => ({
    id: a.id, 
    title: a.title || '', 
    content: a.content || '', 
    category_id: a.category_id, 
    author_id: a.author_id, 
    author_name: a.author_name || 'Unbekannt', 
    created_at: a.created_at, 
    last_modified: a.last_modified, 
    attachments: (a.attachments || []).filter(Boolean),
});

async function fetchWikiData() {
    console.log("Fetching Wiki Data...");
    const { data: categories, error: categoriesError } = await supabase.from('wiki_categories').select('*');
    if (categoriesError) throw categoriesError;

    const { data: articles, error: articlesError } = await supabase.from('wiki_articles').select('*');
    if (articlesError) throw articlesError;

    return { 
        categories: (categories || []).filter(c => c && c.id && c.name) as WikiCategory[], 
        articles: ((articles || []).filter(Boolean)).map(mapWikiArticleFromDb) as WikiArticle[] 
    };
}

export function useWikiData() {
    return useQuery({
        queryKey: ['wiki'],
        queryFn: fetchWikiData,
    });
}