/** @format */

import { AutoGuestSignIn } from "./AutoGuestSignIn";

export function SignedOutView() {
    return (
        <>
            <AutoGuestSignIn />
            <div className="font-mono min-h-screen flex justify-center items-center pt-8">
                <div>Signing in...</div>
            </div>
        </>
    );
}
