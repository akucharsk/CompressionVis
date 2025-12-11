import { createContext, useContext, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";
import { defaultRetryPolicy } from "../utils/retryUtils";
import { defaultRefetchIntervalPolicy } from "../utils/retryUtils";

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const { quizId } = useParams();
  const quizQuery = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => await genericFetch(`${apiUrl}/quiz/${quizId}`),
    retry: defaultRetryPolicy,
    refetchInterval: defaultRefetchIntervalPolicy,
  })
  const questions = useMemo(() => quizQuery.data?.quiz?.questions || [], [quizQuery.data?.quiz?.questions]);
  const [userAnswers, setUserAnswers] = useState(Object.fromEntries(questions.map((_, index) => [index, []])));
  return (
    <QuizContext.Provider value={{ userAnswers, setUserAnswers, quizQuery }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);