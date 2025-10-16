import React, { FC, useState, useMemo } from 'react';
import { KOSTENGRUPPEN_DATA } from '../../constants';

interface LeistungenSelectorProps {
    selectedSystems: string[];
    onUpdateSystems: (systems: string[]) => void;
}

const allItems = KOSTENGRUPPEN_DATA.flatMap(group => 
    group.items.flatMap(subgroup => 
        subgroup.items.map(item => ({...item, groupTitle: group.title, subgroupTitle: subgroup.title }))
    )
);

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

const LeistungenSelector: FC<LeistungenSelectorProps> = ({ selectedSystems, onUpdateSystems }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) {
            return KOSTENGRUPPEN_DATA;
        }
        const lowerSearch = searchTerm.toLowerCase();
        
        return KOSTENGRUPPEN_DATA.map(group => {
            const matchingSubgroups = group.items.map(subgroup => {
                const matchingItems = subgroup.items.filter(item => 
                    item.title.toLowerCase().includes(lowerSearch) || 
                    item.id.includes(lowerSearch)
                );
                return matchingItems.length > 0 ? { ...subgroup, items: matchingItems } : null;
            }).filter(Boolean);

            return matchingSubgroups.length > 0 ? { ...group, items: matchingSubgroups as any } : null;
        }).filter(Boolean) as typeof KOSTENGRUPPEN_DATA;

    }, [searchTerm]);

    const handleToggleSystem = (systemId: string) => {
        const newSelection = new Set(selectedSystems);
        if (newSelection.has(systemId)) {
            newSelection.delete(systemId);
        } else {
            newSelection.add(systemId);
        }
        onUpdateSystems(Array.from(newSelection));
    };

    const selectedSystemPills = useMemo(() => {
        return selectedSystems.map(id => {
            const item = allItems.find(i => i.id === id);
            return {
                id,
                title: item?.title || id,
                subgroupTitle: item?.subgroupTitle || '',
            };
        });
    }, [selectedSystems]);

    return (
        <section>
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h3 className="text-lg font-semibold">Leistungen & Systeme</h3>
                 <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
            {selectedSystemPills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSystemPills.map(pill => (
                         <span
                            key={pill.id}
                            className="text-white px-3 py-1.5 rounded-full text-sm font-medium"
                            style={{ backgroundColor: stringToColor(pill.id), filter: 'brightness(1.2)' }}
                            title={`KG ${pill.id} (${pill.subgroupTitle})`}
                        >
                            {pill.title}
                        </span>
                    ))}
                </div>
            )}
            {isOpen && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-border">
                    <input
                        type="text"
                        placeholder="Kostengruppe oder Bezeichnung suchen..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 mb-4 border rounded"
                    />
                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {filteredData.map(group => (
                            <div key={group.id}>
                                <h4 className="font-bold text-sm text-text-light">{group.title}</h4>
                                <div className="pl-4 space-y-1">
                                    {group.items.map(subgroup => (
                                        <div key={subgroup.id}>
                                            <h5 className="font-semibold text-sm">{subgroup.title}</h5>
                                            <div className="pl-4">
                                                {subgroup.items.map(item => (
                                                    <div key={item.id} className="flex items-center gap-2 py-1">
                                                        <input
                                                            type="checkbox"
                                                            id={`system-${item.id}`}
                                                            checked={selectedSystems.includes(item.id)}
                                                            onChange={() => handleToggleSystem(item.id)}
                                                            className="h-4 w-4 rounded accent-primary"
                                                        />
                                                        <label htmlFor={`system-${item.id}`} className="text-sm cursor-pointer">{item.id} - {item.title}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default LeistungenSelector;