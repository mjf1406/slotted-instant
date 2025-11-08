/** @format */

import { init } from "@instantdb/react";
import schema from "../instant.schema";

// Instant app
export const APP_ID = "cdcf6566-d180-4c55-a794-1b8ba49af831";
export const GOOGLE_CLIENT_NAME = "google-web";

export const db = init({ appId: APP_ID, schema });
export const room = db.room("todos");

