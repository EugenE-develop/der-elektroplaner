import React, { useState, FC, useMemo, useEffect, ChangeEvent } from 'react';
// FIX: Changed import to be a relative path.
import { WikiArticle, WikiCategory, User } from '../../types';
import { supabase } from '../../supabaseClient';
import ReactQuill from 'react-quill';
import { useAppContext } from '../../contexts/AppContext';
import { GoogleGenAI } from "@google/genai";
import { useWikiData } from '../../hooks/useWikiData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import Icon from '../shared/Icon';

type ViewMode = 'list' | 'view' | 'edit' | 'create';

interface AiSearchResult {
    title: string;
    content: string;
    sources: { uri: string; title: string }[];
}

interface WikiProps {
    selectedArticleId?: number | null;
}

const Wiki: FC<WikiProps> = ({ selectedArticleId }) => {
    const { currentUser, addError } = useAppContext();
    const { data: wikiData, isLoading, isError } = useWikiData();
    const queryClient = useQueryClient();

    const categories = wikiData?.categories || [];
    const articles = wikiData?.articles || [];

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    
    // State for editing/creating
    const [editedTitle, setEditedTitle] = useState('');
    const [editedContent, setEditedContent] = useState('');
    const [editedCategoryId, setEditedCategoryId] = useState<number | null>(null);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
    
    const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());
    
    // State for creating a category
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // State for AI Search
    const [aiSearchQuery, setAiSearchQuery] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiSearchResult, setAiSearchResult] = useState<AiSearchResult | null>(null);
    const [aiSearchError, setAiSearchError] = useState('');

    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].id);
        }
        if (categories.length > 0 && openCategories.size === 0) {
           // FIX: Explicitly specify the generic type for new Set() to 'number' to resolve a
           // TypeScript inference issue where it was incorrectly inferring 'Set<unknown>'.
           const initialOpen = new Set<number>(categories.filter(c => articles.some(a => a.category_id === c.id)).map(c => c.id));
           setOpenCategories(initialOpen);
        }
    }, [categories, articles, selectedCategoryId, openCategories.size]);

    useEffect(() => {
        if (selectedArticleId && articles.length > 0) {
            const articleToSelect = articles.find(a => a.id === selectedArticleId);
            if (articleToSelect) {
                setSelectedArticle(articleToSelect);
                setViewMode('view');
                // Ensure the category of the selected article is open
                if (!openCategories.has(articleToSelect.category_id)) {
                    setOpenCategories(prev => new Set(prev).add(articleToSelect.category_id));
                }
            }
        }
    }, [selectedArticleId, articles, openCategories]);
    
    const commonInputClasses = "w-full p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm";

    const articlesByCategory = useMemo(() => {
        const grouped: { [key: number]: WikiArticle[] } = {};
        categories.forEach(cat => {
            grouped[cat.id] = articles.filter(art => art.category_id === cat.id);
        });
        return grouped;
    }, [articles, categories]);
    
    const getPublicUrl = (path: string) => {
        const { data } = supabase.storage.from('wiki_attachments').getPublicUrl(path);
        return data.publicUrl;
    };
    
    // --- Mutations ---
    const createCategoryMutation = useMutation({
        mutationFn: async (name: string) => {
            const { error } = await supabase.from('wiki_categories').insert({ name });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wiki'] }),
        onError: (error: Error) => {
            addError(`Fehler beim Erstellen der Kategorie: ${error.message}`);
        }
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wiki'] });
            if (viewMode === 'create') setViewMode('list');
            else setViewMode('view');
        },
        onError: (error: Error) => {
            addError(`Speichern des Wiki-Artikels fehlgeschlagen: ${error.message}`);
        },
    };

    const createArticleMutation = useMutation({
        mutationFn: async ({ articleData, files }: { articleData: Omit<WikiArticle, 'id'|'created_at'|'last_modified'|'author_name'|'author_id'|'attachments'>, files: File[] }) => {
            if (!currentUser) throw new Error("User not authenticated");
            const attachmentPaths: string[] = [];
            for (const file of files) {
                const filePath = `wiki/${currentUser.id}/${uuidv4()}-${file.name}`;
                const { error } = await supabase.storage.from('wiki_attachments').upload(filePath, file);
                if (error) throw error;
                attachmentPaths.push(filePath);
            }
            const { error } = await supabase.from('wiki_articles').insert({ ...articleData, author_id: currentUser.id, author_name: currentUser.name, attachments: attachmentPaths });
            if (error) throw error;
        },
        ...mutationOptions
    });

    const updateArticleMutation = useMutation({
        mutationFn: async ({ articleId, updates, filesToAdd, attachmentsToRemove }: { articleId: number, updates: Partial<WikiArticle>, filesToAdd: File[], attachmentsToRemove: string[] }) => {
            if (!currentUser) throw new Error("User not authenticated");
            if (attachmentsToRemove.length > 0) {
                const { error } = await supabase.storage.from('wiki_attachments').remove(attachmentsToRemove);
                if (error) throw error;
            }
            const newAttachmentPaths: string[] = [];
            for (const file of filesToAdd) {
                const filePath = `wiki/${currentUser.id}/${uuidv4()}-${file.name}`;
                const { error } = await supabase.storage.from('wiki_attachments').upload(filePath, file);
                if (error) throw error;
                newAttachmentPaths.push(filePath);
            }
            const existingAttachments = articles.find(a => a.id === articleId)?.attachments || [];
            const finalAttachments = [...existingAttachments.filter(path => !attachmentsToRemove.includes(path)), ...newAttachmentPaths];
            const finalUpdates = { ...updates, attachments: finalAttachments, last_modified: new Date().toISOString() };
            const { error } = await supabase.from('wiki_articles').update(finalUpdates).eq('id', articleId);
            if (error) throw error;
        },
        ...mutationOptions
    });
    
    const deleteArticleMutation = useMutation({
        mutationFn: async (articleId: number) => {
            const articleToDelete = articles.find(a => a.id === articleId);
            if (articleToDelete?.attachments && articleToDelete.attachments.length > 0) {
                await supabase.storage.from('wiki_attachments').remove(articleToDelete.attachments);
            }
            const { error } = await supabase.from('wiki_articles').delete().eq('id', articleId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wiki'] });
            setSelectedArticle(null);
            setViewMode('list');
        },
        onError: (error: Error) => {
            addError(`Löschen des Wiki-Artikels fehlgeschlagen: ${error.message}`);
        },
    });

    // --- Event Handlers ---
    const handleSelectArticle = (article: WikiArticle) => {
        setSelectedArticle(article);
        setViewMode('view');
    };

    const handleEdit = () => {
        if (!selectedArticle) return;
        setEditedTitle(selectedArticle.title);
        setEditedContent(selectedArticle.content);
        setEditedCategoryId(selectedArticle.category_id);
        setFilesToUpload([]);
        setAttachmentsToRemove([]);
        setViewMode('edit');
    };
    
    const handleCreate = () => {
        setSelectedArticle(null);
        setEditedTitle('');
        setEditedContent('');
        setEditedCategoryId(selectedCategoryId);
        setFilesToUpload([]);
        setAttachmentsToRemove([]);
        setViewMode('create');
    };
    
    const handleCancel = () => {
        if (selectedArticle) setViewMode('view');
        else setViewMode('list');
    };

    const handleSave = async () => {
        if (!currentUser) return;

        if (viewMode === 'edit' && selectedArticle && editedCategoryId) {
            updateArticleMutation.mutate({
                articleId: selectedArticle.id, 
                updates: { title: editedTitle, content: editedContent, category_id: editedCategoryId },
                filesToAdd: filesToUpload,
                attachmentsToRemove
            });
        } else if (viewMode === 'create' && editedCategoryId) {
            createArticleMutation.mutate({
                articleData: { title: editedTitle, content: editedContent, category_id: editedCategoryId },
                files: filesToUpload
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedArticle || !canEdit) return;
        if (window.confirm(`Möchten Sie den Artikel "${selectedArticle.title}" wirklich löschen?`)) {
            deleteArticleMutation.mutate(selectedArticle.id);
        }
    };
    
    const handleDeleteAttachment = async (pathToRemove: string) => {
        if (!selectedArticle) return;
        const fileName = pathToRemove.split('-').slice(1).join('-');
        if (window.confirm(`Möchten Sie den Anhang "${fileName}" wirklich löschen?`)) {
            updateArticleMutation.mutate({
                articleId: selectedArticle.id,
                updates: {},
                filesToAdd: [],
                attachmentsToRemove: [pathToRemove]
            });
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFilesToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeNewFile = (index: number) => setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    const removeExistingAttachment = (path: string) => setAttachmentsToRemove(prev => [...prev, path]);
    
    const toggleCategory = (id: number) => {
        setOpenCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const canEdit = currentUser?.role === 'Geschäftsführung' || currentUser?.role === 'Leitung' || currentUser?.role === 'Projektleiter' || currentUser?.role === 'Büro';
    const isSubmitting = createCategoryMutation.isPending || createArticleMutation.isPending || updateArticleMutation.isPending || deleteArticleMutation.isPending;

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link'],
            ['clean']
        ],
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || isSubmitting) return;
        createCategoryMutation.mutate(newCategoryName.trim(), {
            onSuccess: () => {
                setNewCategoryName('');
                setIsCreatingCategory(false);
            }
        });
    };

    // FIX: Implemented AI search and article creation functionality.
    const handleAiSearch = async () => {
        if (!aiSearchQuery.trim()) return;
    
        setIsAiSearching(true);
        setAiSearchError('');
        setAiSearchResult(null);
    
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Erstelle einen kurzen Wiki-Artikel zum Thema: "${aiSearchQuery}". Fasse die wichtigsten Punkte zusammen und präsentiere sie in gut strukturiertem HTML-Format (z.B. mit <p>, <ul>, <li>, <strong>).`,
                config: {
                    tools: [{googleSearch: {}}],
                },
            });
    
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const sources = groundingMetadata?.groundingChunks
                ?.map((chunk: any) => chunk.web)
                .filter((web: any) => web?.uri) || [];
    
            // FIX: Replaced unsafe type cast with a robust mapping function to guarantee string properties.
            const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values())
                .map((source: any) => {
                    const uri = String(source?.uri || '');
                    const title = typeof source?.title === 'string' && source.title ? source.title : uri;
                    return { uri, title };
                });
            
            setAiSearchResult({
                title: aiSearchQuery,
                content: response.text,
                sources: uniqueSources,
            });
    
        } catch (error: any) {
            console.error("AI Search Error:", error);
            setAiSearchError("Fehler bei der KI-Recherche. Bitte versuchen Sie es erneut.");
        } finally {
            setIsAiSearching(false);
        }
    };

    const handleSaveAiResultAsArticle = () => {
        if (!aiSearchResult) return;
        
        setSelectedArticle(null);
        setEditedTitle(aiSearchResult.title);
        setEditedContent(aiSearchResult.content);
        setEditedCategoryId(selectedCategoryId || (categories.length > 0 ? categories[0].id : null));
        setFilesToUpload([]);
        setAttachmentsToRemove([]);
        setViewMode('create');
    
        setAiSearchResult(null);
        setAiSearchQuery('');
    };

    const renderNavigation = (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold uppercase text-text-light">Kategorien</h3>
                {canEdit && (
                    <div className="flex gap-2">
                        <button onClick={() => setIsCreatingCategory(true)} className="flex items-center gap-1 text-xs font-medium py-1 px-2 bg-secondary text-text rounded hover:bg-secondary-hover border border-border">
                             <span className="w-3 h-3"><Icon name="Plus" /></span>
                            Kat.
                        </button>
                        <button onClick={handleCreate} className="flex items-center gap-1 text-xs font-medium py-1 px-2 bg-primary text-white rounded hover:bg-primary-hover">
                             <span className="w-3 h-3"><Icon name="FilePlus2" /></span>
                            Artikel
                        </button>
                    </div>
                )}
            </div>
            
            {isCreatingCategory && (
                <div className="p-2 mb-4 bg-white border border-border rounded-md">
                    <input 
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="Name der Kategorie"
                        className="w-full p-1 text-sm border-b mb-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsCreatingCategory(false)} className="text-xs font-medium py-1 px-2 rounded hover:bg-secondary">Abbr.</button>
                        <button onClick={handleCreateCategory} disabled={isSubmitting} className="text-xs font-medium py-1 px-2 rounded bg-primary text-white disabled:opacity-50">Speichern</button>
                    </div>
                </div>
            )}
            
            <ul className="space-y-1">
                {categories.map(category => (
                    <li key={category.id}>
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full text-left p-2 rounded text-sm font-medium flex justify-between items-center hover:bg-secondary-hover"
                        >
                            {category.name}
                            <span className={`text-text-light transform transition-transform ${openCategories.has(category.id) ? 'rotate-90' : ''}`}><Icon name="ChevronRight" className="w-4 h-4" /></span>
                        </button>
                        {openCategories.has(category.id) && (
                            <ul className="pl-3 mt-1 border-l-2 border-border">
                                {articlesByCategory[category.id]?.map(article => (
                                    <li key={article.id}>
                                        <button onClick={() => handleSelectArticle(article)} className={`w-full text-left p-1.5 rounded text-xs truncate ${selectedArticle?.id === article.id ? 'bg-primary/20 text-primary' : 'hover:bg-secondary-hover'}`}>
                                            {article.title}
                                        </button>
                                    </li>
                                ))}
                                {articlesByCategory[category.id]?.length === 0 && <p className="text-xs text-text-light p-1.5 italic">Leer</p>}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </>
    );

    if (isLoading) return <div className="p-8 text-center">Lade Wiki-Daten...</div>;
    if (isError) return <div className="p-8 text-center text-danger">Fehler beim Laden der Wiki-Daten.</div>;

    return (
        <div className="bg-card md:rounded-lg md:shadow-lg p-4 sm:p-6 md:p-10 w-full max-w-7xl mx-auto">
            <h2 className="text-center text-2xl font-semibold text-text mb-2">Wissensdatenbank (Wiki)</h2>
            <p className="text-center text-text-light mb-10">Hier finden Sie Normen, Richtlinien und interne Vorgaben.</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 min-h-[600px]">
                
                 {/* Mobile Navigation */}
                <div className="md:hidden">
                    <details className="bg-slate-50 rounded-lg border border-border group">
                        <summary className="p-4 font-semibold cursor-pointer flex justify-between items-center list-none">
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 text-primary"><Icon name="Menu" /></span>
                                <span>Navigation & Kategorien</span>
                            </div>
                            <span className="w-5 h-5 text-text-light transition-transform duration-200 group-open:rotate-90">
                                <Icon name="ChevronRight" />
                            </span>
                        </summary>
                        <div className="p-4 border-t border-border">
                            {renderNavigation}
                        </div>
                    </details>
                </div>
                
                {/* Desktop Sidebar */}
                <aside className="hidden md:block md:col-span-1 bg-slate-50 rounded-lg p-4 border border-border h-full overflow-y-auto">
                    {renderNavigation}
                </aside>
                
                <main className="col-span-1 md:col-span-3">
                    {viewMode === 'view' && selectedArticle ? (
                         <div className="p-4 border border-border rounded-lg h-full flex flex-col">
                            <div className="flex items-start mb-4 pb-4 border-b border-border">
                                <div className="flex-grow min-w-0">
                                    <h3 className="text-xl font-semibold">{selectedArticle.title}</h3>
                                    <p className="text-sm text-text-light">Autor: {selectedArticle.author_name} | Zuletzt geändert: {new Date(selectedArticle.last_modified).toLocaleDateString('de-DE')}</p>
                                </div>
                                {canEdit && 
                                    <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                                        <button onClick={handleEdit} className="p-2 rounded-full hover:bg-secondary disabled:opacity-50" title="Bearbeiten" disabled={isSubmitting}>
                                            <div className="w-5 h-5 text-text-light"><Icon name="Pencil" /></div>
                                        </button>
                                        <button onClick={handleDelete} className="p-2 rounded-full hover:bg-danger/10 disabled:opacity-50" title="Löschen" disabled={isSubmitting}>
                                            <div className="w-5 h-5 text-danger"><Icon name="Trash2" /></div>
                                        </button>
                                    </div>
                                }
                            </div>
                            <div className="prose max-w-none flex-grow" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                             {selectedArticle.attachments && selectedArticle.attachments.length > 0 && <div className="mt-4 pt-4 border-t border-border"><h4 className="font-semibold text-sm mb-2">Anhänge</h4><ul className="space-y-1">{selectedArticle.attachments.map((path) => <li key={path} className="flex justify-between items-center p-1 bg-secondary rounded text-sm"><a href={getPublicUrl(path)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate pr-4">{path.split('-').slice(1).join('-')}</a>{canEdit && (<button onClick={() => handleDeleteAttachment(path)} className="text-danger text-xs font-medium hover:underline flex-shrink-0 disabled:opacity-50" disabled={isSubmitting}>Löschen</button>)}</li>)}</ul></div>}
                            <button onClick={() => { setSelectedArticle(null); setViewMode('list'); }} className="mt-6 text-sm text-primary hover:underline self-start">← Zurück zur Übersicht</button>
                        </div>
                    ) : viewMode === 'edit' || viewMode === 'create' ? (
                        <div className="p-4 border border-border rounded-lg h-full flex flex-col gap-4">
                            <h3 className="text-xl font-semibold">{viewMode === 'edit' ? 'Artikel bearbeiten' : 'Neuen Artikel erstellen'}</h3>
                            <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Titel</label><input type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className={commonInputClasses} /></div>
                            <div className="flex flex-col"><label className="text-sm font-medium text-text-light mb-1">Kategorie</label><select value={editedCategoryId ?? ''} onChange={e => setEditedCategoryId(Number(e.target.value))} className={commonInputClasses}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="flex flex-col flex-grow">
                                <label className="text-sm font-medium text-text-light mb-1">Inhalt</label>
                                <div className="editor-wrapper flex-grow min-h-[300px]">
                                    <ReactQuill theme="snow" value={editedContent} onChange={setEditedContent} modules={quillModules} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-text-light">Anhänge</label>
                                {viewMode === 'edit' && selectedArticle?.attachments && selectedArticle.attachments.length > 0 && (
                                    <ul className="text-sm space-y-1">
                                        {selectedArticle.attachments.filter(path => !attachmentsToRemove.includes(path)).map(path => (
                                            <li key={path} className="flex justify-between items-center p-1 bg-secondary rounded">
                                                <a href={getPublicUrl(path)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate">{path.split('-').slice(1).join('-')}</a>
                                                <button onClick={() => removeExistingAttachment(path)} className="text-xs text-danger font-bold px-2">Löschen</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {filesToUpload.length > 0 && (
                                    <ul className="text-sm space-y-1">
                                        {filesToUpload.map((file, index) => (
                                            <li key={index} className="flex justify-between items-center p-1 bg-blue-100 rounded">
                                                <span className="text-xs truncate">{file.name}</span>
                                                <button onClick={() => removeNewFile(index)} className="text-xs text-danger font-bold px-2">Entfernen</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <input type="file" multiple onChange={handleFileSelect} className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            </div>
                            <div className="flex justify-end gap-2 mt-auto pt-4"><button onClick={handleCancel} className="py-1 px-3 text-sm font-medium rounded-md bg-secondary text-text border border-border">Abbrechen</button><button onClick={handleSave} className="py-1 px-3 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-hover" disabled={isSubmitting}>{isSubmitting ? 'Speichert...' : 'Speichern'}</button></div>
                        </div>
                    ) : (
                         <div className="p-4 h-full flex flex-col justify-start items-center text-center">
                            <div className="pt-16">
                                <h3 className="font-semibold text-lg mb-2">Willkommen im Wiki</h3>
                                <p className="text-text-light">Wählen Sie links einen Artikel aus, um ihn anzuzeigen, oder erstellen Sie einen neuen Beitrag.</p>
                            </div>
                            
                            <div className="mt-8 border-t border-border w-full max-w-3xl pt-6">
                                <h4 className="font-semibold text-md mb-3">KI-Recherche für neue Artikel</h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={aiSearchQuery}
                                        onChange={e => setAiSearchQuery(e.target.value)}
                                        placeholder="Thema recherchieren (z.B. 'DIN VDE 0100-410')"
                                        className={commonInputClasses}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                                    />
                                    <button onClick={handleAiSearch} disabled={isAiSearching} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-50 flex-shrink-0">
                                        {isAiSearching ? 'Sucht...' : 'Suchen'}
                                    </button>
                                </div>

                                {isAiSearching && <div className="mt-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div><p className="text-text-light text-sm mt-2">KI recherchiert im Web...</p></div>}
                                {aiSearchError && <p className="mt-4 text-danger p-2 bg-red-50 rounded">{aiSearchError}</p>}
                                
                                {aiSearchResult && (
                                    <div className="mt-6 text-left bg-secondary p-4 rounded-lg border border-border" style={{ animation: 'fade-in 0.5s ease-out forwards' }}>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-lg mb-2">{aiSearchResult.title}</h4>
                                            <button onClick={handleSaveAiResultAsArticle} className="py-1 px-3 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-hover flex-shrink-0">
                                                Als Artikel speichern
                                            </button>
                                        </div>

                                        <div className="prose prose-sm max-w-none mt-2 p-3 bg-white rounded border max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: aiSearchResult.content }} />
                                        
                                        {aiSearchResult.sources.length > 0 && (
                                            <div className="mt-4">
                                                <h5 className="font-semibold text-xs uppercase text-text-light">Quellen</h5>
                                                <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                                                    {aiSearchResult.sources.map((source, index) => (
                                                        <li key={index} className="truncate">
                                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" title={source.uri}>{source.title}</a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <style>{`
                                @keyframes fade-in {
                                    from { opacity: 0; transform: translateY(10px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Wiki;