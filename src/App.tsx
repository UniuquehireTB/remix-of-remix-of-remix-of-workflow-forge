import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Projects from "./pages/Projects";
import Tickets from "./pages/Tickets";
import Notes from "./pages/Notes";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";
import { AutoLogoutProvider } from "./components/AutoLogoutProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AutoLogoutProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Projects />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/notes" element={<Notes />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AutoLogoutProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
