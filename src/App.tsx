import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NewStudy from "./pages/NewStudy";
import StudyBuilder from "./pages/StudyBuilder";
import StudyDetail from "./pages/StudyDetail";
import ParticipantStudy from "./pages/ParticipantStudy";
import LocalBuilder from "./pages/LocalBuilder";
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
            <Route path="/build" element={<LocalBuilder />} />
            <Route path="/build/:type" element={<LocalBuilder />} />
            <Route path="/s/:slug" element={<ParticipantStudy />} />

            <Route
              path="/studies"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/studies/new"
              element={<ProtectedRoute><NewStudy /></ProtectedRoute>}
            />
            <Route
              path="/studies/:id"
              element={<ProtectedRoute><StudyDetail /></ProtectedRoute>}
            />
            <Route
              path="/studies/:id/edit"
              element={<ProtectedRoute><StudyBuilder /></ProtectedRoute>}
            />
            <Route
              path="/studies/:id/results"
              element={<Navigate to=".." replace relative="path" />}
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
