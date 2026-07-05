# Summit Money Engine Part 18

Real-index patch: removes fixed placeholder country values and calculates indexes from source-backed data where available.

Sources used by the app:
- World Bank Indicators API: homicide, population, GDP/person, GDP growth, inflation, unemployment, trade/GDP, exports/GDP, internet users.
- data.police.uk: official UK street-level crime where available.
- GDELT / ReliefWeb / USGS / optional UCDP: event pressure and incident dots.
- Binance / Yahoo chart feeds: market prices and recent candles.

If a source does not return a value, the UI shows N/A instead of guessing.

Health check: `SUMMIT-MONEY-ENGINE-PART18-LIVE-DATA-GATHERERS-REAL-INDEXES`
