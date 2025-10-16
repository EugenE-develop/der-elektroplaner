import React, { useState, FC } from 'react';
import { TodoItem, TodoPriority, User } from '../../types';

const PRIORITIES: TodoPriority[] = ['Niedrig', 'Mittel', 'Hoch', 'Dringend'];

interface TaskModalProps {
    task?: TodoItem; // Task is optional for creation mode
    categoryTitle: string;
    onClose: () => void;
    onSave: (task: TodoItem) => void;
    teamMembers: User[];
}

const TaskModal: FC<TaskModalProps> = ({ task, categoryTitle, onClose, onSave, teamMembers }) => {
    const [editedTask, setEditedTask] = useState<TodoItem>(
        task || {
            id: `new-${Date.now()}`, // Temp ID for new tasks
            title: '',
            description: '',
            priority: 'Mittel',
            dueDate: new Date().toISOString().split('T')[0],
            assigneeId: null,
        }
    );
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition";
    const isNewTask = !task;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedTask(prev => ({ ...prev, [name]: name === 'assigneeId' ? (value || null) : value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedTask);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSave} className="p-8">
                    <h3 className="text-xl font-semibold mb-1">{isNewTask ? 'Neue Aufgabe erstellen' : 'Aufgabe bearbeiten'}</h3>
                    <p className="text-sm text-text-light mb-6">Status: {categoryTitle}</p>
                    <div className="space-y-4">
                        <div className="flex flex-col"><label htmlFor="title" className="text-sm font-medium text-text-light mb-1">Titel</label><input type="text" name="title" value={editedTask.title} onChange={handleChange} className={commonInputClasses} required autoFocus /></div>
                        <div className="flex flex-col"><label htmlFor="description" className="text-sm font-medium text-text-light mb-1">Beschreibung</label><textarea name="description" value={editedTask.description} onChange={handleChange} rows={4} className={commonInputClasses}></textarea></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col"><label htmlFor="priority" className="text-sm font-medium text-text-light mb-1">Priorität</label><select name="priority" value={editedTask.priority} onChange={handleChange} className={commonInputClasses}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div className="flex flex-col"><label htmlFor="dueDate" className="text-sm font-medium text-text-light mb-1">Fällig am</label><input type="date" name="dueDate" value={editedTask.dueDate} onChange={handleChange} className={commonInputClasses} required /></div>
                        </div>
                        <div className="flex flex-col"><label htmlFor="assigneeId" className="text-sm font-medium text-text-light mb-1">Zuständig</label><select name="assigneeId" value={editedTask.assigneeId ?? ''} onChange={handleChange} className={commonInputClasses}><option value="">Nicht zugewiesen</option>{teamMembers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" className="py-2 px-4 font-medium rounded-md bg-secondary text-text border border-border hover:bg-secondary-hover" onClick={onClose}>Abbrechen</button>
                        <button type="submit" className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
