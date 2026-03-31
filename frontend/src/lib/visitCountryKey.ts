import type { CountryProps } from "../types/country";

export function countryVisitKey(props: CountryProps): string {
  return props.ADM0_A3;
}
