import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import Index from "./pages/Index";
import CognitiveTest from "./pages/CognitiveTest";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Questionnaire from "./pages/Questionnaire";
import Demo from "./pages/Demo";
import About from "./pages/About";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import MMSE from "./pages/MMSE";
import AssessmentHistory from "./pages/AssessmentHistory";
import TestModeSelection from "./pages/TestModeSelection";
import EegTest from "./pages/EegTest";
import MemoryHelperPage from "./pages/MemoryHelperPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cognitive-test" element={<CognitiveTest />} />
          <Route path="/test-mode-selection" element={<TestModeSelection />} />
          <Route path="/eeg-test" element={<EegTest />} />
          <Route path="/memory-helper" element={<MemoryHelperPage />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/mmse" element={<MMSE />} />
          <Route path="/results" element={<Results />} />
          <Route path="/assessment-history" element={<AssessmentHistory />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
