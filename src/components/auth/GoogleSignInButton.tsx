/** @format */

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { signInWithGoogle } from "../../lib/auth";

export function GoogleSignInButton() {
    const [nonce] = useState(() => crypto.randomUUID());

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

