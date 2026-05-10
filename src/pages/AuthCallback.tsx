import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase автоматически подхватит access_token из хеша URL
        // и установит сессию. После этого можно идти на главную.
        const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN") {
                navigate("/", { replace: true });
            }
        });

        // Если сессия уже есть (например, если колбэк уже сработал), сразу редиректим
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/", { replace: true });
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Завершение входа...</p>
        </div>
    );
}