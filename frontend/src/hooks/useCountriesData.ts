import { useEffect, useState } from "react";
import { loadCountriesData } from "../lib/countries/loadCountriesData";
import type { CountriesData } from "../types/country";

export function useCountriesData(): CountriesData {
  const [countries, setCountries] = useState<CountriesData>({ features: [] });

  useEffect(() => {
    void loadCountriesData().then(setCountries);
  }, []);

  return countries;
}
