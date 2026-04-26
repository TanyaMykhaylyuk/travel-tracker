import { Router } from "express";
import { getCountryFactsByName } from "../controllers/countryFacts.controller";

const router = Router();

router.get("/facts/country/name/:countryName", getCountryFactsByName);

export default router;
