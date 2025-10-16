import React, { FC, useEffect, useRef, useMemo } from 'react';
import { Project } from '../../../types';
import { initialLeistungsphasen, LEISTUNGSPHASEN_COLORS } from '../../../constants';

declare var echarts: any;

interface EChartsGanttViewProps {
    project: Project;
}

const EChartsGanttView: FC<EChartsGanttViewProps> = ({ project }) => {
    const chartRef = useRef<HTMLDivElement>(null);

    const { phaseData, milestonesData } = useMemo(() => {
        // Process Leistungsphasen
        const plannablePhases = [...(project.assignedPhases || [])]
            .map(phase => {
                const fullPhaseInfo = initialLeistungsphasen.find(lp => lp.id === phase.phaseId);
                let startDate = phase.startDate ? new Date(phase.startDate) : null;
                let endDate = phase.completionDate ? new Date(phase.completionDate) : null;

                if (startDate && endDate) {
                    if (startDate.getTime() > endDate.getTime()) [startDate, endDate] = [endDate, startDate];
                } else if (!startDate && endDate) {
                    startDate = new Date(endDate);
                } else if (startDate && !endDate) {
                    endDate = new Date(startDate);
                } else {
                    return null;
                }

                return {
                    name: fullPhaseInfo?.name || `LP ${phase.phaseId}`,
                    start: startDate.getTime(),
                    end: endDate.getTime(),
                    phaseId: phase.phaseId,
                };
            }).filter(Boolean);

        // Process Milestones
        const processedMilestones = (project.milestones || [])
            .filter(m => m.date)
            .map(milestone => ({
                name: milestone.name,
                date: new Date(milestone.date).getTime(),
                completed: milestone.completed,
            }));

        return { phaseData: plannablePhases as NonNullable<typeof plannablePhases[0]>[], milestonesData: processedMilestones };
    }, [project.assignedPhases, project.milestones]);

    useEffect(() => {
        if (!chartRef.current) return;
        const chartInstance = echarts.init(chartRef.current);

        if (phaseData.length === 0 && milestonesData.length === 0) {
            chartInstance.showLoading({ text: 'Keine planbaren Phasen oder Meilensteine für dieses Projekt vorhanden.' });
            return () => chartInstance.dispose();
        }

        const taskNames = phaseData.map(p => p.name);
        const yAxisCategories = [...taskNames, 'Meilensteine'];

        const phaseSeriesData = phaseData.map((task, index) => ({
            name: task.name,
            value: [index, task.start, task.end, task.phaseId]
        }));
        
        const milestoneSeriesData = milestonesData.map(m => ({
            name: m.name,
            value: [m.date, yAxisCategories.length - 1] // Place on the "Meilensteine" track
        }));

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.seriesType === 'custom') { // Phase
                        return `<b>${params.name}</b><br/>
                                Start: ${new Date(params.value[1]).toLocaleDateString()}<br/>
                                Ende: ${new Date(params.value[2]).toLocaleDateString()}`;
                    }
                    if (params.seriesType === 'scatter') { // Milestone
                         return `<b>Meilenstein: ${params.name}</b><br/>
                                Datum: ${new Date(params.value[0]).toLocaleDateString()}`;
                    }
                    return '';
                }
            },
            dataZoom: [
                { type: 'slider', filterMode: 'weakFilter', showDataShadow: false, bottom: 10, height: 10 },
                { type: 'inside', filterMode: 'weakFilter' }
            ],
            grid: { left: '200px', right: '20px', top: '20px', bottom: '60px' },
            xAxis: { type: 'time', axisLabel: { formatter: '{yyyy}-{MM}-{dd}' } },
            yAxis: { type: 'category', data: yAxisCategories, inverse: true, axisLabel: { show: true, interval: 0, overflow: 'truncate', width: 180 } },
            series: [
                { // Series for Phases
                    type: 'custom',
                    renderItem: (params: any, api: any) => {
                        const categoryIndex = api.value(0);
                        const start = api.coord([api.value(1), categoryIndex]);
                        const end = api.coord([api.value(2), categoryIndex]);
                        if (!start || !end || isNaN(start[0]) || isNaN(end[0])) return;
                        
                        // Thinner bars for a "line chart" feel
                        const height = api.size([0, 1])[1] * 0.25;
                        
                        const rectShape = echarts.graphic.clipRectByRect({
                            x: start[0], y: start[1] - height / 2,
                            width: end[0] - start[0], height: height
                        }, {
                            x: params.coordSys.x, y: params.coordSys.y,
                            width: params.coordSys.width, height: params.coordSys.height
                        });
                        return rectShape && { type: 'rect', shape: { ...rectShape, r: 2 }, style: api.style() };
                    },
                    itemStyle: {
                        color: (params: any) => LEISTUNGSPHASEN_COLORS[params.value[3]] || '#ccc',
                        emphasis: { opacity: 0.8 }
                    },
                    encode: { x: [1, 2], y: 0 },
                    data: phaseSeriesData
                },
                { // Series for Milestones
                    type: 'scatter',
                    data: milestoneSeriesData,
                    symbol: 'diamond',
                    symbolSize: 14,
                    itemStyle: {
                        color: '#a855f7', // purple-500
                        borderColor: '#fff',
                        borderWidth: 1,
                        shadowColor: 'rgba(0,0,0,0.3)',
                        shadowBlur: 5,
                    },
                    encode: { x: 0, y: 1 }
                }
            ]
        };

        chartInstance.setOption(option);
        
        const resizeHandler = () => chartInstance.resize();
        window.addEventListener('resize', resizeHandler);

        return () => {
            window.removeEventListener('resize', resizeHandler);
            chartInstance.dispose();
        };

    }, [project, phaseData, milestonesData]);

    return (
        <div className="h-full flex flex-col">
            <h3 className="text-xl font-semibold pb-4 border-b border-border mb-4">Gantt-Diagramm der Leistungsphasen & Meilensteine</h3>
            <div className="overflow-x-auto flex-grow min-h-[400px]">
                <div ref={chartRef} className="w-full h-full min-w-[700px]"></div>
            </div>
        </div>
    );
};

export default EChartsGanttView;