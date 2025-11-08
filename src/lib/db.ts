/** @format */

import { init } from "@instantdb/react";
import schema from "../instant.schema";

// Instant app
export const APP_ID = "490af9b7-77f6-4564-8668-b5868856eea9";
export const GOOGLE_CLIENT_NAME = "google-web";

export const db = init({ appId: APP_ID, schema });
export const room = db.room("todos");
