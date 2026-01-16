# Sankey Diagram - Looker Studio Community Visualization

[![Looker Studio](https://img.shields.io/badge/Looker%20Studio-Community%20Viz-4285F4)](https://lookerstudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A multi-dimensional Sankey diagram visualization for Google Looker Studio that supports 2-4 dimensions. Ideal for visualizing flow data such as student score progression, marketing funnels, user journeys, or any sequential categorical data.

**Author:** Alvaro Padilla

![Sankey Diagram Example](https://storage.googleapis.com/YOUR_BUCKET/sankey-example.png)

## Features

- **2-4 Flexible Dimensions** - Configure as few as 2 or as many as 4 stages
- **Multiple Color Schemes** - Category 10, Tableau 10, Set 3, Pastel, or custom colors
- **Link Color Modes** - Source-based, target-based, gradient, or gray
- **Interactive Tooltips** - Hover to see flow values
- **Responsive Design** - Adapts to any panel size
- **Customizable Layout** - Adjust margins, node width, padding, and alignment

## How to Use

1. Add the visualization to your Looker Studio report
2. Configure **2-4 dimensions** (one for each stage/level)
3. Add **1 metric** for the flow value (e.g., count, sum)
4. Customize styling in the Style panel

## Data Configuration

| Field | Required | Description |
|-------|----------|-------------|
| **Level 1** | Yes | First stage dimension (e.g., Initial Score Band) |
| **Level 2** | Yes | Second stage dimension (e.g., Mid-Year Score Band) |
| **Level 3** | No | Third stage dimension (e.g., End-of-Year Score Band) |
| **Level 4** | No | Fourth stage dimension (e.g., Final Assessment) |
| **Flow Amount** | Yes | Metric for flow value (e.g., Student Count) |

## Style Options

| Option | Description |
|--------|-------------|
| **Node Width** | Width of the node rectangles (10-50px) |
| **Node Padding** | Vertical spacing between nodes |
| **Node Alignment** | Justify, Left, Right, or Center |
| **Color Scheme** | Category 10, Tableau 10, Set 3, Pastel, or Custom |
| **Custom Colors 1-4** | Define custom colors for each level |
| **Link Opacity** | Transparency of flow links (0.1-1.0) |
| **Link Color Mode** | Source, Target, Gradient, or Gray |
| **Show Labels** | Toggle node labels on/off |
| **Show Values** | Include values in labels |
| **Margins** | Top, Right, Bottom, Left margins |

## Example Use Case

Track student score progression across testing windows:

| Window 1 | Window 2 | Window 3 | Students |
|----------|----------|----------|----------|
| Below Basic | Basic | Proficient | 50 |
| Basic | Proficient | Advanced | 75 |
| Proficient | Proficient | Proficient | 100 |

The Sankey diagram visualizes how students flow between performance levels across each testing window.

## Libraries Used

- [D3.js](https://d3js.org/) (v7) - BSD 3-Clause License
- [d3-sankey](https://github.com/d3/d3-sankey) (v0.12.3) - BSD 3-Clause License

## Support

For issues or questions, please [open an issue](https://github.com/alvarop1/sankey_looker_studio/issues) on this repository.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Legal

- [Privacy Policy](PRIVACY_POLICY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)
