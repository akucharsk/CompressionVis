import { BrowserRouter as Router, Routes, Route, useLocation  } from 'react-router-dom';
import FramesDistribution from './pages/FrameDistribution';
import Comparison from './pages/Comparison';
import Quiz from './pages/Quiz';
import QuizNew from './pages/QuizNew';
import NavigationTabs from './components/Navigation';
import Menu from './pages/Menu';
import { SettingsProvider } from './context/SettingsContext';
import {FramesProvider} from "./context/FramesContext";

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
      <>
          <SettingsProvider>
              <FramesProvider>
              {!hideNavbar && <NavigationTabs />}
              <Routes>
                  <Route path="/" element={<Menu />} />
                  <Route path="/compress" element={<FramesDistribution />} />
                  <Route path="/comparison" element={<Comparison />} />
                  <Route path="/quiz" element={<QuizNew />} />
              </Routes>
              </FramesProvider>
          </SettingsProvider>
      </>
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



