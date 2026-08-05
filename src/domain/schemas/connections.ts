import { z } from "zod";
import { uuid } from "./common";

/** sendConnectionRequest(addresseeId) */
export const sendConnectionRequestSchema = uuid;

/** respondToConnection(connectionId, status) */
export const respondToConnectionSchema = z.object({
  connectionId: uuid,
  status: z.enum(["accepted", "declined"]),
});

/** removeConnection(connectionId) */
export const removeConnectionSchema = uuid;
