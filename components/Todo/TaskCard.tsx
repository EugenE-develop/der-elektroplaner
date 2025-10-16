import React, { FC, DragEvent } from 'react';
import { TodoItem, TodoPriority, User } from '../../types';

interface TaskCardProps { task: TodoItem; teamMembers: User[]; onDragStart: (e: DragEvent<HTMLDivElement>, taskId: string) => void; onClick: () => void; onDelete: () => void; }

const TaskCard: FC<TaskCardProps> = ({ task, teamMembers, onDragStart, onClick, onDelete }) => {
    const assignee = teamMembers.find(u => u.id === task.assigneeId);
    const priorityClasses: Record<TodoPriority, string> = { 'Niedrig': 'border-l-slate-400', 'Mittel': 'border-l-primary', 'Hoch': 'border-l-yellow-500', 'Dringend': 'border-l-danger' };
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    // FIX: Make the card draggable and attach the onDragStart handler.
    return (
        <div className={`bg-card rounded-md p-3 border border-border shadow-sm cursor-grab hover:shadow-md hover:-translate-y-px transition-all border-l-4 relative group ${priorityClasses[task.priority]}`} draggable onDragStart={(e) => onDragStart(e, task.id)} onClick={onClick}>
            <div className="flex justify-between items-start mb-2"><span className="font-medium text-sm leading-tight pr-5">{task.title}</span><span className="text-xs font-semibold py-0.5 px-2 rounded-full bg-secondary text-text-light flex-shrink-0 ml-2">{task.priority}</span></div>
            <div className="flex justify-between items-center text-xs text-text-light"><span className="due-date">Fällig: {task.dueDate}</span><span className="font-medium py-0.5 px-1.5 bg-secondary rounded">{assignee?.name.split(' ').map(n=>n[0]).join('') || 'N/Z'}</span></div>
            <button onClick={handleDeleteClick} className="absolute top-1 right-1 w-5 h-5 bg-secondary rounded-full text-text-light flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger hover:text-white transition-all text-sm font-bold leading-none" aria-label="Aufgabe löschen">&times;</button>
        </div>
    );
};

export default TaskCard;