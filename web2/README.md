# Microventure Radar

Microventure Radar is a single-page app that helps you decide when to step outside. It blends live forecast data, sunrise timing, browser geolocation, voice search, and saved places into a small "mission board" for comfort walks, golden-hour photo runs, and night-sky breaks.

## APIs used

- Geolocation API
- Web Speech API
- Web Storage API
- Open-Meteo Geocoding API
- Open-Meteo Forecast API
- Sunrise-Sunset API
- BigDataCloud Reverse Geocode Client

## Notes

- Open the site through a local server such as VS Code Live Server or `python -m http.server`.
- Geolocation usually requires `localhost` or another secure context.
- If location or microphone permission is denied, the app falls back to manual search.
