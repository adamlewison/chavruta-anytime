import { z } from "zod";

/** sendPasscode(email) */
export const sendPasscodeSchema = z.email().max(254);
