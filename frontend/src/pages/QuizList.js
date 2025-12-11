import { useQuizes } from "../hooks/quizes";
import Spinner from "../components/Spinner";
import { Link } from "react-router-dom";

export default function QuizList() {
  const { data, isPending, error } = useQuizes();

  if (isPending) return <Spinner />;

  return (
    <div>
      {data?.quizes.map((quiz) => (
        <div key={quiz.id}>
          <Link to={`/quiz/${quiz.id}/menu`}>{quiz.name}</Link>
          <p>{quiz.description}</p>
        </div>
      ))}
    </div>
  );
}