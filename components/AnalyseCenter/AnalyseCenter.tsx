import React, { FC, useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { ChartDefinition } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { useCharts, useChartMutations } from '../../hooks/useCharts';
import ChartEditor from './ChartEditor';
import './AnalyseCenter.css';

const AnalyseCenter: FC = () => {
    const { currentUser } = useAppContext();
    const { data: charts = [], isLoading } = useCharts();
    const { createChartMutation, updateChartMutation, deleteChartMutation } = useChartMutations();

    const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

    const handleCreateChart = () => {
        if (!currentUser) return;
        const newChart: Omit<ChartDefinition, 'id' | 'created_at'> = {
            name: 'Neues Diagramm',
            type: 'bar',
            owner_id: currentUser.id,
            dataSource: 'Kategorie,Wert1,Wert2\nA,10,15\nB,20,25\nC,30,35',
            config: {
                title: 'Neues Diagramm',
                xAxis: {
                    type: 'category',
                    sourceColumn: 'Kategorie',
                },
                yAxis: {
                    type: 'value',
                },
                series: [
                    { type: 'bar', sourceColumn: 'Wert1' },
                    { type: 'bar', sourceColumn: 'Wert2' },
                ],
            },
        };

        createChartMutation.mutate(newChart, {
            onSuccess: (createdChart) => {
                setSelectedChartId(createdChart.id);
            },
        });
    };

    const handleDeleteChart = (chartId: string) => {
        if (window.confirm("Möchten Sie dieses Diagramm wirklich löschen?")) {
            deleteChartMutation.mutate(chartId, {
                onSuccess: () => {
                    if (selectedChartId === chartId) {
                        setSelectedChartId(null);
                    }
                }
            });
        }
    };
    
    const selectedChart = useMemo(() => charts.find(c => c.id === selectedChartId), [charts, selectedChartId]);

    if (isLoading) {
        return <div className="p-8 text-center">Lade Diagramme...</div>;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <h2 className="text-2xl font-semibold text-text">Analyse-Center</h2>
                <p className="text-text-light mb-4">Erstellen und verwalten Sie benutzerdefinierte Diagramme.</p>
            </div>
            <div className="flex-grow min-h-0 flex gap-6">
                <aside className="w-64 flex-shrink-0 bg-card border border-border rounded-lg flex flex-col">
                    <div className="p-3 border-b border-border">
                        <button onClick={handleCreateChart} disabled={createChartMutation.isPending} className="w-full py-2 px-4 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-50 text-sm">
                            + Neues Diagramm
                        </button>
                    </div>
                    <nav className="flex-1 p-2 overflow-y-auto">
                        {charts.map(chart => (
                            <button 
                                key={chart.id}
                                onClick={() => setSelectedChartId(chart.id)}
                                className={`w-full text-left p-2 rounded text-sm truncate ${selectedChartId === chart.id ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'}`}
                            >
                                {chart.name}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 min-h-0">
                    {selectedChart ? (
                        <ChartEditor 
                            key={selectedChart.id} // Re-mount when chart changes
                            chart={selectedChart}
                            onSave={updateChartMutation.mutate}
                            onDelete={handleDeleteChart}
                        />
                    ) : (
                        <div className="h-full flex justify-center items-center bg-card border border-border rounded-lg">
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">Willkommen im Analyse-Center</h3>
                                <p className="text-text-light mt-1">Wählen Sie ein Diagramm aus oder erstellen Sie ein Neues, um zu beginnen.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AnalyseCenter;