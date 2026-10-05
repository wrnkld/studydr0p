import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

function ResultsRedirect() {
  const { id } = useParams();
  return <Navigate to={`/studies/${id}?tab=results`} replace />;
}
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StudyToolbarProvider } from "@/components/StudyToolbarContext";
import Landing from "./pages/Landing";
import ExampleStudy from "./pages/ExampleStudy";
import NewStudy from "./pages/NewStudy";
import StudyBuilder from "./pages/StudyBuilder";
import ParticipantStudy from "./pages/ParticipantStudy";
import ResetPassword from "./pages/ResetPassword";
import Unsubscribe from "./pages/Unsubscribe";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppEntry() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/studies" : "/examples/fridge"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-center" />
      <BrowserRouter>
        <AuthProvider>
          <StudyToolbarProvider>
            <div className="flex min-h-screen flex-col">
              <PaymentTestModeBanner />
              <AppShell>
                <Routes>
                  <Route path="/" element={<AppEntry />} />
                  <Route path="/home" element={<Landing mode="home" />} />
                  <Route path="/examples/:id" element={<ExampleStudy />} />
                  <Route path="/s/:slug" element={<ParticipantStudy />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

                  <Route path="/studies" element={<ProtectedRoute><Landing mode="studies" /></ProtectedRoute>} />
                  <Route
                    path="/studies/new"
                    element={<ProtectedRoute><NewStudy /></ProtectedRoute>}
                  />
                  <Route
                    path="/studies/:id"
                    element={<ProtectedRoute><StudyBuilder /></ProtectedRoute>}
                  />
                  <Route
                    path="/studies/:id/edit"
                    element={<Navigate to=".." replace relative="path" />}
                  />
                  <Route
                    path="/studies/:id/results"
                    element={<ResultsRedirect />}
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppShell>
            </div>
          </StudyToolbarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
