import AppRoutes from "./routes/AppRoutes";
import ServerDown from "./components/ServerDown/ServerDown";
import { API_BASE_URL } from "./config/config";
import "./App.css";
import { useCallback, useEffect, useState } from "react";

function App() {
    const [isServerDown, setIsServerDown] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // Check whether the backend server is running
    const checkHealth = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        // Create controller to cancel the request if it takes too long
        const controller = new AbortController();
        // Stop the request after 3 seconds
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 3000);
        try {

            const response = await fetch(
                `${API_BASE_URL}/health`,
                {
                    signal: controller.signal,
                }
            );
            if (response.ok) {
                setIsServerDown(false);
            }
            else {
                setIsServerDown(true);
            }
        }
        catch (error) {

            // Backend is unreachable
            // Example: server is not running
            setIsServerDown(true);

        }
        finally {
          clearTimeout(timeoutId);
            setIsLoading(false);
       }

    }, []);

    // Run health check when the application starts
    useEffect(() => {
        checkHealth();
    }, [checkHealth]);

    // Show loading screen while checking the backend
    if (isLoading) {
        return (
            <div className="loading-screen">
                Connecting to server...
            </div>
        );
    }

    // Show server-down page if the backend is unavailable
    if (isServerDown) {
        return (
            <ServerDown
                onRetry={checkHealth}
            />
        );
    }

    return (

                <AppRoutes />
    );
}


export default App;
