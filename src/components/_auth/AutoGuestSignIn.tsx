/** @format */

import { useEffect, useState } from "react";
import { db } from "../../lib/db";

export function AutoGuestSignIn() {
    const [hasTriedSignIn, setHasTriedSignIn] = useState(false);

    useEffect(() => {
        if (!hasTriedSignIn) {
            setHasTriedSignIn(true);
            // Try to sign in as guest - if already signed in, this will fail gracefully
            db.auth.signInAsGuest().catch((err) => {
                // Silently ignore errors (user might already be signed in)
                // Only log unexpected errors
                if (
                    err.body?.message &&
                    !err.body.message.includes("already")
                ) {
                    console.error("Failed to sign in as guest:", err);
                }
            });
        }
    }, [hasTriedSignIn]);

    return null;
}

