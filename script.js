const apiKey = "54c97255a7876f103ea635bc8cd671d9";

const cityInput = document.getElementById("city_input");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const currentWeatherTemp = document.querySelector(".current-weather h2");
const weatherIcon = document.querySelector(".weather-icon img");
const humidityVal = document.getElementById("humidityVal");
const pressureVal = document.getElementById("pressureVal");
const visibilityVal = document.getElementById("visibilityVal");
const windspeedVal = document.getElementById("windspeedVal");
const feelslikeVal = document.getElementById("feelslikeVal");
const sunriseTime = document.querySelector(".sunrise-sunset .item:nth-child(1) h2");
const sunsetTime = document.querySelector(".sunrise-sunset .item:nth-child(2) h2");
const todayAtContainer = document.querySelector(".hourly-forecast");
const forecastContainer = document.querySelector(".day-forecast");
const airQuality = document.querySelector(".air-index");
const aqiItems = document.querySelectorAll(".air-indices .item h2");
const cardFooterDate = document.querySelector(".card-footer p:first-child");

function showLoading() {
  currentWeatherTemp.textContent = "Loading...";
  forecastContainer.innerHTML = "";
  todayAtContainer.innerHTML = "";
}

function handleError(message = "Something went wrong!") {
  alert(message);
  currentWeatherTemp.textContent = "--°C";
}

async function fetchWeatherByCity(city) {
  try {
    showLoading();
    const [currentWeather, forecast] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`).then(r => r.json()),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`).then(r => r.json()),
    ]);

    if (currentWeather.cod !== 200) {
      handleError(currentWeather.message || "City not found!");
      return;
    }

    displayWeather(currentWeather);
    displayForecast(forecast);
    displayHourlyForecast(forecast);
    fetchAQI(currentWeather.coord.lat, currentWeather.coord.lon);
  } catch (err) {
    handleError("Unable to fetch data.");
  }
}

function fetchWeatherByLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported!");
    return;
  }

  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      showLoading();
      const [currentWeather, forecast] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&appid=${apiKey}`).then(r => r.json()),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&appid=${apiKey}`).then(r => r.json()),
      ]);

      displayWeather(currentWeather);
      displayForecast(forecast);
      displayHourlyForecast(forecast);
      fetchAQI(coords.latitude, coords.longitude);
    } catch {
      handleError("Failed to fetch location weather.");
    }
  }, () => handleError("Permission denied."));
}

function displayWeather(data) {
  const { main, weather, wind, visibility, sys, name } = data;

  currentWeatherTemp.textContent = `${Math.round(main.temp)}°C`;
  weatherIcon.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
  humidityVal.textContent = `${main.humidity}%`;
  pressureVal.textContent = `${main.pressure} hPa`;
  visibilityVal.textContent = `${(visibility / 1000).toFixed(1)} km`;
  windspeedVal.textContent = `${wind.speed} m/s`;
  feelslikeVal.textContent = `${Math.round(main.feels_like)}°C`;
  document.querySelector(".details p:last-child").textContent = name;

  sunriseTime.textContent = new Date(sys.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  sunsetTime.textContent = new Date(sys.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  cardFooterDate.textContent = new Date().toDateString();

  // Update background based on weather
  document.body.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${weather[0].main},weather')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
}

function displayForecast(data) {
  forecastContainer.innerHTML = "";
  const filtered = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  filtered.forEach(day => {
    const el = document.createElement("div");
    el.className = "forecast-item";

    el.innerHTML = `
      <div class="icon-wrapper">
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
        <span>${Math.round(day.main.temp)}°C</span>
      </div>
      <p>${new Date(day.dt_txt).toDateString()}</p>
      <p>${day.weather[0].description}</p>
    `;
    forecastContainer.appendChild(el);
  });
}

function displayHourlyForecast(data) {
  todayAtContainer.innerHTML = "";
  const today = new Date().toISOString().split("T")[0];
  const hourly = data.list.filter(item => item.dt_txt.startsWith(today));

  hourly.forEach(hour => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p>${new Date(hour.dt_txt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="">
      <p>${Math.round(hour.main.temp)}°C</p>
    `;
    todayAtContainer.appendChild(div);
  });
}

// Fetch and display AQI
async function fetchAQI(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const { list } = await res.json();
    const aqi = list[0].main.aqi;
    const components = list[0].components;

    airQuality.textContent = ["Good", "Fair", "Moderate", "Poor", "Very Poor"][aqi - 1];
    airQuality.className = `air-index aqi-${aqi}`;

    const values = ["pm2_5", "pm10", "so2", "co", "no", "no2", "nh3", "o3"];
    values.forEach((key, i) => {
      if (aqiItems[i]) aqiItems[i].textContent = `${components[key]} µg/m³`;
    });
  } catch {
    airQuality.textContent = "N/A";
  }
}

// Event listeners
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) fetchWeatherByCity(city);
  else alert("Please enter a city!");
});

locationBtn.addEventListener("click", fetchWeatherByLocation);

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});
