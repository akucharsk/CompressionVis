import { useQuizes } from "../hooks/quizes";
import Spinner from "../components/Spinner";
import { Link, useLocation } from "react-router-dom";
import { useError } from "../context/ErrorContext";

export default function QuizList() {
  const { showError } = useError();
  const { data, isPending, error } = useQuizes();
  const location = useLocation();
  const query = location.search;

  if (isPending) return <Spinner />;
  if (error) showError(error);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "auto" }}>
      {data?.quizes.map((quiz) => (
        <div key={quiz.id}>
          <Link to={`/quiz/${quiz.id}/menu${query}`} className="nav-tab">{quiz.name}</Link>
          <p>{quiz.description}</p>
        </div>
      ))}
    </div>
  );
}