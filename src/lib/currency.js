const fallbackCurrencies = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL",
  "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY",
  "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP",
  "ERN", "ETB", "EUR", "FJD", "GBP", "GEL", "GHS", "GMD", "GNF", "GTQ",
  "HKD", "HNL", "HRK", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR",
  "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KRW", "KWD",
  "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA",
  "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR",
  "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN",
  "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF",
  "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SLE", "SOS", "SRD", "SSP",
  "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD",
  "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VES", "VND", "VUV",
  "WST", "XAF", "XCD", "XOF", "XPF", "YER", "ZAR", "ZMW",
];

export function getCurrencyOptions() {
  let codes = fallbackCurrencies;
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      codes = [...new Set([...Intl.supportedValuesOf("currency"), ...fallbackCurrencies])];
    } catch (error) {
      console.warn("Unable to load the browser's complete currency list; using the built-in list.", error);
    }
  }

  const names = typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(undefined, { type: "currency" })
    : null;

  return codes
    .map((code) => {
      try {
        const label = names?.of(code);
        return { code, label: label && label !== code ? `${code} — ${label}` : code };
      } catch {
        return { code, label: code };
      }
    })
    .sort((left, right) => left.code.localeCompare(right.code));
}

export async function fetchPkrExchangeRate(baseCurrency, signal) {
  const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`, { signal });
  if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}.`);

  const data = await response.json();
  const rate = Number(data.rates?.PKR);
  if (data.result !== "success" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("A PKR exchange rate is not available for this currency.");
  }
  return { rate, updatedAt: data.time_last_update_utc };
}
