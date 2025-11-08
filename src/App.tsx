/** @format */

import { ThemeProvider } from "@/components/themes/theme-provider";
import { ModeToggle } from "@/components/themes/theme-toggle";
import { Button } from "./components/ui/button";

function App() {
    return (
        <ThemeProvider
            defaultTheme="dark"
            storageKey="vite-ui-theme"
        >
            <div className="flex min-h-svh flex-col items-center justify-center">
                <div className="absolute top-4 right-4">
                    <ModeToggle />
                </div>
                <Button>Click me</Button>
            </div>
        </ThemeProvider>
    );
}

export default App;
