import React, { FC, useState } from 'react';
import { Project, Memo, MemoFolder } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';

const MemosComponent: FC<{project: Project; onUpdate: (id: string, updates: Partial<Project>) => void;}> = ({ project, onUpdate }) => {
    const { currentUser } = useAppContext();
    const [newMemoContent, setNewMemoContent] = useState('');
    const [newMemoType, setNewMemoType] = useState<'general' | 'architect'>('general');
    
    if (!currentUser) return null;

    const handleSaveMemo = () => {
        if (!newMemoContent.trim()) return;

        const newMemo: Omit<Memo, 'id'> = {
            content: newMemoContent.trim(),
            type: newMemoType,
            author: currentUser.name,
            date: new Date().toISOString(),
        };

        const updatedMemosFolders: MemoFolder[] = JSON.parse(JSON.stringify(project.memos || []));
        
        // For simplicity, we use one folder. If none exists, create it.
        if (updatedMemosFolders.length === 0) {
            updatedMemosFolders.push({ id: 'default', name: 'Allgemein', memos: [], files: [] });
        }
        
        // Add the new memo with a unique ID
        const targetFolder = updatedMemosFolders[0];
        targetFolder.memos.push({ ...newMemo, id: Date.now() });

        onUpdate(project.id, { memos: updatedMemosFolders });
        
        // Reset form
        setNewMemoContent('');
        setNewMemoType('general');
    };

    const allMemos = (project.memos || []).flatMap(folder => folder.memos);
    const generalMemos = allMemos.filter(m => m.type === 'general').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const architectMemos = allMemos.filter(m => m.type === 'architect').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold pb-4 border-b border-border">Aktennotizen</h3>

            <div className="bg-card p-4 rounded-lg shadow-sm border border-border space-y-3">
                <h4 className="font-semibold">Neue Aktennotiz erstellen</h4>
                <textarea 
                    value={newMemoContent}
                    onChange={(e) => setNewMemoContent(e.target.value)}
                    placeholder="Inhalt der Notiz..."
                    rows={4}
                    className="w-full p-2 border rounded-md"
                />
                <div className="flex justify-between items-center">
                    <select value={newMemoType} onChange={(e) => setNewMemoType(e.target.value as 'general' | 'architect')} className="p-2 border rounded-md text-sm">
                        <option value="general">Allgemeine Notiz</option>
                        <option value="architect">Architekten-Notiz</option>
                    </select>
                    <button onClick={handleSaveMemo} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Speichern</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="font-semibold">Allgemeine Notizen</h4>
                    {generalMemos.length > 0 ? (
                        generalMemos.map(memo => (
                            <div key={memo.id} className="bg-card p-3 rounded-md border">
                                <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
                                <p className="text-xs text-text-light mt-2 text-right">
                                    - {memo.author}, {new Date(memo.date).toLocaleString('de-DE')}
                                </p>
                            </div>
                        ))
                    ) : <p className="text-sm text-text-light text-center p-4 bg-secondary rounded-md">Keine allgemeinen Notizen vorhanden.</p>}
                </div>
                <div className="space-y-3">
                    <h4 className="font-semibold">Architekten-Notizen</h4>
                    {architectMemos.length > 0 ? (
                        architectMemos.map(memo => (
                            <div key={memo.id} className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
                                <p className="text-xs text-yellow-800/70 mt-2 text-right">
                                    - {memo.author}, {new Date(memo.date).toLocaleString('de-DE')}
                                </p>
                            </div>
                        ))
                    ) : <p className="text-sm text-text-light text-center p-4 bg-secondary rounded-md">Keine Architekten-Notizen vorhanden.</p>}
                </div>
            </div>
        </div>
    );
};

export default MemosComponent;