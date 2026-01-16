/**
 * Sankey diagram renderer using D3.js
 * Supports 2-4 dimensions with configurable styling
 */

import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyLeft, sankeyRight, sankeyCenter, sankeyJustify } from 'd3-sankey';
import {
  getColorScale,
  getLinkColor,
  getNodeColor,
  parseStyleValue,
  parseNumericStyle,
  parseBooleanStyle,
  parseColorStyle
} from './styleUtils.js';

/**
 * Main Sankey diagram renderer class
 */
export class SankeyRenderer {
  constructor(container) {
    this.container = container;
    this.svg = null;
    this.tooltip = null;
  }

  /**
   * Initialize or reset the SVG container
   */
  initializeSvg(width, height) {
    // Clear existing content
    d3.select(this.container).selectAll('*').remove();

    // Set container styles
    d3.select(this.container)
      .style('position', 'relative')
      .style('width', '100%')
      .style('height', '100%');

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('font-family', 'sans-serif');

    // Create tooltip div
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.85)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('max-width', '250px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)');

    return this.svg;
  }

  /**
   * Get alignment function based on style setting
   */
  getAlignment(alignmentValue) {
    const alignments = {
      'justify': sankeyJustify,
      'left': sankeyLeft,
      'right': sankeyRight,
      'center': sankeyCenter
    };
    return alignments[alignmentValue] || sankeyJustify;
  }

  /**
   * Extract style configuration with defaults
   */
  parseStyles(style) {
    return {
      nodeWidth: parseNumericStyle(style.nodeWidth, 20),
      nodePadding: parseNumericStyle(style.nodePadding, 10),
      nodeAlignment: parseStyleValue(style.nodeAlignment, 'justify'),
      colorScheme: parseStyleValue(style.colorScheme, 'category10'),
      customColors: [
        parseColorStyle(style.customColor1, null),
        parseColorStyle(style.customColor2, null),
        parseColorStyle(style.customColor3, null),
        parseColorStyle(style.customColor4, null)
      ].filter(c => c !== null),
      linkOpacity: parseNumericStyle(style.linkOpacity, 0.5),
      linkColorMode: parseStyleValue(style.linkColorMode, 'source'),
      showLabels: parseBooleanStyle(style.showLabels, true),
      labelFontSize: parseNumericStyle(style.labelFontSize, 12),
      labelFontColor: parseColorStyle(style.labelFontColor, '#333333'),
      showValues: parseBooleanStyle(style.showValues, true),
      margins: {
        top: parseNumericStyle(style.marginTop, 20),
        right: parseNumericStyle(style.marginRight, 120),
        bottom: parseNumericStyle(style.marginBottom, 20),
        left: parseNumericStyle(style.marginLeft, 120)
      }
    };
  }

  /**
   * Main render method
   * @param {Object} sankeyData - Transformed data { nodes, links, levelCount, dimensionLabels }
   * @param {Object} style - Style configuration from Looker Studio
   * @param {number} width - Container width
   * @param {number} height - Container height
   */
  render(sankeyData, style, width, height) {
    const { nodes, links, levelCount, dimensionLabels } = sankeyData;

    if (nodes.length === 0 || links.length === 0) {
      this.renderEmptyState(width, height);
      return;
    }

    // Parse style configuration
    const styles = this.parseStyles(style);

    // Calculate inner dimensions
    const innerWidth = width - styles.margins.left - styles.margins.right;
    const innerHeight = height - styles.margins.top - styles.margins.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) {
      this.renderEmptyState(width, height, 'Visualization area too small. Try reducing margins.');
      return;
    }

    // Initialize SVG
    this.initializeSvg(width, height);

    // Create main group with margins
    const g = this.svg.append('g')
      .attr('transform', `translate(${styles.margins.left}, ${styles.margins.top})`);

    // Configure sankey generator
    const sankeyGenerator = sankey()
      .nodeId(d => d.id)
      .nodeAlign(this.getAlignment(styles.nodeAlignment))
      .nodeWidth(styles.nodeWidth)
      .nodePadding(styles.nodePadding)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    // Generate sankey layout (deep copy to avoid mutation)
    const graph = sankeyGenerator({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    // Get color scale
    const colorScale = getColorScale(styles.colorScheme, styles.customColors, levelCount);

    // Render components in order
    this.renderLinks(g, graph.links, styles, colorScale);
    this.renderNodes(g, graph.nodes, styles, colorScale);

    if (styles.showLabels) {
      this.renderLabels(g, graph.nodes, styles, innerWidth);
    }

    // Render level headers if we have dimension labels
    if (dimensionLabels && dimensionLabels.length > 0) {
      this.renderLevelHeaders(g, graph.nodes, dimensionLabels, styles, innerWidth);
    }
  }

  /**
   * Create gradient definitions for gradient link coloring
   */
  createGradients(g, links, colorScale) {
    const defs = g.append('defs');

    links.forEach((link, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `link-gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x1)
        .attr('x2', link.target.x0);

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(link.source.level));

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(link.target.level));
    });
  }

  /**
   * Render link paths
   */
  renderLinks(g, links, styles, colorScale) {
    // Create gradient definitions if needed
    if (styles.linkColorMode === 'gradient') {
      this.createGradients(g, links, colorScale);
    }

    const linkGroup = g.append('g')
      .attr('class', 'links')
      .attr('fill', 'none');

    const linkPaths = linkGroup.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke', d => getLinkColor(d, styles.linkColorMode, colorScale))
      .attr('stroke-opacity', styles.linkOpacity)
      .style('cursor', 'pointer');

    // Add hover effects
    const self = this;
    linkPaths
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', Math.min(styles.linkOpacity + 0.3, 1));
        self.showTooltip(event, self.formatLinkTooltip(d));
      })
      .on('mousemove', function(event) {
        self.moveTooltip(event);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-opacity', styles.linkOpacity);
        self.hideTooltip();
      });
  }

  /**
   * Render node rectangles
   */
  renderNodes(g, nodes, styles, colorScale) {
    const nodeGroup = g.append('g')
      .attr('class', 'nodes');

    const self = this;
    const nodeRects = nodeGroup.selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => Math.max(1, d.y1 - d.y0))
      .attr('fill', d => getNodeColor(d, colorScale))
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer');

    // Add hover effects
    nodeRects
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#000');
        self.showTooltip(event, self.formatNodeTooltip(d));
      })
      .on('mousemove', function(event) {
        self.moveTooltip(event);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 0.5)
          .attr('stroke', '#333');
        self.hideTooltip();
      });
  }

  /**
   * Render node labels
   */
  renderLabels(g, nodes, styles, innerWidth) {
    const labelGroup = g.append('g')
      .attr('class', 'labels')
      .attr('font-family', 'sans-serif')
      .attr('font-size', styles.labelFontSize);

    labelGroup.selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', d => {
        // Position labels outside nodes
        // Left side for first half, right side for second half
        if (d.x0 < innerWidth / 2) {
          return d.x0 - 6;
        }
        return d.x1 + 6;
      })
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => {
        if (d.x0 < innerWidth / 2) {
          return 'end';
        }
        return 'start';
      })
      .attr('fill', styles.labelFontColor)
      .text(d => {
        if (styles.showValues) {
          return `${d.name} (${this.formatNumber(d.value)})`;
        }
        return d.name;
      })
      .each(function() {
        // Truncate long labels
        const self = d3.select(this);
        const maxWidth = 100;
        let text = self.text();
        let textLength = self.node().getComputedTextLength();

        while (textLength > maxWidth && text.length > 3) {
          text = text.slice(0, -4) + '...';
          self.text(text);
          textLength = self.node().getComputedTextLength();
        }
      });
  }

  /**
   * Render level/dimension headers above each column
   */
  renderLevelHeaders(g, nodes, dimensionLabels, styles, innerWidth) {
    // Group nodes by level to find column positions
    const levelPositions = new Map();
    nodes.forEach(node => {
      if (!levelPositions.has(node.level)) {
        levelPositions.set(node.level, { x0: node.x0, x1: node.x1 });
      }
    });

    const headerGroup = g.append('g')
      .attr('class', 'level-headers')
      .attr('font-family', 'sans-serif')
      .attr('font-size', styles.labelFontSize + 2)
      .attr('font-weight', 'bold');

    dimensionLabels.forEach((label, level) => {
      const pos = levelPositions.get(level);
      if (pos) {
        headerGroup.append('text')
          .attr('x', (pos.x0 + pos.x1) / 2)
          .attr('y', -10)
          .attr('text-anchor', 'middle')
          .attr('fill', styles.labelFontColor)
          .text(label);
      }
    });
  }

  /**
   * Render empty/error state
   */
  renderEmptyState(width, height, message = null) {
    this.initializeSvg(width, height);

    const defaultMessage = 'No data available. Please configure at least 2 dimensions and 1 metric.';

    this.svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f8f9fa');

    this.svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '14px')
      .text(message || defaultMessage);
  }

  /**
   * Show tooltip at cursor position
   */
  showTooltip(event, content) {
    this.tooltip
      .style('visibility', 'visible')
      .html(content);
    this.moveTooltip(event);
  }

  /**
   * Move tooltip to follow cursor
   */
  moveTooltip(event) {
    const containerRect = this.container.getBoundingClientRect();
    let x = event.clientX - containerRect.left + 15;
    let y = event.clientY - containerRect.top - 10;

    // Keep tooltip within container bounds
    const tooltipNode = this.tooltip.node();
    const tooltipRect = tooltipNode.getBoundingClientRect();

    if (x + tooltipRect.width > containerRect.width) {
      x = event.clientX - containerRect.left - tooltipRect.width - 15;
    }

    if (y + tooltipRect.height > containerRect.height) {
      y = containerRect.height - tooltipRect.height - 5;
    }

    if (y < 0) y = 5;

    this.tooltip
      .style('left', `${x}px`)
      .style('top', `${y}px`);
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  /**
   * Format node tooltip content
   */
  formatNodeTooltip(d) {
    return `
      <div style="font-weight: bold; margin-bottom: 4px;">${d.name}</div>
      <div>Level: ${d.level + 1}</div>
      <div>Total Flow: ${this.formatNumber(d.value)}</div>
    `;
  }

  /**
   * Format link tooltip content
   */
  formatLinkTooltip(d) {
    return `
      <div style="margin-bottom: 4px;">
        <strong>${d.source.name}</strong> &rarr; <strong>${d.target.name}</strong>
      </div>
      <div>Flow: ${this.formatNumber(d.value)}</div>
    `;
  }

  /**
   * Format large numbers for display
   */
  formatNumber(num) {
    if (num === undefined || num === null) return '0';

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }
}
