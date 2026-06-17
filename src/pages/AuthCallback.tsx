import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const hash = window.location.hash;
        const isConnecting =
            sessionStorage.getItem("google_calendar_connecting") === "1";

        const run = async () => {
            if (isConnecting && hash.includes("provider_token")) {
                const p = new URLSearchParams(hash.substring(1));
                const providerToken = p.get("provider_token");
                const refreshToken = p.get("provider_refresh_token");
                const expiresIn = p.get("expires_in");

                sessionStorage.removeItem("google_calendar_connecting");

                try {
                    await supabase.functions.invoke("save-google-tokens", {
                        body: {
                            provider_token: providerToken,
                            provider_refresh_token: refreshToken,
                            expires_in: expiresIn ? Number(expiresIn) : null,
                        },
                    });
                    await supabase.functions.invoke("google-calendar-sync");
                } catch (e) {
                    console.error("Google save/sync error:", e);
                }

                navigate("/calendar", { replace: true });
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate("/", { replace: true });
            } else {
                const { data: listener } = supabase.auth.onAuthStateChange((event) => {
                    if (event === "SIGNED_IN") {
                        navigate("/", { replace: true });
                        listener.subscription.unsubscribe();
                    }
                });
            }
        };

        run();
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Завершение входа...</p>
        </div>
    );
}