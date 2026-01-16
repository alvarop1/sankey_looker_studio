/**
 * Data transformation module for converting Looker Studio data to d3-sankey format.
 *
 * Handles 2-4 dimensions dynamically, creating unique node IDs per level
 * to support same values appearing at different stages (e.g., "Basic" at Window 1
 * is distinct from "Basic" at Window 2).
 */

/**
 * Create a unique node ID that includes the level
 * @param {string} value - The dimension value
 * @param {number} level - The level index (0-3)
 * @returns {string} Unique node identifier
 */
function createNodeId(value, level) {
  return `L${level}:${value}`;
}

/**
 * Parse a node ID back to its components
 * @param {string} nodeId
 * @returns {{ level: number, value: string }}
 */
export function parseNodeId(nodeId) {
  const match = nodeId.match(/^L(\d+):(.+)$/);
  if (match) {
    return { level: parseInt(match[1]), value: match[2] };
  }
  return { level: 0, value: nodeId };
}

/**
 * Main transformation function - converts Looker Studio data to Sankey format
 * @param {Object} data - Looker Studio data object with tables and fields
 * @returns {{ nodes: Array, links: Array, levelCount: number, dimensionLabels: string[] }}
 */
export function transformToSankey(data) {
  // Handle both table formats from Looker Studio
  const rows = data.tables?.DEFAULT || [];

  if (!rows || rows.length === 0) {
    return { nodes: [], links: [], levelCount: 0, dimensionLabels: [] };
  }

  // Determine which dimensions are present (2-4)
  const dimensionKeys = ['dimension1', 'dimension2', 'dimension3', 'dimension4']
    .filter(key => {
      const firstRow = rows[0];
      // Check if dimension exists and has data
      return firstRow[key] !== undefined &&
             firstRow[key] !== null &&
             firstRow[key].length > 0 &&
             firstRow[key][0] !== null &&
             firstRow[key][0] !== undefined;
    });

  const levelCount = dimensionKeys.length;

  if (levelCount < 2) {
    console.warn('Sankey requires at least 2 dimensions');
    return { nodes: [], links: [], levelCount: 0, dimensionLabels: [] };
  }

  // Get dimension labels from fields metadata
  const dimensionLabels = getDimensionLabels(data.fields, dimensionKeys);

  // Maps for aggregation
  const nodeMap = new Map();      // nodeId -> { id, name, level, totalValue }
  const linkMap = new Map();      // "sourceId->targetId" -> { source, target, value }

  // Process each row
  rows.forEach(row => {
    // Get metric value - handle array format from Looker Studio
    const metricValue = Array.isArray(row.flowMetric)
      ? (row.flowMetric[0] || 0)
      : (row.flowMetric || 0);

    if (metricValue <= 0) return; // Skip zero/negative values

    // Extract dimension values for this row
    const values = dimensionKeys.map(key => {
      const val = row[key];
      return Array.isArray(val) ? val[0] : val;
    }).filter(v => v !== null && v !== undefined && v !== '');

    // Skip if we don't have enough valid values
    if (values.length < 2) return;

    // Create/update nodes for each level
    values.forEach((value, levelIndex) => {
      const nodeId = createNodeId(String(value), levelIndex);

      if (nodeMap.has(nodeId)) {
        nodeMap.get(nodeId).totalValue += metricValue;
      } else {
        nodeMap.set(nodeId, {
          id: nodeId,
          name: String(value),
          level: levelIndex,
          totalValue: metricValue
        });
      }
    });

    // Create/update links between adjacent levels
    for (let i = 0; i < values.length - 1; i++) {
      const sourceId = createNodeId(String(values[i]), i);
      const targetId = createNodeId(String(values[i + 1]), i + 1);
      const linkKey = `${sourceId}->${targetId}`;

      if (linkMap.has(linkKey)) {
        linkMap.get(linkKey).value += metricValue;
      } else {
        linkMap.set(linkKey, {
          source: sourceId,
          target: targetId,
          value: metricValue
        });
      }
    }
  });

  // Convert maps to arrays - keep string IDs for d3-sankey to resolve via nodeId
  const nodes = Array.from(nodeMap.values());
  const links = Array.from(linkMap.values()).map((link, i) => ({
    source: link.source,  // Keep as string ID - d3-sankey resolves via nodeId accessor
    target: link.target,  // Keep as string ID
    value: link.value,
    index: i
  }));

  return {
    nodes,
    links,
    levelCount,
    dimensionLabels
  };
}

/**
 * Get dimension labels from field metadata
 * @param {Object} fields - Looker Studio fields object
 * @param {string[]} dimensionKeys - Active dimension keys
 * @returns {string[]} Array of dimension labels
 */
function getDimensionLabels(fields, dimensionKeys) {
  if (!fields) return dimensionKeys.map((_, i) => `Level ${i + 1}`);

  return dimensionKeys.map((key, i) => {
    if (fields[key] && fields[key].length > 0 && fields[key][0].name) {
      return fields[key][0].name;
    }
    return `Level ${i + 1}`;
  });
}

/**
 * Filter out links/nodes with zero or negative values
 * @param {{ nodes: Array, links: Array, levelCount: number }} sankeyData
 * @returns {{ nodes: Array, links: Array, levelCount: number }}
 */
export function filterValidData(sankeyData) {
  if (!sankeyData.nodes.length || !sankeyData.links.length) {
    return sankeyData;
  }

  // Filter links with positive values
  const validLinks = sankeyData.links.filter(link => link.value > 0);

  if (validLinks.length === 0) {
    return { nodes: [], links: [], levelCount: 0, dimensionLabels: [] };
  }

  // Get set of node indices that are referenced by valid links
  const usedNodeIndices = new Set();
  validLinks.forEach(link => {
    usedNodeIndices.add(link.source);
    usedNodeIndices.add(link.target);
  });

  // Keep only nodes that are referenced
  const validNodes = sankeyData.nodes.filter((_, index) =>
    usedNodeIndices.has(index)
  );

  // Rebuild index mapping
  const oldToNewIndex = new Map();
  sankeyData.nodes.forEach((node, oldIndex) => {
    const newIndex = validNodes.indexOf(node);
    if (newIndex !== -1) {
      oldToNewIndex.set(oldIndex, newIndex);
    }
  });

  // Update link indices
  const remappedLinks = validLinks.map((link, i) => ({
    ...link,
    source: oldToNewIndex.get(link.source),
    target: oldToNewIndex.get(link.target),
    index: i
  }));

  return {
    nodes: validNodes,
    links: remappedLinks,
    levelCount: sankeyData.levelCount,
    dimensionLabels: sankeyData.dimensionLabels
  };
}
