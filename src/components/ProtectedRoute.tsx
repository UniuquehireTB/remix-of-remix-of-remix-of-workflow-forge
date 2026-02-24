import { Navigate, Outlet } from "react-router-dom";
import { authService } from "@/services/authService";

const ProtectedRoute = () => {
    const user = authService.getCurrentUser();
    const token = localStorage.getItem('token');

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
