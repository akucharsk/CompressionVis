import {BrowserRouter as Router, Routes, Route, useLocation, Navigate} from 'react-router-dom';
import FramesDistribution from './pages/FrameDistribution';
import Comparison from './pages/Comparison';
import Quiz from './pages/Quiz';
import NavigationTabs from './components/Navigation';
import Menu from './pages/Menu';
import { SettingsProvider } from './context/SettingsContext';
import {FramesProvider} from "./context/FramesContext";
import {ErrorProvider} from "./context/ErrorContext";
import { QueryClientProvider } from '@tanstack/react-query';
import { MetricsProvider } from './context/MetricsContext';
import {queryClient} from "./utils/queryClient";

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
      <ErrorProvider>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <FramesProvider>
              <MetricsProvider>
                {!hideNavbar && <NavigationTabs />}
                <Routes>
                  <Route path="*" element={<Navigate to="/" />} />
                  <Route path="/" element={<Menu />} />
                  <Route path="/compress" element={<FramesDistribution />} />
                  <Route path="/comparison" element={<Comparison />} />
                  <Route path="/quiz" element={<Quiz />} />
                </Routes>
              </MetricsProvider>
            </FramesProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ErrorProvider>
  );
}

function App() {
  return (
      <Router>
        <Layout />
      </Router>
  );
}

export default App;



