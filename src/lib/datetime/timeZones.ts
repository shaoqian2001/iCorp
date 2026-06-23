// Helpers for the IANA time-zone list and the viewer's local zone.

const FALLBACK_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

type IntlWithSupported = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

export function localTimeZone(): string {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function listTimeZones(): string[] {
  const intl = Intl as IntlWithSupported;
  if (typeof intl.supportedValuesOf === "function") {
    try {
      const zones = intl.supportedValuesOf("timeZone");
      if (zones.length > 0) return zones;
    } catch {
      /* not supported — use the fallback list */
    }
  }
  return FALLBACK_ZONES;
}
