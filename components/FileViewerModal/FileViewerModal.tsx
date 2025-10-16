import React, { FC, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface FileViewerModalProps {
    file: { name: string; path: string; type: string };
    onClose: () => void;
    storageBucket: string;
}

const FileViewerModal: FC<FileViewerModalProps> = ({ file, onClose, storageBucket }) => {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Use signed URLs for secure, temporary access to files in private buckets.
        const getSignedUrl = async () => {
            setIsLoading(true);
            setError('');
            // The URL is valid for 10 minutes for viewing.
            const { data, error } = await supabase.storage
                .from(storageBucket)
                .createSignedUrl(file.path, 600); 

            if (error) {
                console.error('Error creating signed URL:', error);
                setError('Datei-URL konnte nicht sicher geladen werden. Prüfen Sie die Berechtigungen des Buckets und die RLS-Richtlinien.');
            } else {
                setFileUrl(data.signedUrl);
            }
            setIsLoading(false);
        };
        
        if (file.path) {
            getSignedUrl();
        } else {
             setError('Kein Dateipfad angegeben.');
             setIsLoading(false);
        }
    }, [file.path, storageBucket]);

    const handleDownload = async () => {
        const { data, error } = await supabase.storage
            .from(storageBucket)
            .createSignedUrl(file.path, 60, {
                download: file.name, // This option sets the Content-Disposition header to trigger a download.
            });

        if (error) {
            console.error('Error creating download URL:', error);
            setError('Download-Link konnte nicht erstellt werden.');
        } else {
            // Opening the URL in a new tab is safer and more user-friendly than changing window.location.href
            window.open(data.signedUrl, '_blank');
        }
    };

    const canBePreviewed = file.type.startsWith('image/') || file.type === 'application/pdf';

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-semibold text-lg truncate pr-4" title={file.name}>{file.name}</h3>
                    <div className="flex items-center gap-4">
                        <button onClick={handleDownload} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover text-sm">
                            Herunterladen
                        </button>
                        <button onClick={onClose} className="text-2xl text-text-light hover:text-text">&times;</button>
                    </div>
                </header>
                <main className="flex-grow p-4 overflow-auto flex justify-center items-center bg-secondary">
                    {isLoading && <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>}
                    {error && <p className="text-danger p-4 bg-red-100 rounded">{error}</p>}
                    {fileUrl && (
                        canBePreviewed ? (
                            file.type.startsWith('image/') ? (
                                <img src={fileUrl} alt={file.name} className="max-w-full max-h-full object-contain shadow-lg" />
                            ) : (
                                <iframe src={fileUrl} title={file.name} className="w-full h-full border-0 shadow-lg" />
                            )
                        ) : (
                            <div className="text-center">
                                <p className="text-lg text-text-light">Für diesen Dateityp ({file.type}) ist keine Vorschau verfügbar.</p>
                                <p className="mt-2 text-sm">Sie können die Datei herunterladen, um sie anzusehen.</p>
                            </div>
                        )
                    )}
                </main>
            </div>
        </div>
    );
};

export default FileViewerModal;