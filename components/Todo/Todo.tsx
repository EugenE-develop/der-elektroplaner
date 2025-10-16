import React, { useState, FC, DragEvent } from 'react';
// FIX: Changed import to be a relative path.
import { Project, TodoState, TodoItem, User, TodoPriority } from '../../types';
import TaskModal from './TaskModal';
import TaskCard from './TaskCard';

interface TodoProps { 
    project: Project; 
    teamMembers: User[]; 
    onUpdateTodos: (updateFunction: (currentTodos: TodoState) => TodoState) => void;
}

// Define priority order for sorting
const priorityOrder: Record<TodoPriority, number> = {
    'Dringend': 4,
    'Hoch': 3,
    'Mittel': 2,
    'Niedrig': 1,
};


const Todo: FC<TodoProps> = ({ project, teamMembers, onUpdateTodos }) => {
    const todoState = project.todos;
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [modalInfo, setModalInfo] = useState<{ mode: 'create' | 'edit'; categoryId: string; task?: TodoItem; } | null>(null);
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

    // Ultimate safety check: If the entire todos object is structurally unsound, render a fallback.
    // This prevents crashes if `project.todos` is null, not an object, or missing critical keys.
    if (!todoState || typeof todoState.tasks !== 'object' || typeof todoState.categories !== 'object' || !Array.isArray(todoState.categoryOrder)) {
        return (
             <div>
                <h3 className="text-xl font-semibold pb-4 border-b border-border mb-4">Aufgabenplaner (ToDo)</h3>
                <div className="p-4 bg-red-50 border border-danger rounded-md text-danger">
                    <p className="font-bold">Datenfehler</p>
                    <p className="text-sm">Die Daten für das Aufgaben-Board sind beschädigt und können nicht angezeigt werden. Bitte überprüfen Sie die `todos` JSON-Daten für dieses Projekt in der Datenbank.</p>
                </div>
            </div>
        );
    }

    // FIX: Implement drag and drop handlers.
    const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        setDraggedItemId(taskId);
    };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetCategoryId: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        setDraggedItemId(null);
        
        onUpdateTodos(currentTodoState => {
            let sourceCategoryId: string | null = null;
            for (const catId in currentTodoState.categories) {
                if (currentTodoState.categories[catId].taskIds.includes(taskId)) {
                    sourceCategoryId = catId;
                    break;
                }
            }
            if (!sourceCategoryId || sourceCategoryId === targetCategoryId) {
                return currentTodoState;
            }
            
            const sourceCategory = currentTodoState.categories[sourceCategoryId];
            const targetCategory = currentTodoState.categories[targetCategoryId];

            return {
                ...currentTodoState,
                categories: {
                    ...currentTodoState.categories,
                    [sourceCategoryId]: {
                        ...sourceCategory,
                        taskIds: sourceCategory.taskIds.filter(id => id !== taskId)
                    },
                    [targetCategoryId]: {
                        ...targetCategory,
                        taskIds: [...targetCategory.taskIds, taskId]
                    }
                }
            };
        });
    };
    
    const handleSaveTask = (taskData: TodoItem) => {
        if (!modalInfo) return;
        onUpdateTodos(currentTodoState => {
            if (modalInfo.mode === 'create') {
                const newTaskId = `task-${Date.now()}`;
                const newTask = { ...taskData, id: newTaskId };
                const targetCategory = currentTodoState.categories[modalInfo.categoryId];
                return {
                    ...currentTodoState,
                    tasks: {
                        ...currentTodoState.tasks,
                        [newTaskId]: newTask
                    },
                    categories: {
                        ...currentTodoState.categories,
                        [modalInfo.categoryId]: {
                            ...targetCategory,
                            taskIds: [...targetCategory.taskIds, newTaskId]
                        }
                    }
                };
            } else { // edit mode
                return {
                    ...currentTodoState,
                    tasks: {
                        ...currentTodoState.tasks,
                        [taskData.id]: taskData
                    }
                };
            }
        });
        setModalInfo(null);
    };
    
    const handleDeleteTask = (taskIdToDelete: string) => {
        if (!window.confirm("Möchten Sie diese Aufgabe wirklich löschen?")) return;

        onUpdateTodos(currentTodoState => {
            const { [taskIdToDelete]: _, ...remainingTasks } = currentTodoState.tasks;
            const newCategories = { ...currentTodoState.categories };
            for (const catId in newCategories) {
                newCategories[catId] = {
                    ...newCategories[catId],
                    taskIds: newCategories[catId].taskIds.filter(id => id !== taskIdToDelete)
                };
            }
            return {
                ...currentTodoState,
                tasks: remainingTasks,
                categories: newCategories
            };
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
                <h3 className="text-xl font-semibold">Aufgabenplaner (ToDo)</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="assignee-filter" className="text-sm font-medium text-text-light">Filter:</label>
                    <select
                        id="assignee-filter"
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="p-2 border border-border rounded-md text-sm bg-white"
                    >
                        <option value="all">Alle Bearbeiter</option>
                        {teamMembers.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
                {todoState.categoryOrder.map(catId => {
                    const category = todoState.categories[catId];
                    
                    // Definitive safety check for each category. If malformed, render a fallback for this column.
                    if (!category || typeof category.title !== 'string' || !Array.isArray(category.taskIds)) {
                        return (
                            <div key={catId} className="bg-red-50 rounded-lg p-3 flex flex-col min-w-[300px] border border-danger text-danger">
                                <h4 className="font-semibold p-2 mb-4">Fehlerhafte Spalte</h4>
                                <p className="text-xs p-2">Die Daten für diese Spalte (ID: {catId}) sind beschädigt.</p>
                            </div>
                        );
                    }
                    
                    const allTasksInCategory = category.taskIds
                        .map(taskId => todoState.tasks[taskId])
                        .filter((task): task is TodoItem => !!(task && task.id && typeof task.title === 'string'));
                    
                    const filteredAndSortedTasks = allTasksInCategory
                        .filter(task => assigneeFilter === 'all' || task.assigneeId === assigneeFilter)
                        .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
                    
                    const countDisplay = assigneeFilter === 'all' 
                        ? `(${allTasksInCategory.length})` 
                        : `(${filteredAndSortedTasks.length} / ${allTasksInCategory.length})`;

                    // FIX: Add drop handlers to the column div.
                    return (
                        <div key={category.id} className="bg-secondary rounded-lg p-3 flex flex-col min-w-[300px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, category.id)}>
                            <h4 className="font-semibold p-2 mb-4">{category.title} {countDisplay}</h4>
                            {/* FIX: Pass onDragStart to TaskCard and add a drop placeholder. */}
                            <div className="task-list space-y-3 flex-grow min-h-[100px]">{filteredAndSortedTasks.map(task => (<TaskCard key={task.id} task={task} teamMembers={teamMembers} onDragStart={handleDragStart} onClick={() => setModalInfo({ mode: 'edit', categoryId: catId, task })} onDelete={() => handleDeleteTask(task.id)} />))} {draggedItemId && <div className="h-12 bg-primary/10 border-2 border-dashed border-primary rounded-md"></div>}</div>
                            <button className="w-full mt-auto pt-2 text-sm text-text-light p-2 rounded hover:bg-secondary-hover" onClick={() => setModalInfo({ mode: 'create', categoryId: catId })}>+ Aufgabe hinzufügen</button>
                        </div>
                    );
                })}
            </div>
             {modalInfo && (
                <TaskModal
                    key={modalInfo.task?.id || 'new'}
                    task={modalInfo.mode === 'edit' ? modalInfo.task : undefined}
                    categoryTitle={todoState.categories[modalInfo.categoryId]?.title || 'Unbekannt'}
                    onClose={() => setModalInfo(null)}
                    onSave={handleSaveTask}
                    teamMembers={teamMembers}
                />
            )}
        </div>
    );
};

export default Todo;