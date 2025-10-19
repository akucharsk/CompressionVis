import {BrowserRouter as Router, Routes, Route, useLocation, Navigate} from 'react-router-dom';
import FramesDistribution from './pages/FrameDistribution';
import Comparison from './pages/Comparison';
import Quiz from './pages/Quiz';
import NavigationTabs from './components/Navigation';
import Menu from './pages/Menu';
import { SettingsProvider } from './context/SettingsContext';
import {FramesProvider} from "./context/FramesContext";
import {ErrorProvider} from "./context/ErrorContext";
import { DisplayModeProvider } from './context/DisplayModeContext';
import { VideoPlayingProvider } from './context/VideoPlayingContext';

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
      <ErrorProvider>
          <SettingsProvider>
              <FramesProvider>
                <DisplayModeProvider>
                  <VideoPlayingProvider>
                    {!hideNavbar && <NavigationTabs />}
                    <Routes>
                        <Route path="*" element={<Navigate to="/" />} />
                        <Route path="/" element={<Menu />} />
                        <Route path="/compress" element={<FramesDistribution />} />
                        <Route path="/comparison" element={<Comparison />} />
                        <Route path="/quiz" element={<Quiz />} />
                    </Routes>
                  </VideoPlayingProvider>
                </DisplayModeProvider>
              </FramesProvider>
          </SettingsProvider>
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



