"use client";

import { useEffect, useMemo, useState } from "react";

type WeatherState = {
  locationLabel: string;
  temperature: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  loading: boolean;
  error: boolean;
};

const DEFAULT_LOCATIONS = [
  {
    label: "서울",
    latitude: 37.5665,
    longitude: 126.978,
    timezone: "Asia/Seoul",
  },
  {
    label: "부산",
    latitude: 35.1796,
    longitude: 129.0756,
    timezone: "Asia/Seoul",
  },
  {
    label: "대구",
    latitude: 35.8714,
    longitude: 128.6014,
    timezone: "Asia/Seoul",
  },
  {
    label: "광주",
    latitude: 35.1595,
    longitude: 126.8526,
    timezone: "Asia/Seoul",
  },
  {
    label: "대전",
    latitude: 36.3504,
    longitude: 127.3845,
    timezone: "Asia/Seoul",
  },
  {
    label: "인천",
    latitude: 37.4563,
    longitude: 126.7052,
    timezone: "Asia/Seoul",
  },
];

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "부분적으로 흐림",
  3: "흐림",
  45: "안개",
  48: "안개",
  51: "이슬비",
  53: "이슬비",
  55: "이슬비",
  56: "어는 이슬비",
  57: "어는 이슬비",
  61: "비",
  63: "비",
  65: "강한 비",
  66: "어는 비",
  67: "어는 비",
  71: "눈",
  73: "눈",
  75: "강한 눈",
  77: "싸락눈",
  80: "소나기",
  81: "소나기",
  82: "강한 소나기",
  85: "눈 소나기",
  86: "강한 눈 소나기",
  95: "천둥번개",
  96: "우박 가능",
  99: "강한 우박",
};

const WEATHER_CODE_ICON: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅️",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌦️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "❄️",
  73: "❄️",
  75: "❄️",
  77: "❄️",
  80: "🌧️",
  81: "🌧️",
  82: "🌧️",
  85: "❄️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

const SLIDE_INTERVAL_MS = 3000;
const SLIDE_HEIGHT_PX = 86;

export default function HomeInfoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [weatherList, setWeatherList] = useState<WeatherState[]>(
    DEFAULT_LOCATIONS.map((location) => ({
      locationLabel: location.label,
      temperature: null,
      weatherCode: null,
      windSpeed: null,
      loading: true,
      error: false,
    })),
  );

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "katopia.home.weather";
    const ttlMs = 10 * 60 * 1000;

    const loadCache = () => {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
          ts: number;
          data: WeatherState[];
        };
        if (!parsed?.ts || !Array.isArray(parsed.data)) return null;
        if (Date.now() - parsed.ts > ttlMs) return null;
        return parsed.data;
      } catch {
        return null;
      }
    };

    const saveCache = (data: WeatherState[]) => {
      if (typeof window === "undefined") return;
      try {
        window.sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ ts: Date.now(), data }),
        );
      } catch {
        // ignore storage errors
      }
    };

    const fetchWeather = async () => {
      const cached = loadCache();
      if (cached) {
        setWeatherList(cached);
        return;
      }

      try {
        const results = await Promise.all(
          DEFAULT_LOCATIONS.map(async (location) => {
            const url = new URL("https://api.open-meteo.com/v1/forecast");
            url.searchParams.set("latitude", String(location.latitude));
            url.searchParams.set("longitude", String(location.longitude));
            url.searchParams.set(
              "current",
              "temperature_2m,weather_code,wind_speed_10m",
            );
            url.searchParams.set("timezone", location.timezone);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error("weather api failed");
            const json = await res.json();
            const current = json.current ?? {};

            return {
              locationLabel: location.label,
              temperature:
                typeof current.temperature_2m === "number"
                  ? Math.round(current.temperature_2m)
                  : null,
              weatherCode:
                typeof current.weather_code === "number"
                  ? current.weather_code
                  : null,
              windSpeed:
                typeof current.wind_speed_10m === "number"
                  ? Math.round(current.wind_speed_10m)
                  : null,
              loading: false,
              error: false,
            };
          }),
        );

        if (cancelled) return;
        setWeatherList(results);
        saveCache(results);
      } catch {
        if (cancelled) return;
        setWeatherList((prev) =>
          prev.map((item) => ({
            ...item,
            loading: false,
            error: true,
          })),
        );
      }
    };

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ko-KR", {
        weekday: "short",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const slides = useMemo(
    () =>
      weatherList.map((weather) => {
        const weatherDescription =
          weather.weatherCode !== null
            ? (WEATHER_CODE_LABELS[weather.weatherCode] ?? "날씨 정보")
            : "날씨 정보";

        const weatherLine = weather.loading
          ? "날씨 불러오는 중..."
          : weather.error
            ? "날씨 정보를 불러오지 못했어요"
            : `${weather.locationLabel} · ${weather.temperature ?? "-"}° · ${weatherDescription}`;

        const weatherDetail =
          !weather.loading && !weather.error && weather.windSpeed !== null
            ? `바람 ${weather.windSpeed}km/h`
            : "오늘도 멋진 하루 보내세요";

        return {
          id: weather.locationLabel,
          title: weather.locationLabel,
          body: weatherLine,
          description: weatherDescription,
          sub: weatherDetail,
          temperature: weather.temperature,
          icon:
            weather.loading || weather.error
              ? "⛅️"
              : (WEATHER_CODE_ICON[weather.weatherCode ?? -1] ?? "🌡️"),
        };
      }),
    [weatherList],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="mt-4 mb-6">
      <div className="relative h-[86px] overflow-hidden rounded-[999px] bg-white/80 backdrop-blur">
        <div
          className="flex h-full flex-col transition-transform duration-500 ease-out"
          style={{
            transform: `translateY(-${activeIndex * SLIDE_HEIGHT_PX}px)`,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="h-[86px] w-full flex-shrink-0 bg-white/80"
            >
              <div className="flex h-full items-center text-black">
                <div className="flex h-full w-[78px] items-center justify-center border-r border-white/30">
                  <span className="text-[30px]" aria-hidden="true">
                    {slide.icon}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-between px-5">
                  <div className="flex items-end gap-2">
                    <p className="text-[30px] font-semibold leading-none">
                      {slide.temperature ?? "--"}
                      <span className="text-[16px] align-top">°</span>
                    </p>
                    <div className="pb-0.5">
                      <p className="text-[14px] font-semibold leading-none">
                        {slide.title}
                      </p>
                      <p className="mt-1 text-[11px] opacity-90">
                        {todayLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
