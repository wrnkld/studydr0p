import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewStudy from "./pages/NewStudy";
import StudyBuilder from "./pages/StudyBuilder";
import StudyResults from "./pages/StudyResults";
import ParticipantStudy from "./pages/ParticipantStudy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/s/:slug" element={<ParticipantStudy />} />

            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/studies/new"
              element={<ProtectedRoute><NewStudy /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/studies/:id/edit"
              element={<ProtectedRoute><StudyBuilder /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/studies/:id/results"
              element={<ProtectedRoute><StudyResults /></ProtectedRoute>}
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
