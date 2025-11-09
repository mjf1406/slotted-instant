/** @format */

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { signInWithGoogle } from "@/lib/auth";

// Fallback UUID generator for browsers that don't support crypto.randomUUID
function generateUUID(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID v4 generator
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function GoogleSignInButton() {
    const [nonce] = useState(() => generateUUID());

    return (
        <GoogleLogin
            nonce={nonce}
            onError={() => alert("Login failed")}
            onSuccess={(credentialResponse: { credential?: string }) => {
                const credential = credentialResponse.credential;
                if (!credential) return;
                signInWithGoogle(credential, nonce).catch((err) => {
                    alert("Uh oh: " + (err.body?.message || err.message));
                });
            }}
        />
    );
}
