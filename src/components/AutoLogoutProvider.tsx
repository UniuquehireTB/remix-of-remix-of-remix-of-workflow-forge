import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

// How long the user can be idle before being auto-logged out (30 minutes)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// How often to proactively refresh the token (every 50 min, token expires in 1h)
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

// How often we poll to check the above two conditions (every 30 seconds)
const POLL_INTERVAL_MS = 30 * 1000;

export const AutoLogoutProvider = ({ children }: { children: React.ReactNode }) => {
    const lastActivityRef = useRef(Date.now());
    const lastRefreshRef = useRef(Date.now());
    const navigate = useNavigate();
    const location = useLocation();

    // Reset activity + refresh timestamps when user navigates to a protected page (e.g. after login)
    useEffect(() => {
        if (location.pathname !== '/login') {
            lastActivityRef.current = Date.now();
            lastRefreshRef.current = Date.now();
        }
    }, [location.pathname]);

    useEffect(() => {
        if (location.pathname === '/login') return;

        // ── Activity tracker ──────────────────────────────────────────────────
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));

        // ── Proactive silent logout + token refresh ───────────────────────────
        const doLogout = (message: string) => {
            authService.logout();
            toast.info(message);
            navigate('/login', { replace: true });
        };

        const poll = setInterval(async () => {
            const user = authService.getCurrentUser();
            if (!user) {
                clearInterval(poll);
                return;
            }

            const now = Date.now();
            const idleMs = now - lastActivityRef.current;
            const refreshAgeMs = now - lastRefreshRef.current;

            // ── Idle logout ───────────────────────────────────────────────────
            if (idleMs > IDLE_TIMEOUT_MS) {
                clearInterval(poll);
                doLogout('You were logged out due to inactivity. Please log in again.');
                return;
            }

            // ── Proactive token refresh (only if user is active) ──────────────
            if (refreshAgeMs > REFRESH_INTERVAL_MS) {
                try {
                    await authService.refresh();
                    lastRefreshRef.current = Date.now();
                } catch {
                    // If refresh fails, the session truly expired → logout
                    clearInterval(poll);
                    doLogout('Your session expired. Please log in again.');
                }
            }
        }, POLL_INTERVAL_MS);

        return () => {
            ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, handleActivity));
            clearInterval(poll);
        };
    }, [navigate, location.pathname]);

    return <>{children}</>;
};
