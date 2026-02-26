import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

// Idle timeout set to 15 minutes
const IDLE_TIMEOUT = 15 * 60 * 1000;

// Refresh token every 50 minutes (backend JWT expires in 1 hour)
const REFRESH_INTERVAL = 50 * 60 * 1000;

export const AutoLogoutProvider = ({ children }: { children: React.ReactNode }) => {
    const lastActivityRef = useRef(Date.now());
    const lastRefreshRef = useRef(Date.now());
    const navigate = useNavigate();
    const location = useLocation();

    // Reset timers when the location changes (e.g. user logs in)
    useEffect(() => {
        if (location.pathname !== '/login') {
            lastActivityRef.current = Date.now();
            lastRefreshRef.current = Date.now();
        }
    }, [location.pathname]);

    useEffect(() => {
        // Do not set up listeners if we are on the login page
        if (location.pathname === '/login') {
            return;
        }

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];

        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        const checkInterval = setInterval(() => {
            // Re-check if user is still logged in according to storage
            if (!authService.getCurrentUser()) {
                clearInterval(checkInterval);
                return;
            }

            const now = Date.now();

            // Check idle timeout
            if (now - lastActivityRef.current > IDLE_TIMEOUT) {
                authService.logout();
                toast.info("Session expired due to inactivity. Please log in again.");
                navigate('/login', { replace: true });
            }

            // Refresh token if active and approaching expiration
            if (now - lastRefreshRef.current > REFRESH_INTERVAL) {
                authService.refresh().then(() => {
                    lastRefreshRef.current = Date.now();
                }).catch(err => {
                    console.error("Token refresh failed", err);
                    authService.logout();
                    toast.error("Session expired. Please log in again.");
                    navigate('/login', { replace: true });
                });
            }

        }, 30000); // Check every 30 seconds

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(checkInterval);
        };
    }, [navigate, location.pathname]);

    return <>{children}</>;
};
