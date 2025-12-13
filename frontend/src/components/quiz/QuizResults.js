import { useCallback, useMemo } from "react";
import QuizQuestion from "./QuizQuestion";
import { useQuiz } from "../../context/QuizContext";


export default function QuizResults() {
  const { quizQuery, questions, setStep } = useQuiz();
  const handleBack = useCallback(() => {
    setStep("end")
  }, [setStep]);
  const quiz = useMemo(() => quizQuery.data?.quiz || {}, [quizQuery.data?.quiz]);

  if (quizQuery.isPending) return <></>;

  return (
    <div style={{ margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
      <h1>{quiz.name}</h1>
      <h2>Detailed results</h2>
      {questions?.map((_, idx) => (
        <QuizQuestion
          key={idx}
          showResults={true}
          questionIdx={idx}
        />
      ))}
      <div className="quiz-try-again-button" onClick={handleBack} style={{ marginBottom: "5rem" }}>BACK</div>
    </div>
  )
}
