/**
 * Style utilities for the Sankey visualization.
 * Provides color scales and styling helper functions.
 */

import * as d3 from 'd3';

/**
 * Get the appropriate color scale based on configuration
 * @param {string} scheme - Color scheme name
 * @param {string[]} customColors - Array of custom color hex values
 * @param {number} levelCount - Number of levels in the Sankey diagram
 * @returns {Function} D3 color scale function
 */
export function getColorScale(scheme, customColors, levelCount) {
  // If custom scheme and colors provided, use those
  if (scheme === 'custom' && customColors && customColors.length > 0) {
    const validColors = customColors.filter(c => c && c !== '');
    if (validColors.length > 0) {
      return d3.scaleOrdinal()
        .domain(d3.range(Math.max(levelCount, 10)))
        .range(validColors);
    }
  }

  // Built-in D3 schemes
  const schemes = {
    'category10': d3.schemeCategory10,
    'tableau10': d3.schemeTableau10,
    'set3': d3.schemeSet3,
    'pastel': [...d3.schemePastel1, ...d3.schemePastel2]
  };

  const colors = schemes[scheme] || d3.schemeCategory10;

  return d3.scaleOrdinal()
    .domain(d3.range(Math.max(levelCount, 10)))
    .range(colors);
}

/**
 * Get link color based on mode
 * @param {Object} link - Link object with source and target
 * @param {string} mode - Color mode (source, target, gradient, gray)
 * @param {Function} colorScale - D3 color scale function
 * @returns {string} CSS color value
 */
export function getLinkColor(link, mode, colorScale) {
  switch (mode) {
    case 'source':
      return colorScale(link.source.level !== undefined ? link.source.level : 0);
    case 'target':
      return colorScale(link.target.level !== undefined ? link.target.level : 1);
    case 'gradient':
      return `url(#link-gradient-${link.index})`;
    case 'gray':
    default:
      return '#aaa';
  }
}

/**
 * Get node color based on level
 * @param {Object} node - Node object with level property
 * @param {Function} colorScale - D3 color scale function
 * @returns {string} CSS color value
 */
export function getNodeColor(node, colorScale) {
  return colorScale(node.level || 0);
}

/**
 * Ensure sufficient contrast for text over backgrounds
 * @param {string} backgroundColor - Background color in any CSS format
 * @returns {string} Either dark or light text color
 */
export function getContrastColor(backgroundColor) {
  const rgb = d3.color(backgroundColor);
  if (!rgb) return '#333';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#333' : '#fff';
}

/**
 * Parse style value from Looker Studio format
 * @param {*} styleValue - Value from Looker Studio style config
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed value
 */
export function parseStyleValue(styleValue, defaultValue) {
  if (styleValue === undefined || styleValue === null) {
    return defaultValue;
  }

  // Handle object format { value: x }
  if (typeof styleValue === 'object' && styleValue.value !== undefined) {
    return styleValue.value;
  }

  // Handle color format { color: "#hex" }
  if (typeof styleValue === 'object' && styleValue.color !== undefined) {
    return styleValue.color;
  }

  return styleValue;
}

/**
 * Parse numeric style value
 * @param {*} styleValue - Value from Looker Studio style config
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed numeric value
 */
export function parseNumericStyle(styleValue, defaultValue) {
  const parsed = parseStyleValue(styleValue, defaultValue);
  const num = parseFloat(parsed);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Parse boolean style value
 * @param {*} styleValue - Value from Looker Studio style config
 * @param {boolean} defaultValue - Default value if parsing fails
 * @returns {boolean} Parsed boolean value
 */
export function parseBooleanStyle(styleValue, defaultValue) {
  const parsed = parseStyleValue(styleValue, defaultValue);
  if (typeof parsed === 'boolean') return parsed;
  if (parsed === 'true') return true;
  if (parsed === 'false') return false;
  return defaultValue;
}

/**
 * Parse color style value
 * @param {*} styleValue - Value from Looker Studio style config
 * @param {string} defaultValue - Default color value
 * @returns {string} Color hex string
 */
export function parseColorStyle(styleValue, defaultValue) {
  if (!styleValue) return defaultValue;

  // Handle object format { color: "#hex" }
  if (typeof styleValue === 'object' && styleValue.color) {
    return styleValue.color;
  }

  // Handle object format { value: { color: "#hex" } }
  if (typeof styleValue === 'object' && styleValue.value && styleValue.value.color) {
    return styleValue.value.color;
  }

  // Handle direct string
  if (typeof styleValue === 'string' && styleValue.startsWith('#')) {
    return styleValue;
  }

  return defaultValue;
}
