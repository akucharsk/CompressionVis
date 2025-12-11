import { useParams } from "react-router-dom";
import { useQuiz } from "../context/QuizContext";
import { useMemo } from "react";
import Spinner from "../components/Spinner";
import QuizQuestion from "../components/quiz/QuizQuestion";

export default function QuizResults() {
  const { quizId } = useParams();
  const { quizQuery } = useQuiz();
  const { data, isPending, error } = quizQuery;
  const quiz = useMemo(() => data?.quiz || {}, [data]);
  if (isPending) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;
  return (
    <div>
      <h1>{quiz.name} Quiz Results</h1>
      <p>{quiz.description}</p>
      {quiz.questions.map((question, idx) => (
        <QuizQuestion
          key={idx}
          question={question}
          type="checkbox"
          options={question.answers}
          showResults={true}
          questionNumber={idx + 1}
        />
      ))}
    </div>
  )
}
