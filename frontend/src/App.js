import {BrowserRouter as Router, Routes, Route, Navigate, Outlet} from 'react-router-dom';
import FramesDistribution from './pages/FrameDistribution';
import Comparison from './pages/Comparison';
import Quiz from './pages/Quiz';
import NavigationTabs from './components/Navigation';
import Menu from './pages/Menu';
import Charts from './pages/Charts';
import FrameDifferences from './pages/FrameDifferences';
import Login from './pages/Login';
import QuizList from './pages/QuizList';
import Admin from "./pages/Admin";
import Protected from "./pages/Protected";
import CompressedVideos from "./pages/CompressedVideos";
import QuizResults from './components/quiz/QuizResults';
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
import { ChartsProvider } from './context/ChartsContext';
import QuizMenu from './components/quiz/QuizMenu';
import { QuizProvider } from './context/QuizContext';

function Layout() {

  return (
      <ErrorProvider>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <FpsProvider>
              <FramesProvider>
                <MetricsProvider>
                  <ChartsProvider>
                    <DisplayModeProvider>
                      <VideoPlayingProvider>
                        <MacroblocksProvider>
                            <div className={"app-container"}>
                            <NavigationTabs />
                              <Routes>
                                <Route path="*" element={<Navigate to="/" />} />
                                <Route path="/" element={<Menu />} />
                                <Route path="/compress" element={<FramesDistribution />} />
                                <Route path="/comparison" element={<Comparison />} />
                                <Route path="/compressed" element={<CompressedVideos />} />
                                <Route path="/quiz" element={<QuizProvider><Outlet /></QuizProvider>}>
                                  <Route path=":quizId/menu" element={<QuizMenu />} />
                                  <Route path=":quizId" element={<Quiz />} />
                                  <Route path=":quizId/results" element={<QuizResults />} />
                                  <Route path="list" element={<QuizList />} />
                                </Route>
                                <Route path="/differences" element={<FrameDifferences />} />
                                <Route path="/admin" element={<Protected><Admin /></Protected>} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/charts" element={<Charts />} />
                              </Routes>
                            </div>
                          </MacroblocksProvider>
                      </VideoPlayingProvider>
                    </DisplayModeProvider>
                  </ChartsProvider>
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



