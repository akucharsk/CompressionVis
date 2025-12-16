import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useSingleQuiz } from "../hooks/quizes";

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const { quizId } = useParams();
  const [ params, setSearchParams ] = useSearchParams();
  const location = useLocation();
  const step = params.get("step") || "question";
  const setStep = useCallback((newStep) => {
      setSearchParams(prev => {
          prev.set("step", newStep);
          return prev;
      });
  }, [setSearchParams]);

  const quizQuery = useSingleQuiz(quizId);
  const questions = useMemo(() => quizQuery.data?.quiz?.questions || [], [quizQuery.data?.quiz?.questions]);
  const initialUserAnswers = useMemo(() => {
    const saved = localStorage.getItem("quizAnswers");
    return saved ? JSON.parse(saved) : Object.fromEntries(questions.map((_, index) => [index, []]));
  }, [questions]);
  const initialSelectedQuestion = useMemo(() => {
    const saved = localStorage.getItem("selectedQuestion");
    return saved ? parseInt(saved) : 0;
  }, []);

  const [userAnswers, _setUserAnswers] = useState(initialUserAnswers);
  const [selectedQuestionIdx, _setSelectedQuestionIdx] = useState(initialSelectedQuestion);

  const setUserAnswers = useCallback((newUserAnswers) => {
    let answers;
    if (typeof newUserAnswers === "function") {
      answers = newUserAnswers(userAnswers);
    } else {
      answers = newUserAnswers;
    }
    localStorage.setItem("quizAnswers", JSON.stringify(answers));
    _setUserAnswers(answers);
  }, [userAnswers, _setUserAnswers]);

  const setSelectedQuestionIdx = useCallback((newSelectedQuestion) => {
    let questionIdx;
    if (typeof newSelectedQuestion === "function") {
      questionIdx = newSelectedQuestion(selectedQuestionIdx);
    } else {
      questionIdx = newSelectedQuestion;
    }
    localStorage.setItem("selectedQuestion", questionIdx);
    _setSelectedQuestionIdx(questionIdx);
  }, [selectedQuestionIdx, _setSelectedQuestionIdx]);

  useEffect(() => {
    const pathItems = location.pathname.split("/");
    if (!pathItems.includes("quiz") || pathItems.includes("list") || pathItems.includes("menu")) {
      localStorage.removeItem("quizAnswers");
      localStorage.removeItem("selectedQuestion");
      _setUserAnswers(Object.fromEntries(questions.map((_, index) => [index, []])));
      _setSelectedQuestionIdx(0);
      setStep("question");
    }
  }, [location.pathname, _setUserAnswers, _setSelectedQuestionIdx, questions, setStep]);

  const quizProviderValue = useMemo(() => ({
    userAnswers,
    setUserAnswers,
    quizQuery,
    questions,
    selectedQuestionIdx,
    setSelectedQuestionIdx,
    step,
    setStep,
  }), [userAnswers, setUserAnswers, quizQuery, questions, selectedQuestionIdx, setSelectedQuestionIdx, step, setStep]);

  return (
    <QuizContext.Provider value={quizProviderValue}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);