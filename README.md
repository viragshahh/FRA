# Portfolio Risk and Optimization

A guided, interactive static website for the Financial Risk Analytics project by Section B, Group 3.

## Team

Nishant Kothari  
Snehasish Samantaray  
Virag Shah  
Ashi Jain  
Priti Jogani

## Run locally

Keep index.html, styles.css, app.js and data.js in the same folder. Open index.html in a browser, or use the Live Server extension in Visual Studio Code.

## Publish with GitHub and Vercel

1. Push the repository to GitHub.
2. In Vercel, import the repository.
3. Select Other as the framework preset.
4. Leave the build command blank and use the repository root as the output directory.
5. Deploy. Later commits to the connected branch will trigger a new deployment.

## Files

- index.html contains the page structure and all nine guided sections.
- styles.css contains the visual design and responsive layout.
- app.js controls navigation, tables, charts and interactive calculations.
- data.js contains the project figures embedded from the existing workbook.

## Analysis features

The website presents the portfolio universe, composite risk scoring, market regime comparisons, parametric Value at Risk, Expected Shortfall, VaR backtesting, constrained Markowitz optimization, covariance matrices and an interactive parametric VaR scenario calculator.

## Method notes

The project compares a 45 stock universe, two portfolios of ten holdings and three market windows. The stated risk score weights are 30 percent beta, 40 percent annualized volatility and 30 percent maximum drawdown. The Markowitz process minimizes annualized variance subject to a 100 percent weight sum, a minimum holding weight and a return target.

Historical portfolio selection can introduce lookahead bias when the same full history is used to classify stocks and then compare past periods. Explain whether results are retrospective or truly out of sample before drawing predictive conclusions.

This project is an academic financial risk analysis and does not provide live market data or investment advice.
