import React, { FC, useState, useEffect, useRef, useCallback } from 'react';
import { DocumentFile } from '../../types';
import { supabase } from '../../supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const STORAGE_BUCKET = 'project_files';

type Annotation = {
    type: 'path';
    color: string;
    width: number;
    points: { x: number; y: number }[];
};

interface PdfAnnotatorModalProps {
    file: DocumentFile;
    onClose: () => void;
    onSave: (originalFile: DocumentFile, annotationData: string) => void;
}

const PdfAnnotatorModal: FC<PdfAnnotatorModalProps> = ({ file, onClose, onSave }) => {
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
    const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [annotations, setAnnotations] = useState<Annotation[]>(() => {
        try {
            return JSON.parse(file.annotationsData || '[]');
        } catch {
            return [];
        }
    });
    const [isDrawing, setIsDrawing] = useState(false);

    const renderPage = useCallback(async (num: number) => {
        if (!pdfDoc) return;
        try {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = pdfCanvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const annotationCanvas = annotationCanvasRef.current;
            if (annotationCanvas) {
                annotationCanvas.height = viewport.height;
                annotationCanvas.width = viewport.width;
            }

            const renderContext = { canvasContext: context, viewport: viewport };
            await page.render(renderContext).promise;
        } catch (e) {
            console.error("Error rendering page", e);
            setError("Fehler beim Rendern der PDF-Seite.");
        }
    }, [pdfDoc]);

    const redrawAnnotations = useCallback(() => {
        const canvas = annotationCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        annotations.forEach(annotation => {
            if (annotation.type === 'path' && annotation.points.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = annotation.color;
                ctx.lineWidth = annotation.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
                for (let i = 1; i < annotation.points.length; i++) {
                    ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
                }
                ctx.stroke();
            }
        });
    }, [annotations]);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                const { data, error: urlError } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(file.path, 3600);
                if (urlError) throw urlError;

                const loadingTask = pdfjsLib.getDocument(data.signedUrl);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setNumPages(pdf.numPages);
                setIsLoading(false);
            } catch (err: any) {
                console.error("PDF loading error:", err);
                setError('PDF konnte nicht geladen werden. Möglicherweise ist die Datei beschädigt oder die URL ist ungültig.');
                setIsLoading(false);
            }
        };
        loadPdf();
    }, [file.path]);
    
    useEffect(() => {
        if (pdfDoc) {
            renderPage(pageNum);
        }
    }, [pdfDoc, pageNum, renderPage]);

    useEffect(() => {
        if (!isLoading) {
             redrawAnnotations();
        }
    }, [annotations, redrawAnnotations, isLoading]);


    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        const newAnnotation: Annotation = { type: 'path', color: 'red', width: 2, points: [{ x: offsetX, y: offsetY }] };
        setAnnotations(prev => [...prev, newAnnotation]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        setAnnotations(prev => {
            if (prev.length === 0) return [];
            const lastAnnotation = prev[prev.length - 1];
            const updatedAnnotation = { ...lastAnnotation, points: [...lastAnnotation.points, { x: offsetX, y: offsetY }] };
            const newAnnotations = [...prev.slice(0, -1), updatedAnnotation];
            return newAnnotations;
        });
    };

    const handleMouseUp = () => setIsDrawing(false);
    const handleMouseLeave = () => setIsDrawing(false);

    const goToPrevPage = () => setPageNum(p => Math.max(1, p - 1));
    const goToNextPage = () => setPageNum(p => Math.min(numPages, p + 1));

    const handleSave = () => {
        onSave(file, JSON.stringify(annotations));
        onClose();
    };


    return (
        <div className="pdf-annotator-modal" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h3 className="truncate">{file.name}</h3>
                    <div className="pagination">
                        <button onClick={goToPrevPage} disabled={pageNum <= 1}>‹</button>
                        <span>Seite {pageNum} / {numPages || '?'}</span>
                        <button onClick={goToNextPage} disabled={pageNum >= (numPages || 1)}>›</button>
                    </div>
                    <div className="actions">
                        <button onClick={handleSave} className="btn-primary">Als neue Version speichern</button>
                        <button onClick={onClose} className="close-btn">&times;</button>
                    </div>
                </header>
                <main className="modal-body">
                    <aside className="toolbar">
                        <button className="tool-btn active" title="Stift"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" /></svg></button>
                        <button className="tool-btn" title="Text (demnächst)" disabled><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 006.466 0l.813-2.846A.75.75 0 0118.75 4.5h-9zm-3.375 9a.75.75 0 01.75-.75h12.75a.75.75 0 010 1.5H6.375a.75.75 0 01-.75-.75zM9 19.5a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg></button>
                    </aside>
                    <div className="viewer-container">
                        {isLoading && <div className="loading-spinner"></div>}
                        {error && <p className="error-message">{error}</p>}
                        <div className="canvas-wrapper">
                            <canvas ref={pdfCanvasRef}></canvas>
                            <canvas 
                                ref={annotationCanvasRef}
                                className="annotation-canvas"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                            ></canvas>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PdfAnnotatorModal;