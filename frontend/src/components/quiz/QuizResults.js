import { useCallback, useMemo } from "react";
import QuizQuestion from "./QuizQuestion";
import { useQuiz } from "../../context/QuizContext";
import "../../styles/components/QuizResults.css";


export default function QuizResults() {
  const { quizQuery, questions, setStep } = useQuiz();
  const handleBack = useCallback(() => {
    setStep("end")
  }, [setStep]);
  const quiz = useMemo(() => quizQuery.data?.quiz || {}, [quizQuery.data?.quiz]);

  if (quizQuery.isPending) return <></>;

  return (
    <div className="quiz-results-box">
      <h1>{quiz.name}</h1>
      <h2>Detailed results</h2>
      {questions?.map((_, idx) => (
        <QuizQuestion
          key={idx}
          showResults={true}
          questionIdx={idx}
        />
      ))}
      <button onClick={handleBack}>BACK</button>
    </div>
  )
}
