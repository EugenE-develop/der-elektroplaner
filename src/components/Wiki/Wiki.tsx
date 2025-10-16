import React, { useState, FC, useMemo, useEffect, ChangeEvent } from 'react';
import { WikiArticle, WikiCategory, User } from '../../../types';
import { supabase } from '../../../supabaseClient';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
    
    const toggleCategory = (id: number) =>