import { Router } from "express";
import * as FaceitController from "./faceit.controller.js";

export const faceitRoutes = Router();

/* ================== POSTs ===================== */
faceitRoutes.post("/import", FaceitController.importFaceitMatchHandler);
faceitRoutes.post("/validate", FaceitController.validateFaceitMatchHandler);
