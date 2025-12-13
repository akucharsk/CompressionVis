import { useQuizes } from "../hooks/quizes";
import Spinner from "../components/Spinner";
import { Link, useLocation } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { useSearchParams } from "react-router-dom";
import { BsFillInfoCircleFill } from "react-icons/bs";

export default function QuizList() {
  const { showError } = useError();
  const { data, isPending, error } = useQuizes();
  const location = useLocation();
  const [ searchParams ] = useSearchParams();
  const videoId = searchParams.get("videoId");
  const originalVideoId = searchParams.get("originalVideoId");
  const query = location.search;

  if (isPending) return <Spinner />;
  if (error) showError(error);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "auto" }}>
      {data?.quizes.map((quiz, index) => (
        <div key={quiz.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem", alignItems: "center" }}>
          <h1>Quiz {index + 1}</h1>
          <h2>{quiz.name}</h2>
          <p>{quiz.description}</p>
          <Link to={`/quiz/${quiz.id}/menu${query}`} className="nav-tab">START QUIZ</Link>
          <VideoReference quiz={quiz} />
        </div>
      ))}
    </div>
  );

  function VideoReference({ quiz }) {
    if (!quiz.video_id) {
      return <></>
    }
    if (parseInt(quiz.video_id) === parseInt(videoId)) {
      return (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontWeight: "bold" }}>
          <BsFillInfoCircleFill size={20} />
          <span>This quiz is related to the compressed video you produced!</span>
        </div>
      )
    }
    if (parseInt(quiz.video_id) === parseInt(originalVideoId)) {
      return (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontWeight: "bold" }}>
          <BsFillInfoCircleFill size={20} />
          <span>This quiz is related to the original video.</span>
        </div>
      )
    }
    return <></>;
  }
}
