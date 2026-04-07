const SEARCH_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const SUN_ENDPOINT = "https://api.sunrise-sunset.org/json";
const REVERSE_ENDPOINT = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const STORAGE_KEY = "microventure-radar-saved";
const MAX_SAVED_SPOTS = 6;
const DEFAULT_PLACE = {
  label: "Chicago, Illinois, United States",
  region: "Illinois",
  country: "United States",
  latitude: 41.8755616,
  longitude: -87.6244212,
  timezone: "America/Chicago",
  precision: "Starter radar"
};

const WEATHER_LABELS = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Storm with hail",
  99: "Severe storm"
};

const dom = {
  searchForm: document.querySelector("#search-form"),
  placeInput: document.querySelector("#place-input"),
  voiceButton: document.querySelector("#voice-button"),
  locationButton: document.querySelector("#location-button"),
  saveButton: document.querySelector("#save-button"),
  shareButton: document.querySelector("#share-button"),
  searchResults: document.querySelector("#search-results"),
  statusMessage: document.querySelector("#status-message"),
  placeLabel: document.querySelector("#place-label"),
  precisionChip: document.querySelector("#precision-chip"),
  summaryAdvice: document.querySelector("#summary-advice"),
  adventureScore: document.querySelector("#adventure-score"),
  adventureState: document.querySelector("#adventure-state"),
  meterFill: document.querySelector("#meter-fill"),
  conditionLabel: document.querySelector("#condition-label"),
  conditionDetail: document.querySelector("#condition-detail"),
  temperatureLabel: document.querySelector("#temperature-label"),
  feelsLikeLabel: document.querySelector("#feels-like-label"),
  phaseLabel: document.querySelector("#phase-label"),
  phaseDetail: document.querySelector("#phase-detail"),
  bestMoveLabel: document.querySelector("#best-move-label"),
  bestMoveDetail: document.querySelector("#best-move-detail"),
  sunriseLabel: document.querySelector("#sunrise-label"),
  sunsetLabel: document.querySelector("#sunset-label"),
  blueHourLabel: document.querySelector("#blue-hour-label"),
  dayLengthLabel: document.querySelector("#day-length-label"),
  sunNote: document.querySelector("#sun-note"),
  recommendations: document.querySelector("#recommendations"),
  timeline: document.querySelector("#timeline"),
  savedEmpty: document.querySelector("#saved-empty"),
  savedPlaces: document.querySelector("#saved-places")
};

const state = {
  currentPlace: null,
  currentPayload: null,
  searchResults: [],
  savedPlaces: loadSavedPlaces(),
  recognition: null,
  isListening: false,
  isBusy: false
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();
  initSpeechRecognition();
  renderSavedPlaces();

  const placeFromUrl = placeFromQuery();
  loadPlace(placeFromUrl || DEFAULT_PLACE, {
    statusCopy: placeFromUrl
      ? `Loading shared radar for ${placeFromUrl.label}...`
      : "Loading a default radar for Chicago..."
  });
}

function bindEvents() {
  dom.searchForm.addEventListener("submit", handleSearchSubmit);
  dom.voiceButton.addEventListener("click", handleVoiceSearch);
  dom.locationButton.addEventListener("click", handleUseLocation);
  dom.saveButton.addEventListener("click", handleSaveCurrentPlace);
  dom.shareButton.addEventListener("click", handleShareView);
  dom.searchResults.addEventListener("click", handleSearchResultClick);
  dom.savedPlaces.addEventListener("click", handleSavedPlaceClick);
}

function initSpeechRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    dom.voiceButton.disabled = true;
    setStatus(
      "Voice search is not available in this browser. Typed search and geolocation still work."
    );
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("start", () => {
    state.isListening = true;
    dom.voiceButton.classList.add("listening");
    setStatus("Listening for a place name...");
  });

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim();
    if (!transcript) {
      setStatus("I did not catch a place name. Try again or type it instead.", "error");
      return;
    }

    dom.placeInput.value = transcript;
    setStatus(`Heard "${transcript}". Searching now...`, "success");
    searchForPlace(transcript);
  });

  recognition.addEventListener("error", (event) => {
    if (event.error === "not-allowed") {
      setStatus("Microphone access was blocked. You can still type a place name.", "error");
      return;
    }

    if (event.error !== "aborted") {
      setStatus("Voice search did not complete. Try again or search manually.", "error");
    }
  });

  recognition.addEventListener("end", () => {
    state.isListening = false;
    dom.voiceButton.classList.remove("listening");
  });

  state.recognition = recognition;
}

async function handleSearchSubmit(event) {
  event.preventDefault();
  const query = dom.placeInput.value.trim();
  if (query.length < 2) {
    setStatus("Enter at least two characters to search for a place.", "error");
    return;
  }

  await searchForPlace(query);
}

function handleVoiceSearch() {
  if (!state.recognition || state.isBusy) {
    return;
  }

  if (state.isListening) {
    state.recognition.stop();
    return;
  }

  state.recognition.start();
}

async function handleUseLocation() {
  if (state.isBusy) {
    return;
  }

  if (!("geolocation" in navigator)) {
    setStatus("This browser does not support geolocation. Search for a place instead.", "error");
    return;
  }

  if (!window.isSecureContext) {
    setStatus(
      "Location access usually requires a secure context. Open this page through localhost or HTTPS, or search manually.",
      "error"
    );
    return;
  }

  setStatus("Requesting your device location...");

  try {
    const coords = await getCurrentPosition();
    await loadPlace({
      label: "Current location",
      latitude: coords.latitude,
      longitude: coords.longitude,
      precision: "Precise device location"
    });
  } catch (error) {
    setStatus(geolocationErrorMessage(error), "error");
  }
}

function handleSearchResultClick(event) {
  const button = event.target.closest("button[data-result-index]");
  if (!button) {
    return;
  }

  const resultIndex = Number(button.dataset.resultIndex);
  const place = state.searchResults[resultIndex];
  if (!place) {
    return;
  }

  clearSearchResults();
  loadPlace(place, {
    statusCopy: `Loading ${place.label}...`
  });
}

function handleSaveCurrentPlace() {
  if (!state.currentPlace) {
    return;
  }

  const candidate = {
    label: state.currentPlace.label,
    region: state.currentPlace.region || "",
    country: state.currentPlace.country || "",
    latitude: Number(roundCoordinate(state.currentPlace.latitude)),
    longitude: Number(roundCoordinate(state.currentPlace.longitude)),
    timezone: state.currentPlace.timezone || "",
    precision: state.currentPlace.precision || "Saved spot"
  };

  const existingIndex = state.savedPlaces.findIndex(
    (item) =>
      Math.abs(item.latitude - candidate.latitude) < 0.001 &&
      Math.abs(item.longitude - candidate.longitude) < 0.001
  );

  if (existingIndex >= 0) {
    state.savedPlaces.splice(existingIndex, 1);
  }

  state.savedPlaces.unshift(candidate);
  state.savedPlaces = state.savedPlaces.slice(0, MAX_SAVED_SPOTS);
  persistSavedPlaces();
  renderSavedPlaces();
  setStatus(`${candidate.label} saved for quick access.`, "success");
}

async function handleShareView() {
  if (!state.currentPlace) {
    return;
  }

  syncQueryString(state.currentPlace);
  const shareData = {
    title: "Microventure Radar",
    text: `Check the radar for ${state.currentPlace.label}`,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      setStatus("Share sheet opened.", "success");
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      setStatus("Share link copied to your clipboard.", "success");
      return;
    }

    setStatus("Sharing is not supported here. Copy the URL from the address bar instead.");
  } catch (error) {
    if (error?.name !== "AbortError") {
      setStatus("Could not share this view right now.", "error");
    }
  }
}

function handleSavedPlaceClick(event) {
  const loadButton = event.target.closest("button[data-saved-index]");
  const deleteButton = event.target.closest("button[data-delete-index]");

  if (deleteButton) {
    const index = Number(deleteButton.dataset.deleteIndex);
    const removed = state.savedPlaces.splice(index, 1)[0];
    persistSavedPlaces();
    renderSavedPlaces();
    if (removed) {
      setStatus(`${removed.label} removed from saved spots.`);
    }
    return;
  }

  if (!loadButton) {
    return;
  }

  const index = Number(loadButton.dataset.savedIndex);
  const place = state.savedPlaces[index];
  if (!place) {
    return;
  }

  loadPlace(place, {
    statusCopy: `Loading saved spot ${place.label}...`
  });
}

async function searchForPlace(query) {
  setBusy(true);
  setStatus(`Searching for "${query}"...`);
  clearSearchResults();

  try {
    const results = await fetchGeocoding(query);
    if (!results.length) {
      setStatus(`No place matched "${query}". Try a city, town, or region.`, "error");
      return;
    }

    state.searchResults = results;

    if (results.length === 1) {
      await loadPlace(results[0], {
        statusCopy: `Found ${results[0].label}. Loading radar...`,
        keepBusyState: true
      });
      return;
    }

    renderSearchResults(results);
    setStatus(`Select the best match for "${query}".`, "success");
  } catch (error) {
    setStatus("Place search failed. Check your connection and try again.", "error");
  } finally {
    setBusy(false);
  }
}

async function loadPlace(place, options = {}) {
  const {
    statusCopy = `Loading ${place.label || "this place"}...`,
    keepBusyState = false
  } = options;

  if (!keepBusyState) {
    setBusy(true);
  }

  setStatus(statusCopy);

  try {
    const needsReverseLookup =
      !place.region && !place.country && (place.label === "Current location" || !place.label);

    const reversePromise = needsReverseLookup
      ? fetchReverseGeocode(place.latitude, place.longitude)
      : Promise.resolve(null);
    const forecastPromise = fetchForecast(place.latitude, place.longitude, place.timezone);

    const [reverseData, forecast] = await Promise.all([reversePromise, forecastPromise]);

    const resolvedPlace = enrichPlace(place, reverseData, forecast.timezone);
    const sunData = await fetchSunData(
      resolvedPlace.latitude,
      resolvedPlace.longitude,
      resolvedPlace.timezone,
      forecast
    );

    const payload = buildRadarPayload(resolvedPlace, forecast, sunData);

    state.currentPlace = resolvedPlace;
    state.currentPayload = payload;

    renderOverview(payload);
    renderRecommendations(payload.recommendations);
    renderTimeline(payload.timeline);
    syncQueryString(resolvedPlace);

    dom.saveButton.disabled = false;
    dom.shareButton.disabled = false;
    dom.placeInput.value = resolvedPlace.label;
    setStatus(payload.summary.statusLine, "success");
  } catch (error) {
    setStatus(
      "Weather data could not be loaded right now. Try another place or try again in a moment.",
      "error"
    );
  } finally {
    if (!keepBusyState) {
      setBusy(false);
    }
  }
}

async function fetchGeocoding(query) {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Geocoding request failed.");
  }

  const data = await response.json();
  return (data.results || []).map((item) => ({
    label: buildLocationLabel(item.name, item.admin1, item.country),
    region: item.admin1 || "",
    country: item.country || "",
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || "",
    precision: "Search result"
  }));
}

async function fetchForecast(latitude, longitude, timezone = "auto") {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "is_day",
      "wind_speed_10m",
      "cloud_cover",
      "precipitation",
      "relative_humidity_2m"
    ].join(",")
  );
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "apparent_temperature",
      "precipitation_probability",
      "cloud_cover",
      "wind_speed_10m",
      "weather_code",
      "visibility",
      "is_day",
      "relative_humidity_2m"
    ].join(",")
  );
  url.searchParams.set(
    "daily",
    [
      "sunrise",
      "sunset",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "uv_index_max"
    ].join(",")
  );
  url.searchParams.set("timezone", timezone || "auto");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("timeformat", "unixtime");
  url.searchParams.set("forecast_days", "3");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Forecast request failed.");
  }

  return response.json();
}

async function fetchSunData(latitude, longitude, timezone, forecast) {
  const url = new URL(SUN_ENDPOINT);
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lng", longitude);
  url.searchParams.set("formatted", "0");
  url.searchParams.set("tzid", timezone || forecast.timezone || "UTC");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Sun request failed.");
    }

    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error("Sun API returned a non-OK status.");
    }

    return {
      sunrise: Date.parse(data.results.sunrise),
      sunset: Date.parse(data.results.sunset),
      civilBegin: Date.parse(data.results.civil_twilight_begin),
      civilEnd: Date.parse(data.results.civil_twilight_end),
      dayLengthSeconds: Number(data.results.day_length) || 0,
      source: "Sunrise-Sunset API"
    };
  } catch (error) {
    const fallbackSunrise = forecast.daily?.sunrise?.[0];
    const fallbackSunset = forecast.daily?.sunset?.[0];

    return {
      sunrise: fallbackSunrise ? fallbackSunrise * 1000 : null,
      sunset: fallbackSunset ? fallbackSunset * 1000 : null,
      civilBegin: fallbackSunrise ? fallbackSunrise * 1000 - 35 * 60 * 1000 : null,
      civilEnd: fallbackSunset ? fallbackSunset * 1000 + 35 * 60 * 1000 : null,
      dayLengthSeconds:
        fallbackSunrise && fallbackSunset ? fallbackSunset - fallbackSunrise : 0,
      source: "Open-Meteo fallback"
    };
  }
}

async function fetchReverseGeocode(latitude, longitude) {
  const url = new URL(REVERSE_ENDPOINT);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("localityLanguage", "en");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Reverse geocoding request failed.");
  }

  return response.json();
}

function buildRadarPayload(place, forecast, sunData) {
  const timezone = place.timezone || forecast.timezone || "UTC";
  const hourlyEntries = buildHourlyEntries(forecast);
  const solarDays = buildSolarDays(forecast, sunData);
  const now = Date.now();
  const currentEntry =
    hourlyEntries.find((entry) => Math.abs(entry.timestamp - now) < 60 * 60 * 1000) ||
    hourlyEntries[0];

  const recommendations = buildRecommendations(hourlyEntries, solarDays, timezone);
  const bestUpcoming = recommendations.reduce((best, item) => {
    return item.score > best.score ? item : best;
  }, recommendations[0]);

  const adventureScore = Math.round(
    clamp(
      (scoreComfortWalk(currentEntry) +
        scoreGoldenHour(currentEntry, solarDays) +
        scoreNightReset(currentEntry, solarDays)) /
        3
    )
  );

  const adventureState = adventureStateLabel(adventureScore);
  const phase = getPhase(now, sunData);
  const timeline = hourlyEntries.slice(0, 12).map((entry) => ({
    time: formatShortTime(entry.timestamp, timezone),
    temperature: `${Math.round(entry.temperature)} F`,
    summary: WEATHER_LABELS[entry.weatherCode] || "Unlisted weather",
    meta: `${Math.round(entry.precipitationProbability)}% rain | ${Math.round(entry.cloudCover)}% clouds`
  }));

  return {
    place,
    forecast,
    sunData,
    timezone,
    currentEntry,
    recommendations,
    timeline,
    summary: {
      adventureScore,
      adventureState,
      condition: WEATHER_LABELS[forecast.current.weather_code] || "Current weather",
      conditionDetail: `${Math.round(forecast.current.wind_speed_10m)} mph wind | ${Math.round(
        forecast.current.cloud_cover
      )}% clouds`,
      temperature: `${Math.round(forecast.current.temperature_2m)} F`,
      feelsLike: `Feels like ${Math.round(forecast.current.apparent_temperature)} F`,
      phaseLabel: phase.label,
      phaseDetail: phase.detail,
      bestMoveLabel: bestUpcoming.title,
      bestMoveDetail: `${bestUpcoming.whenLabel} | score ${bestUpcoming.score}`,
      sunrise: sunData.sunrise ? formatClock(sunData.sunrise, timezone) : "Unavailable",
      sunset: sunData.sunset ? formatClock(sunData.sunset, timezone) : "Unavailable",
      blueHour: buildBlueHourLabel(sunData, timezone),
      dayLength: formatDuration(sunData.dayLengthSeconds),
      sunNote: `${phase.note} Solar data source: ${sunData.source}.`,
      advice: buildAdvice(adventureScore, bestUpcoming),
      statusLine: `Loaded ${place.label}. ${buildAdvice(adventureScore, bestUpcoming)}`
    }
  };
}

function buildHourlyEntries(forecast) {
  const hourly = forecast.hourly;
  const entries = hourly.time.map((timestamp, index) => ({
    timestamp: timestamp * 1000,
    temperature: hourly.temperature_2m[index],
    apparentTemperature: hourly.apparent_temperature[index],
    precipitationProbability: hourly.precipitation_probability[index] ?? 0,
    cloudCover: hourly.cloud_cover[index] ?? 0,
    windSpeed: hourly.wind_speed_10m[index] ?? 0,
    weatherCode: hourly.weather_code[index],
    visibility: hourly.visibility[index] ?? null,
    isDay: hourly.is_day[index] === 1,
    humidity: hourly.relative_humidity_2m[index] ?? null
  }));

  return entries.filter((entry) => entry.timestamp >= Date.now() - 45 * 60 * 1000);
}

function buildSolarDays(forecast, sunData) {
  const sunrises = forecast.daily?.sunrise || [];
  const sunsets = forecast.daily?.sunset || [];
  const solarDays = sunrises
    .map((sunrise, index) => {
      const sunset = sunsets[index];
      if (!sunrise || !sunset) {
        return null;
      }

      return {
        sunrise: sunrise * 1000,
        sunset: sunset * 1000,
        civilBegin: sunrise * 1000 - 35 * 60 * 1000,
        civilEnd: sunset * 1000 + 35 * 60 * 1000
      };
    })
    .filter(Boolean);

  if (solarDays[0] && sunData.sunrise && sunData.sunset) {
    solarDays[0] = {
      sunrise: sunData.sunrise,
      sunset: sunData.sunset,
      civilBegin: sunData.civilBegin || solarDays[0].civilBegin,
      civilEnd: sunData.civilEnd || solarDays[0].civilEnd
    };
  }

  return solarDays;
}

function getSolarWindow(timestamp, solarDays) {
  if (!solarDays.length) {
    return null;
  }

  return (
    solarDays.find(
      (day) =>
        timestamp >= day.sunrise - 6 * 60 * 60 * 1000 &&
        timestamp < day.sunset + 12 * 60 * 60 * 1000
    ) || solarDays[solarDays.length - 1]
  );
}

function buildRecommendations(hourlyEntries, solarDays, timezone) {
  const windowEntries = hourlyEntries.slice(0, 24);
  const configs = [
    {
      key: "comfort",
      tone: "cool",
      kicker: "Low friction",
      title: "Comfort walk",
      scorer: scoreComfortWalk,
      explainer: explainComfortWalk
    },
    {
      key: "golden",
      tone: "warm",
      kicker: "Best light",
      title: "Golden-hour photo run",
      scorer: (entry) => scoreGoldenHour(entry, solarDays),
      explainer: explainGoldenHour
    },
    {
      key: "night",
      tone: "night",
      kicker: "Quiet reset",
      title: "Night-sky breather",
      scorer: (entry) => scoreNightReset(entry, solarDays),
      explainer: explainNightReset
    }
  ];

  return configs.map((config) => {
    const ranked = windowEntries
      .map((entry) => ({ entry, score: Math.round(config.scorer(entry)) }))
      .sort((left, right) => right.score - left.score);

    const winner = ranked[0];
    return {
      key: config.key,
      title: config.title,
      kicker: config.kicker,
      tone: config.tone,
      score: winner.score,
      whenLabel: buildSlotLabel(winner.entry.timestamp, timezone),
      detail: config.explainer(winner.entry, winner.score),
      meta: `${Math.round(winner.entry.temperature)} F | ${Math.round(
        winner.entry.precipitationProbability
      )}% rain | ${Math.round(winner.entry.windSpeed)} mph wind`
    };
  });
}

function scoreComfortWalk(entry) {
  const temperaturePenalty = Math.min(44, Math.abs(entry.apparentTemperature - 68) * 1.4);
  const rainPenalty = entry.precipitationProbability * 0.45;
  const windPenalty = Math.max(0, entry.windSpeed - 8) * 2.4;
  const cloudPenalty = Math.max(0, entry.cloudCover - 85) * 0.2;
  const dayBonus = entry.isDay ? 8 : -8;
  return clamp(100 - temperaturePenalty - rainPenalty - windPenalty - cloudPenalty + dayBonus);
}

function scoreGoldenHour(entry, solarDays) {
  const solarWindow = getSolarWindow(entry.timestamp, solarDays);
  if (!solarWindow?.sunrise || !solarWindow?.sunset) {
    return clamp(scoreComfortWalk(entry) - 18);
  }

  const morningDistance = Math.abs(entry.timestamp - solarWindow.sunrise) / 60000;
  const eveningDistance = Math.abs(entry.timestamp - solarWindow.sunset) / 60000;
  const closestWindow = Math.min(morningDistance, eveningDistance);
  const timingScore = clamp(42 - closestWindow * 0.4);
  const cloudScore = clamp(28 - Math.abs(entry.cloudCover - 32) * 0.45);
  const rainPenalty = entry.precipitationProbability * 0.55;
  const windPenalty = Math.max(0, entry.windSpeed - 9) * 2.1;
  const lightPenalty = entry.isDay ? 0 : 18;

  return clamp(26 + timingScore + cloudScore - rainPenalty - windPenalty - lightPenalty);
}

function scoreNightReset(entry, solarDays) {
  const solarWindow = getSolarWindow(entry.timestamp, solarDays);
  const isNight =
    solarWindow?.civilBegin && solarWindow?.sunset
      ? entry.timestamp >= solarWindow.sunset || entry.timestamp <= solarWindow.civilBegin
      : !entry.isDay;
  const nightBonus = isNight ? 28 : -12;
  const cloudPenalty = entry.cloudCover * 0.55;
  const rainPenalty = entry.precipitationProbability * 0.45;
  const windPenalty = Math.max(0, entry.windSpeed - 7) * 1.8;
  const comfortPenalty = Math.abs(entry.apparentTemperature - 58) * 0.8;

  return clamp(78 + nightBonus - cloudPenalty - rainPenalty - windPenalty - comfortPenalty);
}

function explainComfortWalk(entry, score) {
  if (score >= 78) {
    return "Easy temperature, manageable wind, and low enough rain risk for a low-drama reset.";
  }

  if (score >= 58) {
    return "Decent for a short walk, but the weather still asks for some compromise.";
  }

  return "This is more of a quick errand window than a long outdoor stroll.";
}

function explainGoldenHour(entry, score) {
  if (score >= 76) {
    return "The light timing is strong and the cloud cover should add texture instead of flattening the sky.";
  }

  if (score >= 54) {
    return "There is still a usable photo window here, but the weather will dull some of the drama.";
  }

  return "Only worth chasing if you are nearby and already in the mood to improvise.";
}

function explainNightReset(entry, score) {
  if (score >= 72) {
    return "Clear enough skies and calmer wind make this the cleanest late-day reset window.";
  }

  if (score >= 52) {
    return "A passable evening slot, though clouds or wind will steal some of the atmosphere.";
  }

  return "The night air is available, but the sky is not doing you any favors.";
}

function renderOverview(payload) {
  const { place, summary } = payload;

  dom.placeLabel.textContent = place.label;
  dom.precisionChip.textContent = place.precision || "Loaded";
  dom.summaryAdvice.textContent = summary.advice;
  dom.adventureScore.textContent = summary.adventureScore;
  dom.adventureState.textContent = summary.adventureState;
  dom.meterFill.style.width = `${summary.adventureScore}%`;
  dom.conditionLabel.textContent = summary.condition;
  dom.conditionDetail.textContent = summary.conditionDetail;
  dom.temperatureLabel.textContent = summary.temperature;
  dom.feelsLikeLabel.textContent = summary.feelsLike;
  dom.phaseLabel.textContent = summary.phaseLabel;
  dom.phaseDetail.textContent = summary.phaseDetail;
  dom.bestMoveLabel.textContent = summary.bestMoveLabel;
  dom.bestMoveDetail.textContent = summary.bestMoveDetail;
  dom.sunriseLabel.textContent = summary.sunrise;
  dom.sunsetLabel.textContent = summary.sunset;
  dom.blueHourLabel.textContent = summary.blueHour;
  dom.dayLengthLabel.textContent = summary.dayLength;
  dom.sunNote.textContent = summary.sunNote;
}

function renderRecommendations(recommendations) {
  dom.recommendations.innerHTML = recommendations
    .map(
      (item) => `
        <article class="mission-card" data-tone="${item.tone}">
          <div class="mission-top">
            <div>
              <p class="mission-kicker">${escapeHtml(item.kicker)}</p>
              <h3 class="mission-title">${escapeHtml(item.title)}</h3>
            </div>
            <div class="mission-score">${item.score}</div>
          </div>
          <p class="mission-time">${escapeHtml(item.whenLabel)}</p>
          <p class="mission-copy">${escapeHtml(item.detail)}</p>
          <p class="mission-meta">${escapeHtml(item.meta)}</p>
        </article>
      `
    )
    .join("");
}

function renderTimeline(timelineItems) {
  dom.timeline.innerHTML = timelineItems
    .map(
      (item) => `
        <article class="timeline-card">
          <p class="timeline-time">${escapeHtml(item.time)}</p>
          <p class="timeline-temp">${escapeHtml(item.temperature)}</p>
          <p class="timeline-copy">${escapeHtml(item.summary)}</p>
          <p class="timeline-meta">${escapeHtml(item.meta)}</p>
        </article>
      `
    )
    .join("");
}

function renderSearchResults(results) {
  dom.searchResults.innerHTML = results
    .map(
      (result, index) => `
        <li>
          <button type="button" class="result-button" data-result-index="${index}">
            <span class="result-meta">
              <span class="result-title">${escapeHtml(result.label)}</span>
              <span class="result-subtitle">${roundCoordinate(result.latitude)}, ${roundCoordinate(
                result.longitude
              )}</span>
            </span>
            <span class="chip subtle-chip">Load</span>
          </button>
        </li>
      `
    )
    .join("");
}

function renderSavedPlaces() {
  if (!state.savedPlaces.length) {
    dom.savedEmpty.hidden = false;
    dom.savedPlaces.innerHTML = "";
    return;
  }

  dom.savedEmpty.hidden = true;
  dom.savedPlaces.innerHTML = state.savedPlaces
    .map(
      (place, index) => `
        <article class="saved-card">
          <div class="saved-card-header">
            <div>
              <p class="saved-title">${escapeHtml(place.label)}</p>
              <p class="saved-subtitle">${escapeHtml(
                [place.region, place.country].filter(Boolean).join(" / ") || "Saved place"
              )}</p>
            </div>
            <button type="button" data-delete-index="${index}" aria-label="Remove ${escapeHtml(
              place.label
            )}">
              Remove
            </button>
          </div>
          <button type="button" data-saved-index="${index}">
            Load this spot
          </button>
        </article>
      `
    )
    .join("");
}

function clearSearchResults() {
  state.searchResults = [];
  dom.searchResults.innerHTML = "";
}

function setStatus(message, tone = "info") {
  dom.statusMessage.textContent = message;
  dom.statusMessage.dataset.tone = tone;
}

function setBusy(isBusy) {
  state.isBusy = isBusy;
  dom.searchForm.querySelector('button[type="submit"]').disabled = isBusy;
  dom.locationButton.disabled = isBusy;
  if (state.recognition) {
    dom.voiceButton.disabled = isBusy;
  }
}

function persistSavedPlaces() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedPlaces));
}

function loadSavedPlaces() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function placeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return {
    label: params.get("label") || "Shared place",
    latitude: lat,
    longitude: lon,
    region: params.get("region") || "",
    country: params.get("country") || "",
    timezone: params.get("tz") || "",
    precision: "Shared link"
  };
}

function syncQueryString(place) {
  const url = new URL(window.location.href);
  url.searchParams.set("lat", roundCoordinate(place.latitude, 4));
  url.searchParams.set("lon", roundCoordinate(place.longitude, 4));
  url.searchParams.set("label", place.label);

  if (place.region) {
    url.searchParams.set("region", place.region);
  } else {
    url.searchParams.delete("region");
  }

  if (place.country) {
    url.searchParams.set("country", place.country);
  } else {
    url.searchParams.delete("country");
  }

  if (place.timezone) {
    url.searchParams.set("tz", place.timezone);
  } else {
    url.searchParams.delete("tz");
  }

  window.history.replaceState({}, "", url);
}

function enrichPlace(place, reverseData, forecastTimezone) {
  const region = place.region || reverseData?.principalSubdivision || "";
  const country = place.country || reverseData?.countryName || "";
  const locality = reverseData?.city || reverseData?.locality || "";

  return {
    ...place,
    label:
      place.label && place.label !== "Current location"
        ? place.label
        : buildLocationLabel(locality || "Current location", region, country),
    region,
    country,
    timezone: place.timezone || forecastTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    precision:
      place.precision ||
      (reverseData?.lookupSource === "reverseGeocoding"
        ? "Precise device location"
        : "Approximate location")
  };
}

function buildAdvice(score, bestUpcoming) {
  if (score >= 76) {
    return `Right now has real momentum. If you head out, ${bestUpcoming.title.toLowerCase()} is the strongest play.`;
  }

  if (bestUpcoming.score >= 70) {
    return `Conditions improve soon. ${bestUpcoming.title} peaks ${bestUpcoming.whenLabel.toLowerCase()}.`;
  }

  if (bestUpcoming.score >= 52) {
    return "The day is usable, just not effortless. Pick your timing instead of wandering out blindly.";
  }

  return "Today is more about short windows than long plans. Stay flexible and keep the radar handy.";
}

function getPhase(now, sunData) {
  const sunrise = sunData.sunrise;
  const sunset = sunData.sunset;
  const civilBegin = sunData.civilBegin;
  const civilEnd = sunData.civilEnd;

  if (!sunrise || !sunset) {
    return {
      label: "Sun data fallback",
      detail: "Using forecast timing instead of live twilight data.",
      note: "Sunrise and sunset came from the weather forecast fallback."
    };
  }

  const morningGoldEnd = sunrise + 75 * 60 * 1000;
  const eveningGoldStart = sunset - 75 * 60 * 1000;

  if (civilBegin && now < sunrise && now >= civilBegin) {
    return {
      label: "Morning blue hour",
      detail: "Soft pre-sunrise light is active.",
      note: "The light is subtle right now, which is useful for low-contrast scenes."
    };
  }

  if (now >= sunrise && now <= morningGoldEnd) {
    return {
      label: "Morning golden hour",
      detail: "Warm light is still on the table.",
      note: "This is one of the best windows for portraits, street photos, and calm walks."
    };
  }

  if (now > morningGoldEnd && now < eveningGoldStart) {
    return {
      label: "Daylight",
      detail: "Clean visibility, flatter light.",
      note: "The radar now leans more on comfort than cinematic timing."
    };
  }

  if (now >= eveningGoldStart && now <= sunset) {
    return {
      label: "Evening golden hour",
      detail: "Warmest light of the day.",
      note: "If you want drama with minimal planning, this is the chase window."
    };
  }

  if (civilEnd && now > sunset && now <= civilEnd) {
    return {
      label: "Evening blue hour",
      detail: "The sky is cooling into deep blues.",
      note: "This is usually the best short stretch for city lights and reflective surfaces."
    };
  }

  return {
    label: "Night",
    detail: "Direct sun is off the table.",
    note: "The radar now favors calm air and clearer skies over warmth."
  };
}

function buildBlueHourLabel(sunData, timezone) {
  if (!sunData.civilEnd || !sunData.sunset) {
    return "Approximate";
  }

  return `${formatClock(sunData.sunset, timezone)} to ${formatClock(sunData.civilEnd, timezone)}`;
}

function formatClock(timestamp, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(timestamp);
}

function formatShortTime(timestamp, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    timeZone: timezone
  }).format(timestamp);
}

function buildSlotLabel(timestamp, timezone) {
  const dayLabel = isTomorrow(timestamp, timezone) ? "Tomorrow" : "Today";
  return `${dayLabel}, ${formatClock(timestamp, timezone)}`;
}

function isTomorrow(timestamp, timezone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const today = formatter.format(Date.now());
  const target = formatter.format(timestamp);
  return today !== target;
}

function formatDuration(seconds) {
  if (!seconds) {
    return "Unavailable";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function buildLocationLabel(name, region, country) {
  return [name, region, country].filter(Boolean).filter(uniqueOnly).join(", ");
}

function uniqueOnly(value, index, array) {
  return array.indexOf(value) === index;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[character];
  });
}

function roundCoordinate(value, decimals = 3) {
  return Number(value).toFixed(decimals);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function adventureStateLabel(score) {
  if (score >= 78) {
    return "Go now";
  }

  if (score >= 60) {
    return "Worth timing";
  }

  if (score >= 42) {
    return "Selective";
  }

  return "Mostly indoors";
}

function geolocationErrorMessage(error) {
  switch (error.code) {
    case 1:
      return "Location access was denied. Search manually or use voice search instead.";
    case 2:
      return "Your device could not determine a location. Try again or search manually.";
    case 3:
      return "Location lookup timed out. Try again or type a place instead.";
    default:
      return "Location lookup failed. Search manually or try again.";
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      reject,
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 10 * 1000
      }
    );
  });
}
