
import React, { FC, useState, useMemo, useEffect, useRef } from 'react';
// FIX: Changed import to be a relative path.
import { Project, ProjectStatus } from '../../types';
import { GoogleGenAI } from "@google/genai";
import { formatCurrency } from '../../utils';

// Let TypeScript know that 'echarts' is available on the window object from the CDN script
declare var echarts: any;

interface CostAnalysisProps {
    projects: Project[];
}

interface AnalysisResult {
    costPerSqm: number;
    totalCost: number;
    totalArea: number;
    analyzedProjects: {
        id: string;
        name: string;
        cost: number;
        area: number;
        costPerSqm: number;
    }[];
}

const availableStatuses: ProjectStatus[] = ['In Planung', 'In Ausführung', 'Abgeschlossen', 'Pausiert'];

const CostAnalysis: FC<CostAnalysisProps> = ({ projects }) => {
    const [category, setCategory] = useState('');
    const [query, setQuery] = useState('Kosten für die normale Elektroinstallation (KG 440)');
    const [selectedStatuses, setSelectedStatuses] = useState<Set<ProjectStatus>>(new Set(['Abgeschlossen']));
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const [dateRange, setDateRange] = useState({
        start: twoYearsAgo.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);


    const projectCategories = useMemo(() => {
        const categories = new Set(projects.map(p => p.projectCategory).filter(Boolean));
        return Array.from(categories);
    }, [projects]);

    const handleStatusChange = (status: ProjectStatus) => {
        setSelectedStatuses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(status)) {
                newSet.delete(status);
            } else {
                newSet.add(status);
            }
            return newSet;
        });
    };

    const handleAnalyze = async () => {
        if (!category || !query || selectedStatuses.size === 0) {
            setError('Bitte wählen Sie Projekttyp, Status und geben Sie eine Analyse-Frage ein.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

            const interpretResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Du bist ein Experte für Leistungsverzeichnisse in der Elektrotechnik. Übersetze die folgende Anforderung in relevante Kostengruppen (KG) nach DIN 276 und spezifische Stichwörter. Gib nur eine Liste von KGs und Stichwörtern zurück. Anforderung: "${query}"`,
            });
            const keywords = interpretResponse.text.split(',').map(k => k.trim().toLowerCase());
            
            const relevantProjects = projects.filter(p => 
                p.projectCategory === category &&
                selectedStatuses.has(p.status) &&
                p.grossFloorArea && p.grossFloorArea > 0 &&
                p.endDate && 
                new Date(p.endDate) >= new Date(dateRange.start) &&
                new Date(p.endDate) <= new Date(dateRange.end)
            );

            if (relevantProjects.length === 0) {
                throw new Error('Keine passenden Projekte für die gewählten Filter gefunden.');
            }

            let totalCost = 0;
            let totalArea = 0;
            const analyzedProjectsData: AnalysisResult['analyzedProjects'] = [];

            for (const project of relevantProjects) {
                let projectCost = 0;
                const lvs = project.serviceSpecifications?.flatMap(folder => folder.files) || [];
                
                for (const lvFile of lvs) {
                    if (lvFile.parsedData) {
                        const cost = lvFile.parsedData.flatMap((s: any) => s.positions).reduce((acc: number, pos: any) => {
                            const combinedText = `${pos.oz} ${pos.kurztext} ${pos.langtext}`.toLowerCase();
                            if (keywords.some(k => combinedText.includes(k))) {
                                // Improved pseudo-price simulation based on OZ for more realistic variation
                                const pseudoPrice = (parseInt(pos.oz.slice(-2), 10) || 10) * (Math.random() * 2 + 0.5);
                                return acc + (pos.menge * pseudoPrice);
                            }
                            return acc;
                        }, 0);
                        projectCost += cost;
                    }
                }

                if (projectCost > 0) {
                    totalCost += projectCost;
                    totalArea += project.grossFloorArea!;
                    analyzedProjectsData.push({
                        id: project.id,
                        name: project.name,
                        cost: projectCost,
                        area: project.grossFloorArea!,
                        costPerSqm: projectCost / project.grossFloorArea!,
                    });
                }
            }

            if (totalArea === 0) {
                throw new Error('Es konnten keine Kosten für die angegebene Abfrage in den LVs der Projekte gefunden werden.');
            }

            setResult({
                costPerSqm: totalCost / totalArea,
                totalCost,
                totalArea,
                analyzedProjects: analyzedProjectsData.sort((a,b) => b.costPerSqm - a.costPerSqm), // Sort for better chart readability
            });

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Ein unbekannter Fehler ist aufgetreten.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (result && result.analyzedProjects.length > 0 && chartRef.current) {
            const chartInstance = echarts.init(chartRef.current);
            const option = {
                title: { text: 'Kostenkennwerte pro Projekt', subtext: 'Vergleich der Kosten pro Quadratmeter', left: 'center' },
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params: any) => `${params[0].name}<br/><b>${formatCurrency(params[0].value)} / m²</b>` },
                grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
                xAxis: { type: 'category', data: result.analyzedProjects.map(p => p.name), axisLabel: { interval: 0, rotate: 30, hideOverlap: true } },
                yAxis: { type: 'value', axisLabel: { formatter: '{value} €' } },
                series: [{ name: 'Kosten/m²', type: 'bar', data: result.analyzedProjects.map(p => p.costPerSqm.toFixed(2)), itemStyle: { color: '#0052cc' } }],
                dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 5 }],
            };
            chartInstance.setOption(option);
            
            const resizeHandler = () => chartInstance.resize();
            window.addEventListener('resize', resizeHandler);

            return () => {
                window.removeEventListener('resize', resizeHandler);
                chartInstance.dispose();
            };
        }
    }, [result]);

    return (
        <div className="bg-card md:rounded-lg md:shadow-lg p-4 sm:p-6 md:p-10 w-full max-w-7xl mx-auto">
            <h2 className="text-center text-2xl font-semibold text-text mb-2">Kostenanalyse & Benchmarking</h2>
            <p className="text-center text-text-light mb-10">Ermitteln Sie Kostenkennwerte pro m² basierend auf abgeschlossenen Projekten.</p>

            <div className="max-w-6xl mx-auto bg-slate-50 border border-border rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="flex flex-col"><label htmlFor="category" className="mb-1 font-medium text-text-light text-sm">Projekttyp</label><select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border border-border rounded-md bg-white"><option value="">Wählen...</option>{projectCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                    <div className="flex flex-col"><label className="mb-1 font-medium text-text-light text-sm">Status</label><div className="flex flex-wrap gap-x-3 gap-y-1">{availableStatuses.map(status => (<div key={status} className="flex items-center"><input type="checkbox" id={`status-${status}`} checked={selectedStatuses.has(status)} onChange={() => handleStatusChange(status)} className="h-4 w-4 rounded accent-primary"/><label htmlFor={`status-${status}`} className="ml-1.5 text-sm">{status}</label></div>))}</div></div>
                    <div className="flex flex-col"><label className="mb-1 font-medium text-text-light text-sm">Zeitraum (Abschluss)</label><div className="flex items-center gap-2"><input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="w-full p-2 border border-border rounded-md bg-white text-sm" /><span className="text-text-light">-</span><input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="w-full p-2 border border-border rounded-md bg-white text-sm" /></div></div>
                    <div className="flex flex-col"><label htmlFor="query" className="mb-1 font-medium text-text-light text-sm">Analyse-Frage</label><input type="text" id="query" value={query} onChange={e => setQuery(e.target.value)} className="w-full p-2 border border-border rounded-md bg-white"/></div>
                </div>
                <button onClick={handleAnalyze} disabled={isLoading || !category || !query} className="w-full mt-4 py-2.5 px-6 font-medium rounded-md cursor-pointer transition-all bg-primary text-white hover:enabled:bg-primary-hover disabled:bg-primary/50">
                    {isLoading ? 'Analysiere...' : 'Analyse starten'}
                </button>
            </div>

            {error && <div className="max-w-6xl mx-auto mt-6 p-4 bg-red-100 text-danger rounded-md text-sm">{error}</div>}

            {isLoading && (
                 <div className="text-center p-8"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div><p className="mt-4 text-text-light">KI analysiert LVs...</p></div>
            )}

            {result && (
                <div className="mt-8">
                    <div className="text-center border-b border-border pb-6 mb-6">
                        <p className="text-sm text-text-light">Durchschnittlicher Kostenkennwert für "{query}"</p>
                        <p className="text-4xl font-bold text-primary my-2">{formatCurrency(result.costPerSqm)} / m²</p>
                        <p className="text-sm text-text-light">Basiert auf {result.analyzedProjects.length} Projekten mit einer Gesamtfläche von {result.totalArea.toLocaleString('de-DE')} m².</p>
                    </div>
                    <div ref={chartRef} className="w-full h-96 mb-8"></div>
                    <div>
                        <h4 className="font-semibold mb-2">Detail-Analyse</h4>
                        <div className="overflow-x-auto border border-border rounded-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50"><tr>
                                    <th className="p-3 font-semibold">Projekt</th>
                                    <th className="p-3 font-semibold text-right">Kosten/m²</th>
                                    <th className="p-3 font-semibold text-right">Gesamtkosten</th>
                                    <th className="p-3 font-semibold text-right">Fläche (m²)</th>
                                </tr></thead>
                                <tbody className="divide-y divide-border">
                                    {result.analyzedProjects.map(p => (
                                        <tr key={p.id} className="hover:bg-secondary-hover">
                                            <td className="p-3 font-medium">{p.name}</td>
                                            <td className="p-3 text-right font-semibold">{formatCurrency(p.costPerSqm)}</td>
                                            <td className="p-3 text-right text-text-light">{formatCurrency(p.cost)}</td>
                                            <td className="p-3 text-right text-text-light">{p.area.toLocaleString('de-DE')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostAnalysis;
