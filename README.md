# Sankey Diagram - Looker Studio Community Visualization

[![Looker Studio](https://img.shields.io/badge/Looker%20Studio-Community%20Viz-4285F4)](https://lookerstudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A multi-dimensional Sankey diagram visualization for Google Looker Studio that supports 2-4 dimensions. Perfect for tracking student scores across administration windows, visualizing marketing funnels, user journeys, or analyzing any sequential data flow.

**Author:** Alvaro Padilla

## Quick Start

1. Open your Looker Studio report
2. Add a chart → Community visualizations → Explore more → Build your own
3. Enter: `gs://YOUR_BUCKET_NAME`
4. Configure 2-4 dimensions and 1 metric

## Features

- **2-4 Flexible Dimensions**: Configure as few as 2 or as many as 4 levels
- **Configurable Colors**: Choose from preset schemes (Category 10, Tableau 10, Set 3, Pastel) or define custom colors
- **Link Color Modes**: Source-based, target-based, gradient, or gray
- **Interactive Tooltips**: Hover to see flow values
- **Responsive Design**: Adapts to panel size
- **Customizable Layout**: Adjust margins, node width, padding, and alignment

## Project Structure

```
sankey-viz/
├── src/
│   ├── index.js              # Entry point, dscc subscription
│   ├── sankey.js             # D3 Sankey rendering
│   ├── dataTransform.js      # Looker data → nodes/links
│   └── styleUtils.js         # Color schemes, utilities
├── config/
│   ├── manifest.json         # Viz metadata for Looker Studio
│   └── config.json           # Dimensions, metrics, style options
├── dist/                     # Build output (deploy this folder)
├── test/
│   └── local-test.html       # Local testing file
├── cors.json                 # GCS CORS configuration
├── package.json
└── webpack.config.js
```

## Local Development

### Prerequisites
- Node.js 16+
- npm

### Setup
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build for development (with watch)
npm run watch
```

### Local Testing
Open `test/local-test.html` in a browser to test the visualization with sample data.

## Deployment to Google Cloud Storage

### Step 1: Install Google Cloud SDK
If not already installed, download from: https://cloud.google.com/sdk/docs/install

### Step 2: Authenticate
```bash
gcloud auth login
```

### Step 3: Create a Project (if needed)
```bash
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
```

### Step 4: Enable Billing
Community visualizations require a billing-enabled project. Visit the [Google Cloud Console](https://console.cloud.google.com/billing) to enable billing.

### Step 5: Create a Cloud Storage Bucket
```bash
# Create bucket (name must be globally unique)
gsutil mb gs://looker-sankey-viz-UNIQUE_ID

# Remove public access prevention
gcloud storage buckets update gs://looker-sankey-viz-UNIQUE_ID \
  --no-public-access-prevention

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://looker-sankey-viz-UNIQUE_ID
```

### Step 6: Configure CORS
```bash
gsutil cors set cors.json gs://looker-sankey-viz-UNIQUE_ID
```

### Step 7: Update manifest.json
Edit `config/manifest.json` and update these fields with your bucket name:
- `logoUrl`
- `packageUrl`
- `iconUrl`

Or leave them as placeholders if you don't have custom icons.

### Step 8: Build and Deploy
```bash
# Build the project
npm run build

# Deploy to GCS
gsutil -m cp -r dist/* gs://looker-sankey-viz-UNIQUE_ID/
```

### Step 9: Verify Deployment
```bash
# Check files are accessible
curl -I https://storage.googleapis.com/looker-sankey-viz-UNIQUE_ID/manifest.json
```

## Adding to Looker Studio

1. Open your Looker Studio report
2. Click **Add a chart** in the toolbar
3. Scroll down and click **Community visualizations and components**
4. Click **Explore more**
5. Click **Build your own visualization**
6. Enter the manifest path: `gs://looker-sankey-viz-UNIQUE_ID`
7. Click **Submit**
8. The Sankey diagram should appear in your community visualizations list
9. Click on it to add to your report

## Configuration in Looker Studio

### Data Configuration
- **Level 1 (Required)**: First dimension (e.g., Window 1 Score Band)
- **Level 2 (Required)**: Second dimension (e.g., Window 2 Score Band)
- **Level 3 (Optional)**: Third dimension (e.g., Window 3 Score Band)
- **Level 4 (Optional)**: Fourth dimension (e.g., Final Score Band)
- **Flow Amount**: Metric representing the flow value (e.g., Student Count)

### Style Options
| Option | Description |
|--------|-------------|
| Node Width | Width of the node rectangles (10-50px) |
| Node Padding | Vertical spacing between nodes |
| Node Alignment | Justify, Left, Right, or Center |
| Color Scheme | Category 10, Tableau 10, Set 3, Pastel, or Custom |
| Custom Colors 1-4 | Define custom colors when using Custom scheme |
| Link Opacity | Transparency of flow links (0.1-1.0) |
| Link Color Mode | Source, Target, Gradient, or Gray |
| Show Labels | Toggle node labels |
| Show Values | Include values in labels |
| Margins | Top, Right, Bottom, Left margins |

## Example Use Case: Student Score Tracking

Track how student scores change across administration windows:

| Window 1 | Window 2 | Window 3 | Student Count |
|----------|----------|----------|---------------|
| Below Basic | Basic | Proficient | 50 |
| Basic | Proficient | Advanced | 75 |
| Proficient | Proficient | Proficient | 100 |

The Sankey diagram will show the flow of students between score bands across each testing window.

## Development

### Modifying the Visualization
1. Edit files in `src/`
2. Run `npm run build`
3. Re-deploy to GCS: `gsutil -m cp -r dist/* gs://YOUR_BUCKET/`

### During Active Development
Set `devMode: true` in `config/manifest.json` to disable caching. Remember to set it back to `false` for production.

## Troubleshooting

### Visualization not loading
- Verify the bucket is publicly accessible
- Check CORS is configured correctly
- Ensure manifest path is correct (starts with `gs://`)

### Data not displaying
- Ensure at least 2 dimensions and 1 metric are configured
- Check that the metric has positive values
- Verify dimension values are not null/empty

### Styling not applying
- Some style changes require refreshing the page
- Check browser console for JavaScript errors

## Support

If you encounter issues or have questions:

1. **Check the Troubleshooting section** above for common issues
2. **Open an issue** on this GitHub repository
3. **Review the documentation** in this README

## Libraries Used

This visualization uses the following open-source libraries:

- **[D3.js](https://d3js.org/)** (v7) - BSD 3-Clause License - Data visualization library
- **[d3-sankey](https://github.com/d3/d3-sankey)** (v0.12.3) - BSD 3-Clause License - Sankey diagram layout algorithm
- **[@google/dscc](https://developers.google.com/looker-studio/visualization/library)** - Google's Data Studio Community Component library

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Privacy & Terms

- [Privacy Policy](PRIVACY_POLICY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)

## Author

**Alvaro Padilla**

---

*This is a community visualization for Google Looker Studio. It is not affiliated with or endorsed by Google.*
