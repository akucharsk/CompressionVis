import {BrowserRouter as Router, Routes, Route, useLocation, Navigate} from 'react-router-dom';
import FramesDistribution from './pages/FrameDistribution';
import Comparison from './pages/Comparison';
import Quiz from './pages/Quiz';
import NavigationTabs from './components/Navigation';
import Menu from './pages/Menu';
import Admin from "./pages/Admin";
import Charts from './pages/Charts';
import { SettingsProvider } from './context/SettingsContext';
import {FramesProvider} from "./context/FramesContext";
import {ErrorProvider} from "./context/ErrorContext";
import { DisplayModeProvider } from './context/DisplayModeContext';
import { VideoPlayingProvider } from './context/VideoPlayingContext';
import { FpsProvider } from './context/FpsContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { MetricsProvider } from './context/MetricsContext';
import {MacroblocksProvider} from "./context/MacroblocksContext";
import {queryClient} from "./utils/queryClient";
import './styles/App.css'

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/" || location.pathname === "/admin";

  return (
      <ErrorProvider>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <FpsProvider>  
              <FramesProvider>
                <MetricsProvider>
                  <DisplayModeProvider>
                    <VideoPlayingProvider>
                      <MacroblocksProvider>
                          <div className={"app-container"}>
                          {!hideNavbar && <NavigationTabs />}
                            <Routes>
                              <Route path="*" element={<Navigate to="/" />} />
                              <Route path="/" element={<Menu />} />
                              <Route path="/compress" element={<FramesDistribution />} />
                              <Route path="/comparison" element={<Comparison />} />
                              <Route path="/quiz" element={<Quiz />} />
                              <Route path="/admin" element={<Admin />} />
                              <Route path="/charts" element={<Charts />}/>
                            </Routes>
                          </div>
                        </MacroblocksProvider>
                    </VideoPlayingProvider>
                  </DisplayModeProvider>
                </MetricsProvider>
              </FramesProvider>
            </FpsProvider>
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



