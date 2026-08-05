import { z } from "zod";
import { text, uuid } from "./common";

/** sendMessage(conversationId, body) */
export const sendMessageSchema = z.object({
  conversationId: uuid,
  body: text(1000),
});

/** markConversationRead(conversationId) */
export const markConversationReadSchema = uuid;
