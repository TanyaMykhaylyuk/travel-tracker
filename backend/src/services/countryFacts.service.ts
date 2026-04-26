import { CountryFactModel } from "../models/CountryFact";
import { HttpError } from "../utils/httpError";
import { escapeRegExp } from "../utils/validation";

export type CountryFactsResponse = {
  countryName: string;
  facts: string[];
};

export async function getCountryFactsByCountryName(
  normalizedName: string
): Promise<CountryFactsResponse> {
  const doc = await CountryFactModel.findOne({
    countryName: {
      $regex: `^${escapeRegExp(normalizedName)}$`,
      $options: "i",
    },
  }).lean();

  if (!doc) {
    throw new HttpError(404, "Not found");
  }

  return {
    countryName: doc.countryName,
    facts: doc.facts ?? [],
  };
}
