import React, { FC, useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { TimeEntry } from '../../types';
import TimeEntryModal from './TimeEntryModal';
import { formatNumber } from '../../utils';
import { format, addMonths, startOfMonth, startOfWeek, addDays, isSameMonth, isToday, isSameDay, isWeekend } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Zeiterfassung.css';

const Zeiterfassung: FC = () => {
    const { currentUser, projects, timeEntries, handleCreateTimeEntry, handleUpdateTimeEntry, handleDeleteTimeEntry } = useAppContext();
    
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

    const changeMonth = (offset: number) => {
        setViewDate(prev => addMonths(prev, offset));
    };
    
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = startOfMonth(viewDate);
        const calendarStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Start week on Monday
        return Array.from({ length: 42 }, (_, i) => addDays(calendarStart, i));
    }, [viewDate]);

    const entriesByDay = useMemo(() => {
        const map = new Map<string, { entries: TimeEntry[], totalHours: number }>();
        timeEntries.forEach(entry => {
            const dayKey = entry.entry_date;
            if (!map.has(dayKey)) {
                map.set(dayKey, { entries: [], totalHours: 0 });
            }
            const dayData = map.get(dayKey)!;
            dayData.entries.push(entry);
            dayData.totalHours += entry.duration_hours;
        });
        return map;
    }, [timeEntries]);
    
    const selectedDayEntries = entriesByDay.get(format(selectedDate, 'yyyy-MM-dd'))?.entries || [];
    
    const handleSaveEntry = async (entry: Omit<TimeEntry, 'id'> | TimeEntry) => {
        if('id' in entry) {
            // Update
            // await handleUpdateTimeEntry(entry);
        } else {
            // Create
            if(!currentUser) return;
            await handleCreateTimeEntry({ ...entry, user_id: currentUser.id });
        }
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    if(!currentUser) return null;

    return (
        <div className="p-4 sm:p-6 md:p-8">
            {isModalOpen && (
                <TimeEntryModal
                    entry={editingEntry}
                    selectedDate={selectedDate}
                    onClose={() => { setIsModalOpen(false); setEditingEntry(null); }}
                    onSave={handleSaveEntry}
                    projects={projects}
                />
            )}
            <h2 className="text-2xl font-semibold text-text">Zeiterfassung</h2>
            <p className="text-text-light mb-8">Erfassen Sie Ihre Projektzeiten über die Kalenderansicht.</p>

            <div className="calendar-container">
                <div className="calendar-header">
                    <button onClick={() => changeMonth(-1)} className="calendar-nav-btn" aria-label="Vorheriger Monat"><ChevronLeft /></button>
                    <h3>{format(viewDate, 'MMMM yyyy', { locale: de })}</h3>
                    <button onClick={() => changeMonth(1)} className="calendar-nav-btn" aria-label="Nächster Monat"><ChevronRight /></button>
                </div>
                <div className="calendar-grid">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => <div key={day} className="calendar-weekday">{day}</div>)}
                    {calendarDays.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayData = entriesByDay.get(dayKey);
                        const isCurrentMonth = isSameMonth(day, viewDate);
                        
                        const dayClasses = [
                            'day-cell',
                            !isCurrentMonth && 'is-other-month',
                            isToday(day) && 'is-today',
                            isSameDay(day, selectedDate) && 'is-selected',
                            isWeekend(day) && 'is-weekend',
                        ].filter(Boolean).join(' ');
                        
                        return (
                            <div key={dayKey} className={dayClasses} onClick={() => setSelectedDate(day)}>
                                <div className="day-number">{format(day, 'd')}</div>
                                {dayData && dayData.totalHours > 0 && <div className="day-hours">{formatNumber(dayData.totalHours, 1)} h</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="entry-list-container">
                <div className="entry-list-header">
                    <h4>Einträge für {format(selectedDate, 'eeee, dd. MMMM yyyy', { locale: de })}</h4>
                    <button onClick={() => { setEditingEntry(null); setIsModalOpen(true); }} className="py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover text-sm">+ Neuer Eintrag</button>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                    {selectedDayEntries.length > 0 ? (
                        <div className="divide-y divide-border -m-4">
                            {selectedDayEntries.map(entry => {
                                const project = projects.find(p => p.id === entry.project_id);
                                return (
                                <div key={entry.id} className="entry-item p-4">
                                    <div className="entry-main-info">
                                        <div className="entry-project">{project?.name || 'Unbekanntes Projekt'} <span className="entry-phase">(LP{entry.service_phase_id})</span></div>
                                        <div className="entry-hours">{formatNumber(entry.duration_hours)} h</div>
                                    </div>
                                    <p className="entry-description">{entry.description}</p>
                                </div>
                            )})}
                        </div>
                    ) : <p className="text-center text-sm text-text-light p-4">Keine Einträge für diesen Tag.</p>}
                </div>
            </div>
        </div>
    );
};

export default Zeiterfassung;