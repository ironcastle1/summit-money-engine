# v2 fixed notes

This package is a correction pass after the first security companion build.

Critical fixes:

- Removed family and Europe tabs.
- Prevented ocean clicks from showing land safety and crime cards.
- Map is bounded with no wrapping map copies.
- War overlay only colours countries with war hits.
- Crisis/watch overlays are opt-in.
- GDELT location logic no longer uses article source country as event country.
- Live brief focuses on actionable security and travel signals.
- City Risk tab explains local-vs-national data.

Important limitation:

Local crime is only available where a real official local crime feed exists. For the UK, the app uses data.police.uk around the clicked point. Other countries use national indicators and live event feeds unless a specific local source is added later.
