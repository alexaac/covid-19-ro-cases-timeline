import * as Config from './Config.js';
import * as Tooltip from './Tooltip.js';

// LineChart Class
export default class TimeLineGraph {
    constructor (_parentElement, graph, cases, idToNode) {
        this.parentElement = _parentElement;
        this.graph = graph;
        this.cases = cases;
        this.idToNode = idToNode;

        this.initViz();
    };
  
    initViz () {
        var viz = this;

        let language = d3.select('#language').node().value;

        viz.margin = {top: 10, right: 10, bottom: 50, left: 200},
        viz.width = Config.width - viz.margin.left - viz.margin.right,
        viz.height = Config.height - viz.margin.top - viz.margin.bottom;
    
        viz.g = d3.select(viz.parentElement).append("g")
            .attr('class', 'time-graph')
            .attr('transform',
                'translate(' + viz.margin.left + ',' + viz.margin.top + ')');

        viz.t = function() { return d3.transition().duration(1000); };

        // Set scales for nodes by time
        viz.xScale = d3.scaleTime().range([0, viz.width]);
        viz.yScale = d3.scaleLinear().range([viz.height, 0]);
    
        viz.yAxisCall = d3.axisLeft().ticks(10);
        viz.xAxisCall = d3.axisBottom().ticks(30);
    
        viz.xAxis = viz.g.append('g')
            .attr("class", "time-graph-x")
            .attr('transform', `translate(0,${viz.height})`);
        viz.yAxis = viz.g.append('g')
            .attr('class', 'time-graph-y');
    
        viz.xLabel = viz.g.append('text')
            .attr('y', viz.height + 70)
            .attr('x', viz.width / 2)
            .attr('font-size', '16px')
            .attr('text-anchor', 'middle')
            .text(language === 'ro' ? 'Ziua' : 'Day');
        viz.yLabel = viz.g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', - 50)
            .attr('x', - viz.height / 2)
            .attr('font-size', '20px')
            .attr('text-anchor', 'middle')
            .text(language === 'ro' ? 'Cazuri ordonate pe zi' : 'Ordered cases per day');
            
        viz.setupData();
    };

    setupData () {
        var viz = this;

        viz.dataFiltered = viz.graph;
        
        viz.updateViz();
    };

    updateViz () {
        var viz = this;

        if (viz.dataFiltered !== undefined) {
            // Update scales
            viz.xScale.domain(d3.extent(viz.dataFiltered.nodes, d => d.date)).nice();
            viz.yScale.domain(d3.extent(viz.dataFiltered.nodes, d => d.dayOrder)).nice();

            // Update axes
            viz.xAxisCall.scale(viz.xScale);
            viz.xAxis.transition(viz.t()).call(viz.xAxisCall.tickFormat(Config.multiFormat));
            viz.yAxisCall.scale(viz.yScale);
            viz.yAxis.transition(viz.t()).call(viz.yAxisCall);

            viz.xAxis.selectAll('text')
                .attr('font-weight', 'bold')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('transform', 'rotate(-65)');
            viz.yAxis.selectAll('text')
                .attr('font-weight', 'bold');

            // Add nodes and links
            const markerTypes = Array.from(new Set(viz.dataFiltered.nodes.map(d => d.source)));
            viz.g.append('defs').selectAll('marker')
                .data(markerTypes)
                    .join('marker')
                        .attr('id', d => `arrow-${d}`)
                        .attr('viewBox', '0 -5 10 10')
                        .attr('refX', 15)
                        .attr('refY', -0.5)
                        .attr('markerWidth', 6)
                        .attr('markerHeight', 6)
                        .attr('orient', 'auto')
                    .append('path')
                        .attr('fill', '#999')
                        .attr('d', 'M0,-5L10,0L0,5');
            
            viz.links = viz.g.selectAll('.link')
                .data(viz.dataFiltered.links)
                .enter()
                .append('g')
                .attr('class', 'link');

            viz.links.append('path')
                .attr('class', d => `CO-links-${d.source}`)
                .classed('links', true)
                .attr('marker-end', d => `url(${new URL(`#arrow-${d.type}`, location.toString())})`)
                .attr('d', d => {
                    let start = viz.xScale(viz.idToNode[d.source].date) || 0;
                    let end = viz.xScale(viz.idToNode[d.target].date);
                    const arcPath = ['M', start, viz.yScale(viz.idToNode[d.source].dayOrder), 'A', (start - end)/2, ',', (start-end)/2, 0,0,',',
                                start < end ? 1: 0, end, viz.yScale(viz.idToNode[d.target].dayOrder)].join(' ');
                    return arcPath;
                });

            viz.links.exit().remove();

            viz.nodes = viz.g.selectAll('.node')
                .data(viz.dataFiltered.nodes)
                .enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', d => `translate(${viz.xScale(d.date) || -100}, ${viz.yScale(d.dayOrder)})`);

            viz.nodes.append('circle')
                .attr('id', d => d.properties && `CO-${d.properties.case_no}`)
                .attr('class', d => d.properties && `CO-nodes-${d.properties.source_no}`)
                .classed('nodes', true)
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', d => d.r)
                .on('touchstart mouseover', d => Tooltip.highlight(d, viz.cases));
                    
            viz.nodes.exit().remove();
        };
    };
}
