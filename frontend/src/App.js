import { BrowserRouter as Router, Routes, Route, useLocation  } from 'react-router-dom';
import FramesDistribution from './pages/FrameDistribution';
import Comparison from './pages/Comparison';
import Quiz from './pages/Quiz';
import NavigationTabs from './components/Navigation';
import Menu from './pages/Menu';

function Layout() {
  // const location = useLocation();
  // const hideNavbar = location.pathname === "/";

  return (
      <>
        {/*{!hideNavbar && <NavigationTabs />}*/}
        <Routes>
          <Route path="/" element={<Menu />} />
          {/*<Route path="/frames" element={<FramesDistribution />} />*/}
          {/*<Route path="/comparison" element={<Comparison />} />*/}
          {/*<Route path="/quiz" element={<Quiz />} />*/}
        </Routes>
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



