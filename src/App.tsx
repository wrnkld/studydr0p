import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

function ResultsRedirect() {
  const { id } = useParams();
  return <Navigate to={`/studies/${id}?tab=results`} replace />;
}
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
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
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
              <TopBar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/examples/:id" element={<ExampleStudy />} />
                  <Route path="/s/:slug" element={<ParticipantStudy />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />

                  <Route path="/studies" element={<Navigate to="/" replace />} />
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
              </main>
              <Footer />
            </div>
          </StudyToolbarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
