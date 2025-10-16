import React, { FC, useState, useEffect } from 'react';
import { ChecklistTemplate } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useChecklistTemplateMutations } from '../../hooks/useChecklistTemplateMutations';
import { initialLeistungsphasen } from '../../constants';
import { v4 as uuidv4 } from 'uuid';

const ChecklistTemplateEditor: FC = () => {
    const { checklistTemplates } = useAppContext();
    const { createTemplateMutation, updateTemplateMutation, deleteTemplateMutation } = useChecklistTemplateMutations();
    
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [editedTemplate, setEditedTemplate] = useState<ChecklistTemplate | null>(null);
    const [newItemText, setNewItemText] = useState<string>('');
    const [newTemplateName, setNewTemplateName] = useState<string>('');

    useEffect(() => {
        if (selectedId) {
            const found = checklistTemplates.find(t => t.id === selectedId);
            setEditedTemplate(found ? { ...found } : null); // Create a mutable copy
        } else {
            setEditedTemplate(null);
        }
    }, [selectedId, checklistTemplates]);

    const handleCreateTemplate = () => {
        if (!newTemplateName.trim()) return;
        createTemplateMutation.mutate({
            name: newTemplateName.trim(),
            items: [],
        }, {
            onSuccess: (data) => {
                setNewTemplateName('');
                setSelectedId(data.id);
            }
        });
    };
    
    const handleSaveChanges = () => {
        if (editedTemplate) {
            updateTemplateMutation.mutate(editedTemplate);
        }
    };
    
    const handleDeleteTemplate = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm("Möchten Sie diese Vorlage wirklich löschen?")) {
            deleteTemplateMutation.mutate(id, {
                onSuccess: () => {
                    if (selectedId === id) {
                        setSelectedId(null);
                    }
                }
            });
        }
    };

    const handleItemChange = (itemId: string, newText: string) => {
        if (editedTemplate) {
            const newItems = editedTemplate.items.map(item => 
                item.id === itemId ? { ...item, text: newText } : item
            );
            setEditedTemplate({ ...editedTemplate, items: newItems });
        }
    };
    
    const handleAddItem = () => {
        if (editedTemplate && newItemText.trim()) {
            const newItems = [...editedTemplate.items, { id: uuidv4(), text: newItemText.trim() }];
            setEditedTemplate({ ...editedTemplate, items: newItems });
            setNewItemText('');
        }
    };

    const handleRemoveItem = (itemId: string) => {
        if (editedTemplate) {
            const newItems = editedTemplate.items.filter((item) => item.id !== itemId);
            setEditedTemplate({ ...editedTemplate, items: newItems });
        }
    };
    
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition text-sm";
    const isMutating = createTemplateMutation.isPending || updateTemplateMutation.isPending || deleteTemplateMutation.isPending;

    return (
        <div className="stammdaten-editor">
            <h3 className="text-lg font-semibold mb-4">Checklisten-Vorlagen</h3>
            <div className="checklist-editor-layout">
                <div className="checklist-editor-list">
                    <div className="flex gap-2">
                        <input 
                            value={newTemplateName} 
                            onChange={e => setNewTemplateName(e.target.value)} 
                            placeholder="Name für neue Vorlage" 
                            className={`${commonInputClasses} flex-grow`}
                        />
                        <button onClick={handleCreateTemplate} disabled={!newTemplateName.trim() || isMutating} className="py-2 px-3 font-medium rounded-md bg-secondary border disabled:opacity-50 text-sm">Erstellen</button>
                    </div>
                    <div className="checklist-editor-list-items space-y-1 pr-2">
                        {checklistTemplates.map(template => (
                            <button key={template.id} onClick={() => setSelectedId(template.id)} className={`checklist-list-item ${selectedId === template.id ? 'active' : ''}`}>
                                <span className="truncate">{template.name}</span>
                                <span onClick={(e) => handleDeleteTemplate(e, template.id)} className="delete-btn text-danger text-xs hover:underline">Löschen</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="checklist-editor-main">
                    {editedTemplate ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-medium text-text-light mb-1 block">Vorlagenname</label><input value={editedTemplate.name} onChange={e => setEditedTemplate({...editedTemplate, name: e.target.value})} className={commonInputClasses} /></div>
                                <div><label className="text-xs font-medium text-text-light mb-1 block">Zugeordnete Leistungsphase (optional)</label>
                                    <select value={editedTemplate.applicable_phase || ''} onChange={e => setEditedTemplate({...editedTemplate, applicable_phase: Number(e.target.value) || undefined})} className={commonInputClasses}>
                                        <option value="">Keine</option>
                                        {initialLeistungsphasen.map(lp => <option key={lp.id} value={lp.id}>{lp.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-2 mt-4">Checklistenpunkte</h4>
                                <div className="space-y-2">
                                    {editedTemplate.items.map((item) => (
                                        <div key={item.id} className="checklist-item-editor">
                                            <input value={item.text} onChange={e => handleItemChange(item.id, e.target.value)} className={commonInputClasses}/>
                                            <button onClick={() => handleRemoveItem(item.id)} className="py-2 px-2 text-danger text-sm hover:bg-red-50 rounded-md">×</button>
                                        </div>
                                    ))}
                                    <div className="checklist-item-editor pt-2 border-t">
                                        <input value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="Neuer Punkt" className={commonInputClasses} onKeyDown={e => e.key === 'Enter' && handleAddItem()} />
                                        <button onClick={handleAddItem} disabled={!newItemText.trim()} className="py-2 px-3 font-medium rounded-md bg-secondary border text-sm disabled:opacity-50">Hinzufügen</button>
                                    </div>
                                </div>
                            </div>
                             <div className="flex justify-end pt-4 mt-4 border-t">
                                <button onClick={handleSaveChanges} disabled={isMutating} className="py-2 px-6 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-50">Änderungen speichern</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-full bg-slate-50 rounded-md">
                            <p className="text-text-light">Wählen Sie eine Vorlage aus oder erstellen Sie eine neue.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistTemplateEditor;
