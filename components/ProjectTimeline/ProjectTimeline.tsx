import React, { FC, useMemo, useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { LEISTUNGSPHASEN_COLORS, initialLeistungsphasen } from '../../constants';
import Icon from '../shared/Icon';

// Let TypeScript know that 'echarts' is available on the window object
declare var echarts: any;

const ProjectTimeline: FC = () => {
    const { projects, currentUser, users } = useAppContext();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    const isManager = useMemo(() => 
        currentUser?.role === 'Leitung' || currentUser?.role === 'Geschäftsführung'
    , [currentUser]);

    const filterableUsers = useMemo(() => 
        users.filter(u => ['Projektleiter', 'Systemplaner', 'Leitung', 'Geschäftsführung'].includes(u.role))
        .sort((a, b) => a.name.localeCompare(b.name))
    , [users]);

    const { chartData, projectNames } = useMemo(() => {
        let relevantProjects = projects
            .filter(p => (p.status === 'In Ausführung' || p.status === 'In Planung') && p.assignedPhases && p.assignedPhases.length > 0)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        if (isManager) {
            if (selectedUserIds.size > 0) {
                relevantProjects = relevantProjects.filter(p => {
                    const projectTeam = [...(p.projectLeiterIds || []), ...(p.deputyProjectLeiterIds || [])];
                    return projectTeam.some(userId => selectedUserIds.has(userId));
                });
            }
        } else if (currentUser) {
            // Non-managers only see their own projects
            relevantProjects = relevantProjects.filter(p => 
                p.projectLeiterIds.includes(currentUser.id) || 
                p.deputyProjectLeiterIds.includes(currentUser.id)
            );
        }
        
        const projectNames = relevantProjects.map(p => p.name);
        
        const chartData = relevantProjects.flatMap((project, projectIndex) => {
            const plannablePhases = [...(project.assignedPhases || [])];

            return plannablePhases.map(phase => {
                const fullPhaseInfo = initialLeistungsphasen.find(lp => lp.id === phase.phaseId);
                let startDate: Date | null = phase.startDate ? new Date(phase.startDate) : null;
                let endDate: Date | null = phase.completionDate ? new Date(phase.completionDate) : null;
                
                if (startDate && endDate) {
                    if (startDate.getTime() > endDate.getTime()) {
                        [startDate, endDate] = [endDate, startDate]; // Swap if order is wrong
                    }
                } 
                else if (startDate && !endDate) {
                    endDate = new Date(startDate);
                } else if (!startDate && endDate) {
                    startDate = new Date(endDate);
                } 
                else {
                    return null;
                }

                return {
                    name: fullPhaseInfo?.name || `LP ${phase.phaseId}`,
                    value: [
                        projectIndex,          // y-axis: project index
                        startDate.getTime(),   // x-axis start
                        endDate.getTime(),     // x-axis end
                        phase.phaseId          // custom data for coloring
                    ]
                };
            }).filter(Boolean);
        });

        return { chartData: chartData as any[], projectNames };
    }, [projects, currentUser, isManager, selectedUserIds]);

    useEffect(() => {
        if (!chartRef.current) return;

        let chartInstance = echarts.getInstanceByDom(chartRef.current);
        if (!chartInstance) {
            chartInstance = echarts.init(chartRef.current);
        }

        if (chartData.length === 0) {
            chartInstance.showLoading({ text: 'Keine Projekte für die aktuelle Auswahl gefunden.' });
            return;
        } else {
            chartInstance.hideLoading();
        }

        const option = {
            tooltip: {
                formatter: (params: any) => {
                    if (!params.value) return '';
                    const projectIndex = params.value[0];
                    const phaseId = params.value[3];
                    const fullPhaseInfo = initialLeistungsphasen.find(lp => lp.id === phaseId);
                    
                    return `<b>${projectNames[projectIndex]}</b><br/>
                            ${fullPhaseInfo?.name || `LP ${phaseId}`}<br/>
                            Start: ${new Date(params.value[1]).toLocaleDateString()}<br/>
                            Ende: ${new Date(params.value[2]).toLocaleDateString()}`;
                }
            },
            dataZoom: [
                { type: 'slider', filterMode: 'weakFilter', showDataShadow: false, bottom: 20, height: 15, labelFormatter: '' },
                { type: 'inside', filterMode: 'weakFilter' }
            ],
            grid: {
                left: '180px', right: '40px', top: '40px', bottom: '60px'
            },
            xAxis: {
                type: 'time',
                axisLabel: { formatter: '{yyyy}-{MM}-{dd}' }
            },
            yAxis: {
                type: 'category',
                data: projectNames,
                inverse: true,
                axisLabel: {
                    show: true, interval: 0, overflow: 'truncate', width: 160
                }
            },
            series: [{
                type: 'custom',
                renderItem: (params: any, api: any) => {
                    const categoryIndex = api.value(0);
                    const start = api.coord([api.value(1), categoryIndex]);
                    const end = api.coord([api.value(2), categoryIndex]);
                    if (!start || !end || isNaN(start[0]) || isNaN(end[0])) return;
                    
                    const height = api.size([0, 1])[1] * 0.4;
                    
                    const rectShape = echarts.graphic.clipRectByRect({
                        x: start[0], y: start[1] - height / 2,
                        width: end[0] - start[0], height: height
                    }, {
                        x: params.coordSys.x, y: params.coordSys.y,
                        width: params.coordSys.width, height: params.coordSys.height
                    });
                    return rectShape && {
                        type: 'rect', 
                        shape: { ...rectShape, r: 4 },
                        style: api.style()
                    };
                },
                itemStyle: {
                    color: (params: any) => LEISTUNGSPHASEN_COLORS[params.value[3]] || '#ccc',
                    emphasis: {
                        opacity: 0.8,
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                encode: { x: [1, 2], y: 0 },
                data: chartData,
                markLine: {
                    symbol: 'none',
                    silent: true,
                    lineStyle: { type: 'dashed', color: 'var(--danger-color)', width: 1 },
                    data: [{ xAxis: new Date().getTime() }],
                    label: { show: true, formatter: 'Heute', position: 'start', color: 'var(--danger-color)', fontSize: 10 }
                }
            }]
        };

        chartInstance.setOption(option, true);
        
        const resizeHandler = () => chartInstance.resize();
        window.addEventListener('resize', resizeHandler);

        return () => {
            window.removeEventListener('resize', resizeHandler);
            chartInstance?.dispose();
        };

    }, [chartData, projectNames]);

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    return (
        <div className={`p-4 sm:p-6 md:p-8 h-full flex flex-col ${isFullScreen ? 'fixed inset-0 bg-background z-50' : ''}`}>
            <div className="flex-shrink-0 flex justify-between items-start mb-4">
                 <div>
                    <h2 className="text-2xl font-semibold text-text">Projektauslastung & Zeitstrahl</h2>
                    <p className="text-text-light">Gantt-Übersicht der Projektlaufzeiten und Leistungsphasen.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsFullScreen(p => !p)} className="p-2 rounded-full hover:bg-secondary" title={isFullScreen ? "Vollbild verlassen" : "Vollbild"}>
                        <div className="w-6 h-6 text-text-light">{isFullScreen ? <Icon name="Shrink" /> : <Icon name="Expand" />}</div>
                    </button>
                </div>
            </div>

            {isManager && (
                <details className="bg-slate-50 border border-border rounded-lg mb-4">
                    <summary className="p-3 font-semibold cursor-pointer">Ansicht filtern</summary>
                    <div className="p-4 border-t border-border">
                        <div className="flex gap-2 mb-3">
                            <button onClick={() => setSelectedUserIds(new Set(filterableUsers.map(u => u.id)))} className="text-xs font-medium py-1 px-2.5 rounded bg-secondary hover:bg-secondary-hover">Alle auswählen</button>
                            <button onClick={() => setSelectedUserIds(new Set())} className="text-xs font-medium py-1 px-2.5 rounded bg-secondary hover:bg-secondary-hover">Auswahl aufheben</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
                            {filterableUsers.map(user => (
                                <div key={user.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`user-filter-${user.id}`}
                                        checked={selectedUserIds.has(user.id)}
                                        onChange={() => handleUserToggle(user.id)}
                                        className="h-4 w-4 rounded accent-primary"
                                    />
                                    <label htmlFor={`user-filter-${user.id}`} className="ml-2 text-sm truncate">{user.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </details>
            )}

            <div className="project-timeline-container flex-grow bg-card border border-border rounded-lg shadow-sm overflow-x-auto">
                <div ref={chartRef} className="project-timeline-chart w-full h-full min-w-[800px]"></div>
            </div>
        </div>
    );
};

export default ProjectTimeline;