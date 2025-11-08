/** @format */

import { db, GOOGLE_CLIENT_NAME } from "./db";
import type { GoogleJWTClaims } from "./types";

export function parseGoogleIdToken(idToken: string): GoogleJWTClaims {
    const base64Url = idToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "="
    );
    const decoded = atob(padded);
    return JSON.parse(decoded) as GoogleJWTClaims;
}

export async function signInWithGoogle(
    credential: string,
    nonce: string
): Promise<void> {
    const claims = parseGoogleIdToken(credential);
    const { user } = await db.auth.signInWithIdToken({
        clientName: GOOGLE_CLIENT_NAME,
        idToken: credential,
        nonce,
    });

    // Check if profile already exists
    const { data } = await db.queryOnce({
        profiles: {
            $: {
                where: { "user.id": user.id },
            },
        },
    });

    const existingProfile = data?.profiles?.[0];

    if (existingProfile) {
        // Update existing profile with Google info
        await db.transact(
            db.tx.profiles[existingProfile.id].update({
                firstName: claims.given_name || existingProfile.firstName,
                lastName: claims.family_name || existingProfile.lastName,
                googlePicture: claims.picture || existingProfile.googlePicture,
            })
        );
    } else {
        // Create new profile for first-time sign-in
        await db.transact(
            db.tx.profiles[user.id]
                .update({
                    firstName: claims.given_name || "",
                    lastName: claims.family_name || "",
                    googlePicture: claims.picture || "",
                    joined: new Date(),
                    plan: "free",
                })
                .link({ user: user.id })
        );
    }
}

