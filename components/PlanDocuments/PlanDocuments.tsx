
import React, { FC, useState, DragEvent, ChangeEvent, useMemo, useCallback } from 'react';
import { Project, DocumentFile } from '../../types';
import { supabase } from '../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import PdfAnnotatorModal from './PdfAnnotatorModal';
import EditPlanMetadataModal from './EditPlanMetadataModal';
import { useAppContext } from '../../contexts/AppContext';

const STORAGE_BUCKET = 'project_files';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const PlanDocuments: FC<{project: Project, onUpdateProject: (id: string, updates: Partial<Project>) => void}> = ({ project, onUpdateProject }) => {
    const { currentUser } = useAppContext();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [annotatingFile, setAnnotatingFile] = useState<DocumentFile | null>(null);
    const [editingMetadataFor, setEditingMetadataFor] = useState<File | null>(null);
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        // For simplicity, we handle one file at a time to ensure metadata is captured for each.
        setEditingMetadataFor(files[0]);
    };

    const handleMetadataSave = async (metadata: Partial<DocumentFile>) => {
        if (!editingMetadataFor || !currentUser) return;

        const file = editingMetadataFor;
        setEditingMetadataFor(null);
        setIsUploading(true);

        const fileId = uuidv4();
        const parentId = fileId; // First version
        const version = 1;
        const filePath = `public/${currentUser.id}/${project.id}/plans/${parentId}_v${version}-${file.name}`;

        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);

        if (error) {
            console.error('Error uploading file:', error);
            alert(`Fehler beim Hochladen von ${file.name}: ${error.message}`);
            setIsUploading(false);
            return;
        }

        const newDoc: DocumentFile = {
            id: fileId,
            name: file.name,
            path: filePath,
            size: file.size,
            type: file.type,
            createdAt: new Date().toISOString(),
            version: version,
            parentId: parentId,
            status: 'Original',
            ...metadata
        };

        const updatedDocs = [...(project.planDocuments || []), newDoc];
        await onUpdateProject(project.id, { planDocuments: updatedDocs });
        setIsUploading(false);
    };

    const handleSaveAnnotation = async (originalFile: DocumentFile, annotationData: string) => {
        const nextVersion = Math.max(0, ...project.planDocuments.filter(d => d.parentId === originalFile.parentId).map(d => d.version)) + 1;
        
        const newDoc: DocumentFile = {
            ...originalFile,
            id: uuidv4(),
            version: nextVersion,
            status: 'Entwurf',
            annotationsData: annotationData,
            createdAt: new Date().toISOString(),
        };

        const updatedDocs = [...(project.planDocuments || []), newDoc];
        await onUpdateProject(project.id, { planDocuments: updatedDocs });
    };

    const handleDeleteFile = async (fileToDelete: DocumentFile) => {
        if (window.confirm(`Möchten Sie die Datei "${fileToDelete.name}" (Version ${fileToDelete.version}) wirklich löschen?`)) {
            // Note: In a real app, you might want to prevent deletion of original files with versions.
            const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([fileToDelete.path]);
            if (error) {
                console.error("Error deleting file:", error);
                alert(`Fehler beim Löschen der Datei: ${error.message}`);
            } else {
                const updatedDocs = (project.planDocuments || []).filter(file => file.id !== fileToDelete.id);
                await onUpdateProject(project.id, { planDocuments: updatedDocs });
            }
        }
    };
    
    const handleDragEvents = (e: DragEvent<HTMLDivElement>, isOver: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(isOver); };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => { handleDragEvents(e, false); handleFiles(e.dataTransfer.files); };

    const groupedPlans = useMemo(() => {
        const groups: Record<string, Record<string, Record<string, DocumentFile[]>>> = {};
        (project.planDocuments || []).forEach(doc => {
            const lp = doc.leistungsphase || 'Unsortiert';
            const gt = doc.gebaeudeteil || 'Allgemein';
            const gs = doc.geschoss || 'Alle Geschosse';
            if (!groups[lp]) groups[lp] = {};
            if (!groups[lp][gt]) groups[lp][gt] = {};
            if (!groups[lp][gt][gs]) groups[lp][gt][gs] = [];
            groups[lp][gt][gs].push(doc);
        });
        return groups;
    }, [project.planDocuments]);

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) newSet.delete(key);
            else newSet.add(key);
            return newSet;
        });
    };

    const renderFileTree = (docs: DocumentFile[]) => {
        const versions: Record<string, DocumentFile[]> = {};
        (docs || []).forEach(d => {
            if (!versions[d.parentId]) versions[d.parentId] = [];
            versions[d.parentId].push(d);
        });

        return Object.values(versions).map(versionList => {
            const sorted = versionList.sort((a, b) => b.version - a.version);
            const latest = sorted[0];
            const hasVersions = sorted.length > 1;

            return (
                <div key={latest.id} className="document-group">
                    <div className="document-item latest-version">
                        <span>{latest.name} (v{latest.version})</span>
                        <div className="file-actions">
                            <span className="file-status">{latest.status}</span>
                            {latest.type === 'application/pdf' && <button onClick={() => setAnnotatingFile(latest)}>Ansehen & Kommentieren</button>}
                            <button onClick={() => handleDeleteFile(latest)}>Löschen</button>
                        </div>
                    </div>
                    {hasVersions && (
                         <div className="version-history">
                            {sorted.slice(1).map(v => (
                                 <div key={v.id} className="document-item old-version">
                                    <span>Version {v.version}</span>
                                     <div className="file-actions">
                                        <span className="file-status">{v.status}</span>
                                        {v.type === 'application/pdf' && <button onClick={() => setAnnotatingFile(v)}>Ansehen</button>}
                                        <button onClick={() => handleDeleteFile(v)}>Löschen</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        });
    };


    const renderGroup = (title: string, content: React.ReactNode, level: number, groupKey: string) => {
        const isOpen = openGroups.has(groupKey);
        return (
            <div className={`plan-group-level-${level}`}>
                <button onClick={() => toggleGroup(groupKey)} className="group-header">
                    <span>{title}</span>
                    <span className={`toggle-icon ${isOpen ? 'open' : ''}`}>›</span>
                </button>
                {isOpen && <div className="group-content">{content}</div>}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {annotatingFile && <PdfAnnotatorModal file={annotatingFile} onClose={() => setAnnotatingFile(null)} onSave={handleSaveAnnotation} />}
            {editingMetadataFor && <EditPlanMetadataModal file={editingMetadataFor} onClose={() => setEditingMetadataFor(null)} onSave={handleMetadataSave} />}

            <h3 className="text-xl font-semibold pb-4 border-b border-border">Planunterlagen</h3>
            
            <div onDragOver={(e) => handleDragEvents(e, true)} onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)} onDrop={handleDrop} className={`upload-drop-zone ${isDragOver ? 'drag-over' : ''}`}>
                <input type="file" multiple id="plan-upload" className="hidden" onChange={(e) => handleFiles(e.target.files)} disabled={isUploading} />
                <label htmlFor="plan-upload" className="cursor-pointer">
                    <p className="font-semibold text-primary">Klicken zum Hochladen oder Dateien hierher ziehen.</p>
                    <p className="text-sm text-text-light mt-1">Laden Sie hier Pläne (PDF, DWG, etc.) hoch.</p>
                </label>
                {isUploading && <p className="mt-4 text-sm font-medium animate-pulse">Lade hoch...</p>}
            </div>

            <div className="plan-tree-container">
                {Object.entries(groupedPlans).map(([lp, gtGroup]) => {
                    const gtContent = Object.entries(gtGroup).map(([gt, gsGroup]) => {
                        const gsContent = Object.entries(gsGroup).map(([gs, docs]) => {
                            // FIX: Cast `docs` to `DocumentFile[]` to resolve TypeScript inference error.
                            const fileTree = renderFileTree(docs as DocumentFile[]);
                            return renderGroup(gs, fileTree, 3, `${lp}-${gt}-${gs}`);
                        });
                        return renderGroup(gt, <>{gsContent}</>, 2, `${lp}-${gt}`);
                    });
                    return renderGroup(lp, <>{gtContent}</>, 1, lp);
                })}
            </div>
        </div>
    );
};

export default PlanDocuments;
