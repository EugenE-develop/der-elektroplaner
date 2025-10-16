
import React, { FC, useState, DragEvent, ChangeEvent } from 'react';
import { Project, DocumentFile } from '../../../types';
import { supabase } from '../../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import FileViewerModal from '../../FileViewerModal/FileViewerModal';
import { useAppContext } from '../../../contexts/AppContext';

const STORAGE_BUCKET = 'project_files';

interface ProjectAttachmentsProps {
    project: Project;
    onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileIcon: FC<{ type: string }> = ({ type }) => {
    if (type.startsWith('image/')) return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    if (type === 'application/pdf') return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0011.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}

const ProjectAttachments: FC<ProjectAttachmentsProps> = ({ project, onUpdateProject }) => {
    const { currentUser } = useAppContext();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [viewingFile, setViewingFile] = useState<DocumentFile | null>(null);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !currentUser) return;
        setIsUploading(true);

        const newAttachments: DocumentFile[] = [];

        for (const file of Array.from(files)) {
            const fileId = uuidv4();
            const filePath = `public/${currentUser.id}/${project.id}/attachments/${fileId}-${file.name}`;
            
            const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);

            if (error) {
                console.error('Error uploading file:', error);
                alert(`Fehler beim Hochladen von ${file.name}: ${error.message}`);
                continue; // Continue with next file
            }

            // FIX: Add missing 'version', 'parentId', and 'status' properties to satisfy the DocumentFile type.
            newAttachments.push({
                id: fileId,
                name: file.name,
                path: filePath,
                size: file.size,
                type: file.type,
                createdAt: new Date().toISOString(),
                version: 1,
                parentId: fileId,
                status: 'Original',
            });
        }
        
        if(newAttachments.length > 0) {
            const updatedAttachments = [...(project.generalAttachments || []), ...newAttachments];
            await onUpdateProject(project.id, { generalAttachments: updatedAttachments });
        }

        setIsUploading(false);
    };

    const handleDeleteFile = async (fileToDelete: DocumentFile) => {
        if (window.confirm(`Möchten Sie die Datei "${fileToDelete.name}" wirklich löschen?`)) {
            const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([fileToDelete.path]);
            if (error) {
                console.error("Error deleting file:", error);
                alert(`Fehler beim Löschen der Datei: ${error.message}`);
            } else {
                const updatedAttachments = (project.generalAttachments || []).filter(file => file.id !== fileToDelete.id);
                await onUpdateProject(project.id, { generalAttachments: updatedAttachments });
            }
        }
    };
    
    const handleDragEvents = (e: DragEvent<HTMLDivElement>, isOver: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(isOver);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false);
        handleFileUpload(e.dataTransfer.files);
    };

    return (
        <div className="space-y-6">
            {viewingFile && <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} storageBucket={STORAGE_BUCKET} />}
            <h3 className="text-xl font-semibold pb-4 border-b border-border">Projekt-Anhänge</h3>
            
            <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDragEnter={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                onDrop={handleDrop}
            >
                <input type="file" multiple id="file-upload" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileUpload(e.target.files)} disabled={isUploading} />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="font-semibold text-primary">Klicken zum Hochladen oder Dateien hierher ziehen.</p>
                    <p className="text-sm text-text-light mt-1">Laden Sie hier allgemeine Dokumente, Bilder oder Pläne hoch.</p>
                </label>
                {isUploading && <p className="mt-4 text-sm font-medium animate-pulse">Lade hoch...</p>}
            </div>

            <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                <h4 className="font-semibold mb-4">Hochgeladene Dateien</h4>
                {(project.generalAttachments || []).length > 0 ? (
                    <ul className="divide-y divide-border">
                        {(project.generalAttachments || []).map(file => (
                            <li key={file.id} className="flex items-center justify-between py-3 hover:bg-secondary -mx-4 px-4 rounded-md group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileIcon type={file.type} />
                                    <div className="min-w-0">
                                        <button onClick={() => setViewingFile(file)} className="font-medium text-sm truncate text-left hover:text-primary hover:underline">{file.name}</button>
                                        <p className="text-xs text-text-light">{formatBytes(file.size)} - {new Date(file.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteFile(file)} className="text-danger text-xs font-medium opacity-0 group-hover:opacity-100 hover:underline">Löschen</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-sm text-text-light py-8">Noch keine Anhänge für dieses Projekt vorhanden.</p>
                )}
            </div>
        </div>
    );
};

export default ProjectAttachments;
