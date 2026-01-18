# Income by Decile: Interactive Visualization (1982-2024)

An interactive D3.js visualization showing how wage gains have been captured disproportionately by higher income deciles over the past four decades.

## Preview

The visualization shows annualized real earnings across 10 income deciles from 1982-2024. Click the "Index" toggle to compare relative growth - the top decile's dramatic divergence becomes strikingly clear.

**To create a demo GIF:**
1. Open `index.html` in Chrome
2. Use a screen recording tool (e.g., LICEcap, ScreenToGif, or macOS built-in)
3. Record: Click Index toggle → Slide from 1982 to 2024 → Toggle off
4. Save as `demo.gif` in the repo root

## Live Demo

View the interactive visualization: [GitHub Pages Link]

## Features

- **10 income deciles** displayed with a blue gradient (light = lowest income, dark = highest income)
- **Interactive tooltips** showing exact values on hover
- **Index mode** - Toggle to compare relative growth across deciles from any base year
- **Dynamic Y-axis** that adapts to show the most relevant scale
- **Recession indicators** showing NBER-defined recession periods as grey bars
- **Responsive design** that works on desktop and mobile

## Data Sources

- **Income Data**: Economic Policy Institute (EPI) CPS Basic Monthly Extracts
- **Inflation Adjustment**: Consumer Price Index for All Urban Consumers (CPI-U) from the Federal Reserve Bank of Minneapolis
- All values adjusted to 2024 dollars

## Key Findings

- The top decile (10th) saw income grow from ~$132K to ~$267K (102% increase)
- The bottom decile (1st) grew from ~$8.5K to ~$11.7K (38% increase)
- The ratio between top and bottom deciles widened from 15.6x to 22.8x

## Files

```
income-deciles-viz/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Stylesheet
├── js/
│   ├── data.js         # Income decile data
│   └── chart.js        # D3.js visualization logic
├── demo.gif            # Animated demo
└── README.md           # This file
```

## Usage

### Option 1: GitHub Pages
1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Access at `https://[username].github.io/income-deciles-viz/`

### Option 2: Local
1. Clone the repository
2. Open `index.html` in a browser (or use a local server)

```bash
# Using Python's built-in server
python -m http.server 8000
# Then open http://localhost:8000
```

## Dependencies

- [D3.js v7](https://d3js.org/) (loaded from CDN)

## License

MIT License - Feel free to use and modify.

## Author

Visualized by Mark G. Sheppard

## Acknowledgments

- Economic Policy Institute for the CPS data extracts
- Federal Reserve Bank of Minneapolis for CPI-U historical data
