
import React, { useState, FC } from 'react';
// FIX: Changed import to be a relative path.
import { CatalogEntryData, VersionInfo } from '../../types';
import { KOSTENGRUPPEN_DATA } from '../../constants';

const AccordionItem: FC<{ title: string; id: string; children: React.ReactNode; openSections: Set<string>; onToggle: (id: string) => void; level: number; }> = ({ title, id, children, openSections, onToggle, level }) => {
    const isOpen = openSections.has(id);
    const headerClasses = level === 1 
        ? "p-4 font-semibold text-lg" 
        : "p-3 font-medium bg-slate-50";
    const contentClasses = level === 1 
        ? "px-4 pb-4" 
        : "px-4 py-2 bg-slate-50";

    return (
        <div className={`border-b border-border last:border-b-0 ${level === 2 ? 'bg-slate-50 border rounded-md mb-2' : ''}`}>
            <h3 className="m-0 p-0 font-normal text-base"> {/* Wrapper for semantics, styles are on the button */}
                <button
                    onClick={() => onToggle(id)}
                    aria-expanded={isOpen}
                    className={`w-full flex justify-between items-center text-left cursor-pointer hover:bg-secondary-hover transition-colors ${headerClasses}`}
                >
                    <span>{title}</span>
                    <span className={`text-primary text-xl transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>{isOpen ? '−' : '+'}</span>
                </button>
            </h3>
            {isOpen && <div className={contentClasses}>{children}</div>}
        </div>
    );
};


const Fragenkatalog: FC = () => {
    const [catalogData, setCatalogData] = useState<{ [key: string]: Partial<CatalogEntryData> }>({});
    const [versionInfo, setVersionInfo] = useState<VersionInfo>({ index: '', datum: '', aenderungen: '' });
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['440', '450']));
    
    const commonInputClasses = "w-full p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm";


    const handleDataChange = (id: string, field: keyof CatalogEntryData, value: string) => {
        setCatalogData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value,
            }
        }));
    };
    
    const handleVersionInfoChange = (field: keyof VersionInfo, value: string) => {
        setVersionInfo(prev => ({ ...prev, [field]: value }));
    };

    const toggleSection = (id: string) => {
        setOpenSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleReset = () => {
        if (window.confirm('Möchten Sie wirklich alle Einträge und die Standdokumentation zurücksetzen?')) {
            setCatalogData({});
            setVersionInfo({ index: '', datum: '', aenderungen: '' });
        }
    };

    const handlePrint = () => {
        const allSectionIds = new Set<string>();
        KOSTENGRUPPEN_DATA.forEach(group => {
            allSectionIds.add(group.id);
            (group.items || []).forEach(subgroup => allSectionIds.add(subgroup.id));
        });
        const originalOpenSections = openSections;
        setOpenSections(allSectionIds);

        setTimeout(() => {
            window.print();
            setOpenSections(originalOpenSections);
        }, 100);
    };

    return (
        <div className="bg-card md:rounded-lg md:shadow-lg p-4 sm:p-6 md:p-10 w-full max-w-6xl mx-auto">
            <h2 className="text-center text-2xl font-semibold text-text mb-2">Fragenkatalog & Zuständigkeiten</h2>
            <p className="text-center text-text-light mb-10">Definieren Sie die Zuständigkeiten und Festlegungen für die Gewerke der KG 440 und 450.</p>
            
            <div className="mb-10 p-6 border border-border rounded-lg bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Standdokumentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="gesamt-index" className="text-sm font-medium text-text-light">Gesamt-Index</label>
                        <input type="text" id="gesamt-index" value={versionInfo.index} onChange={e => handleVersionInfoChange('index', e.target.value)} placeholder="z.B. A" className={commonInputClasses}/>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="gesamt-datum" className="text-sm font-medium text-text-light">Datum</label>
                        <input type="date" id="gesamt-datum" value={versionInfo.datum} onChange={e => handleVersionInfoChange('datum', e.target.value)} className={commonInputClasses} />
                    </div>
                     <div className="flex flex-col gap-1 md:col-span-2">
                        <label htmlFor="gesamt-aenderungen" className="text-sm font-medium text-text-light">Änderungen in diesem Stand</label>
                        <textarea id="gesamt-aenderungen" value={versionInfo.aenderungen} onChange={e => handleVersionInfoChange('aenderungen', e.target.value)} placeholder="z.B. Position 445.1 mit Bauherr abgestimmt." rows={3} className={`${commonInputClasses} min-h-[80px]`}></textarea>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {KOSTENGRUPPEN_DATA.map(group => (
                    <AccordionItem key={group.id} title={group.title} id={group.id} openSections={openSections} onToggle={toggleSection} level={1}>
                        <div className="space-y-2">
                        {(group.items || []).map(subgroup => (
                             <AccordionItem key={subgroup.id} title={subgroup.title} id={subgroup.id} openSections={openSections} onToggle={toggleSection} level={2}>
                                <div className="divide-y divide-border">
                                {(subgroup.items || []).map(item => (
                                    <div key={item.id} className="py-4">
                                        <p className="font-medium text-text mb-3">{item.title}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor={`${item.id}-zustaendigkeit`} className="text-xs font-medium text-text-light">Zuständigkeit</label>
                                                <input
                                                    type="text"
                                                    id={`${item.id}-zustaendigkeit`}
                                                    value={catalogData[item.id]?.zustaendigkeit || ''}
                                                    onChange={e => handleDataChange(item.id, 'zustaendigkeit', e.target.value)}
                                                    placeholder="z.B. TGA-Planer"
                                                    className={commonInputClasses}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor={`${item.id}-festlegung`} className="text-xs font-medium text-text-light">Festlegung (m. Bauherr)</label>
                                                <input
                                                    type="text"
                                                    id={`${item.id}-festlegung`}
                                                    value={catalogData[item.id]?.festlegung || ''}
                                                    onChange={e => handleDataChange(item.id, 'festlegung', e.target.value)}
                                                    placeholder="z.B. Fabrikat X"
                                                    className={commonInputClasses}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </AccordionItem>
                        ))}
                        </div>
                    </AccordionItem>
                ))}
            </div>

            <div className="flex justify-center gap-4 mt-10 print:hidden">
                <button onClick={handlePrint} className="py-2 px-6 font-medium rounded-md cursor-pointer transition-all bg-primary text-white hover:enabled:bg-primary-hover hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg">Drucken / PDF</button>
                <button onClick={handleReset} className="py-2 px-6 font-medium rounded-md cursor-pointer transition-all bg-secondary text-text border border-border hover:enabled:bg-secondary-hover">Zurücksetzen</button>
            </div>
        </div>
    );
};

export default Fragenkatalog;
