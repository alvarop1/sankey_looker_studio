/**
 * Looker Studio Community Visualization - Sankey Diagram
 *
 * Entry point that integrates with Google's dscc library
 * to receive data and render the visualization.
 */

import * as dscc from '@google/dscc';
import { SankeyRenderer } from './sankey.js';
import { transformToSankey, filterValidData } from './dataTransform.js';

// Global renderer instance
let renderer = null;

/**
 * Main draw callback - called by Looker Studio when data updates
 * @param {Object} data - Data object from Looker Studio
 */
function drawViz(data) {
  // Get or create the container element
  let container = document.getElementById('sankey-container');

  if (!container) {
    // Create container if it doesn't exist
    container = document.createElement('div');
    container.id = 'sankey-container';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    // Reset body styles for clean rendering
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
  }

  // Get dimensions from Looker Studio
  const width = dscc.getWidth();
  const height = dscc.getHeight();

  // Validate dimensions
  if (width <= 0 || height <= 0) {
    console.warn('Invalid dimensions:', width, height);
    return;
  }

  // Initialize renderer if needed
  if (!renderer) {
    renderer = new SankeyRenderer(container);
  }

  try {
    // Transform Looker Studio data to Sankey format
    let sankeyData = transformToSankey(data);

    // Filter out invalid data
    sankeyData = filterValidData(sankeyData);

    // Extract style configuration
    const style = data.style || {};

    // Render the visualization
    renderer.render(sankeyData, style, width, height);

  } catch (error) {
    console.error('Error rendering Sankey diagram:', error);
    renderError(container, width, height, error.message);
  }
}

/**
 * Render an error state
 */
function renderError(container, width, height, message) {
  container.innerHTML = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#fff3cd"/>
      <text x="50%" y="45%" text-anchor="middle" fill="#856404" font-size="14" font-family="sans-serif">
        Error rendering visualization
      </text>
      <text x="50%" y="55%" text-anchor="middle" fill="#856404" font-size="12" font-family="sans-serif">
        ${message || 'Unknown error'}
      </text>
    </svg>
  `;
}

// Subscribe to Looker Studio data updates
// Using objectTransform to get data in a more structured format
dscc.subscribeToData(drawViz, {
  transform: dscc.objectTransform
});
