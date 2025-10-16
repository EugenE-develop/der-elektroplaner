import React, { FC, useState, useEffect, useRef, useMemo } from 'react';
import { ChartDefinition, ChartType } from '../../types';

// Let TypeScript know that 'echarts' is available on the window object from the CDN script
declare var echarts: any;

const CHART_TYPES: ChartType[] = ['bar', 'line', 'pie', 'scatter', 'radar', 'heatmap', 'sankey'];

interface ChartEditorProps {
    chart: ChartDefinition;
    onSave: (updatedChart: ChartDefinition) => void;
    onDelete: (chartId: string) => void;
}

const ChartEditor: FC<ChartEditorProps> = ({ chart, onSave, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'data' | 'visual' | 'json'>('data');
    const [localChart, setLocalChart] = useState<ChartDefinition>(chart);
    const [echartsOption, setEchartsOption] = useState<any>({});
    const chartRef = useRef<HTMLDivElement>(null);

    const parsedData = useMemo(() => {
        const rows = localChart.dataSource.trim().split('\n');
        if (rows.length === 0) return { headers: [], data: [] };
        const headers = rows[0].split(',').map(h => h.trim());
        const data = rows.slice(1).map(row => row.split(',').map(cell => cell.trim()));
        return { headers, data };
    }, [localChart.dataSource]);

    // Generate ECharts option from localChart state
    useEffect(() => {
        try {
            if (localChart.config.rawJson) {
                setEchartsOption(JSON.parse(localChart.config.rawJson));
                return;
            }

            const visualConfig = localChart.config;
            const newOption: any = {
                title: { text: visualConfig.title || localChart.name, left: 'center' },
                tooltip: { trigger: 'axis' },
                legend: { top: 'bottom' },
                dataset: {
                    source: [parsedData.headers, ...parsedData.data]
                },
                xAxis: { type: visualConfig.xAxis?.type || 'category' },
                yAxis: { type: visualConfig.yAxis?.type || 'value' },
                series: (visualConfig.series || []).map((s: any) => ({ type: s.type || localChart.type }))
            };
            
            setEchartsOption(newOption);

        } catch (e) {
            console.error("Error generating chart option:", e);
        }
    }, [localChart, parsedData]);
    
    // Render ECharts instance
    useEffect(() => {
        if (chartRef.current) {
            const chartInstance = echarts.init(chartRef.current);
            chartInstance.setOption(echartsOption, true); // `true` clears previous options

            const resizeObserver = new ResizeObserver(() => {
                chartInstance.resize();
            });
            resizeObserver.observe(chartRef.current);

            return () => {
                resizeObserver.disconnect();
                chartInstance.dispose();
            };
        }
    }, [echartsOption]);

    const handleSave = () => {
        onSave(localChart);
    };

    const handleVisualConfigChange = (path: string, value: any) => {
        setLocalChart(prev => {
            const newConfig = { ...prev.config };
            // Simple path setter, e.g., "title" or "xAxis.type"
            const keys = path.split('.');
            let current = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = current[keys[i]] || {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return { ...prev, config: { ...newConfig, rawJson: undefined } }; // Clear rawJson when visual editor is used
        });
    };

    return (
        <div className="h-full flex flex-col bg-card border border-border rounded-lg shadow-sm">
            <div className="p-3 border-b border-border flex justify-between items-center">
                <input 
                    type="text"
                    value={localChart.name}
                    onChange={(e) => setLocalChart(p => ({...p, name: e.target.value}))}
                    className="font-semibold text-lg bg-transparent border-b-2 border-transparent focus:border-primary focus:outline-none"
                />
                <div className="flex gap-2">
                    <button onClick={handleSave} className="py-1 px-4 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-hover">Speichern</button>
                    <button onClick={() => onDelete(chart.id)} className="py-1 px-3 text-sm font-medium rounded-md bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white">Löschen</button>
                </div>
            </div>
            <div className="flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                <div className="flex flex-col">
                    <div className="flex-shrink-0 border-b border-border mb-2">
                        {['data', 'visual', 'json'].map(tab => (
                             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-text-light'}`}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex-grow min-h-0 overflow-y-auto">
                        {activeTab === 'data' && (
                            <textarea 
                                value={localChart.dataSource}
                                onChange={(e) => setLocalChart(p => ({...p, dataSource: e.target.value}))}
                                className="w-full h-full p-2 border rounded font-mono text-sm"
                                placeholder="Fügen Sie hier Ihre CSV-Daten ein. Z.B.:&#10;Produkt,Umsatz&#10;A,100&#10;B,150"
                            />
                        )}
                        {activeTab === 'visual' && (
                            <div className="space-y-4 p-2">
                                <h3 className="font-semibold">Allgemein</h3>
                                <div><label className="text-xs font-medium">Titel</label><input value={localChart.config.title || ''} onChange={(e) => handleVisualConfigChange('title', e.target.value)} className="w-full p-1 border rounded mt-1"/></div>
                                <div><label className="text-xs font-medium">Diagrammtyp</label><select value={localChart.config.series?.[0]?.type || localChart.type} onChange={(e) => { setLocalChart(p => ({...p, type: e.target.value as ChartType})); handleVisualConfigChange('series', [{type: e.target.value}]); }} className="w-full p-1 border rounded mt-1">{CHART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <h3 className="font-semibold pt-2 border-t">Achsen</h3>
                                <div><label className="text-xs font-medium">X-Achse (Spalte)</label><select value={localChart.config.xAxis?.sourceColumn || ''} onChange={(e) => handleVisualConfigChange('xAxis.sourceColumn', e.target.value)} className="w-full p-1 border rounded mt-1">{parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                                <div><label className="text-xs font-medium">Y-Achse (Typ)</label><select value={localChart.config.yAxis?.type || 'value'} onChange={(e) => handleVisualConfigChange('yAxis.type', e.target.value)} className="w-full p-1 border rounded mt-1"><option value="value">Wert</option><option value="category">Kategorie</option><option value="log">Log</option></select></div>
                            </div>
                        )}
                        {activeTab === 'json' && (
                             <textarea 
                                value={JSON.stringify(echartsOption, null, 2)}
                                onChange={(e) => {
                                    try { JSON.parse(e.target.value); setLocalChart(p => ({...p, config: { rawJson: e.target.value }})); } catch (err) {}
                                }}
                                className="w-full h-full p-2 border rounded font-mono text-sm"
                                placeholder="Geben Sie hier die ECharts-Option als JSON ein."
                            />
                        )}
                    </div>
                </div>
                <div ref={chartRef} className="w-full h-full min-h-[300px] border border-border rounded-lg bg-slate-50"></div>
            </div>
        </div>
    );
};

export default ChartEditor;