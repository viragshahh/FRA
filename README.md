# RiskLab — Financial Risk Analytics

A presentation-ready, editable static website for a Financial Risk Analytics project. It visualizes the workbook's current reported results for portfolio risk, parametric and historical VaR, Expected Shortfall, rolling VaR backtesting, composite risk scoring, and constrained Markowitz optimization.

## Run locally

This is a static site; no build step or database is required.

1. Keep `index.html`, `styles.css`, `app.js`, and `data.js` in the same folder.
2. Open `index.html` in a browser. If your browser restricts local scripts, use VS Code's Live Server extension.

## Deploy to GitHub + Vercel

1. Create a new GitHub repository, for example `fra-risklab`.
2. Upload all four site files and this README to the repository root.
3. In Vercel, choose **Add New → Project**, import `fra-risklab`, and deploy.
4. Framework preset: **Other**. Build command: leave blank. Output directory: `.` (the repository root).
5. Each commit pushed to the connected GitHub branch triggers a new deployment.

## Updating figures after submission

- **Data values:** edit `data.js`. It defines `window.FRA_DATA`, the object consumed by `app.js`.
- **Charts and interpretation:** edit `app.js`.
- **Visual design:** edit `styles.css`.
- **Page structure and text:** edit `index.html`.

The “Export data” button downloads the site's embedded data as JSON; it does not modify the source repository.

## Important methodology notes

- The site reflects values extracted from the supplied workbook; it does not silently recalculate or certify the workbook.
- The workbook uses equal-weight portfolios for the regime VaR/ES matrix sheets and for the rolling VaR backtest. The Markowitz pages separately show optimized weights.
- Annualized arithmetic mean is daily mean × 252. Annualized volatility is daily standard deviation × √252.
- Parametric VaR uses the workbook's normal quantile multipliers (1.645 at 95%; 2.326 at 99%). Historical ES is the mean of returns at or below the historical VaR threshold.
- Markowitz optimization was computed numerically with SLSQP, minimizing annualized variance subject to weights summing to 100%, each weight at least 1%, and expected return at least the target. It was not run through the Excel Solver interface.
- Figures are historical estimates and not investment advice or live market data. Verify source data and assumptions before relying on them as production risk measures.

## External libraries

Chart.js is loaded from jsDelivr; fonts are loaded from Google Fonts. An internet connection is required for charts and hosted fonts. Core text and tables remain readable if those external resources fail.
