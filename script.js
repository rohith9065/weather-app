// Get your free API key from https://openweathermap.org/api
const API_KEY = "0646508393bab3251b1b96f28ca5e091";

let unit = "metric";
let currentData = null;
let forecastData = null;

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const unitToggle = document.getElementById("unitToggle");
const statusText = document.getElementById("status");

searchBtn.addEventListener("click", searchWeather);

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchWeather();
});

locationBtn.addEventListener("click", getCurrentLocation);

unitToggle.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  if (currentData && forecastData) {
    displayCurrentWeather(currentData);
    displayForecast(forecastData);
  }
});

async function searchWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    showStatus("Please enter a city name.");
    return;
  }

  if (API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showStatus("Add your OpenWeatherMap API key in script.js first.");
    return;
  }

  showStatus("Loading weather...");

  try {
    const currentUrl =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${unit}`;

    const forecastUrl =
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${unit}`;

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    if (!currentResponse.ok) {
      throw new Error("City not found.");
    }

    currentData = await currentResponse.json();
    forecastData = await forecastResponse.json();

    displayCurrentWeather(currentData);
    displayForecast(forecastData);
    showStatus("");
  } catch (error) {
    showStatus(error.message || "Unable to get weather data.");
  }
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    showStatus("Geolocation is not supported by this browser.");
    return;
  }

  if (API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showStatus("Add your OpenWeatherMap API key in script.js first.");
    return;
  }

  showStatus("Getting your location...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const currentUrl =
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}`;

        const forecastUrl =
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}`;

        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(currentUrl),
          fetch(forecastUrl)
        ]);

        currentData = await currentResponse.json();
        forecastData = await forecastResponse.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        showStatus("");
      } catch {
        showStatus("Unable to load weather for your location.");
      }
    },
    () => showStatus("Location permission was denied.")
  );
}

function displayCurrentWeather(data) {
  document.getElementById("currentWeather").classList.remove("hidden");
  document.getElementById("forecastSection").classList.remove("hidden");

  const symbol = unit === "metric" ? "°C" : "°F";
  const speed = unit === "metric" ? "m/s" : "mph";

  document.getElementById("location").textContent =
    `${data.name}, ${data.sys.country}`;

  document.getElementById("date").textContent =
    new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });

  document.getElementById("temperature").textContent =
    `${Math.round(data.main.temp)}${symbol}`;

  document.getElementById("description").textContent =
    data.weather[0].description;

  document.getElementById("weatherIcon").src =
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  document.getElementById("feelsLike").textContent =
    `${Math.round(data.main.feels_like)}${symbol}`;

  document.getElementById("humidity").textContent =
    `${data.main.humidity}%`;

  document.getElementById("wind").textContent =
    `${data.wind.speed} ${speed}`;

  document.getElementById("pressure").textContent =
    `${data.main.pressure} hPa`;
}

function displayForecast(data) {
  const forecastContainer = document.getElementById("forecast");
  forecastContainer.innerHTML = "";

  const daily = getDailyForecast(data.list);

  daily.slice(0, 5).forEach((item) => {
    const card = document.createElement("div");
    card.className = "forecast-card";

    const date = new Date(item.dt * 1000);
    const symbol = unit === "metric" ? "°C" : "°F";

    card.innerHTML = `
      <div class="day">${date.toLocaleDateString(undefined, {
        weekday: "short"
      })}</div>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png"
           alt="${item.weather[0].description}">
      <div class="temp">${Math.round(item.main.temp)}${symbol}</div>
      <div class="desc">${item.weather[0].description}</div>
    `;

    forecastContainer.appendChild(card);
  });
}

function getDailyForecast(list) {
  const days = {};

  list.forEach((item) => {
    const date = new Date(item.dt * 1000).toISOString().split("T")[0];

    if (!days[date]) {
      days[date] = item;
    }

    // Prefer the forecast closest to 12:00 PM.
    const hour = new Date(item.dt * 1000).getHours();
    const existingHour = new Date(days[date].dt * 1000).getHours();

    if (Math.abs(hour - 12) < Math.abs(existingHour - 12)) {
      days[date] = item;
    }
  });

  return Object.values(days);
}

function showStatus(message) {
  statusText.textContent = message;
}
