import { useQuizes } from "../hooks/quizes";
import Spinner from "../components/Spinner";
import { Link, useLocation } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { useSearchParams } from "react-router-dom";
import { BsFillInfoCircleFill } from "react-icons/bs";
import { useOriginalVideos } from "../hooks/original-videos";
import "../styles/pages/QuizList.css";

export default function QuizList() {
  const { showError } = useError();
  const { data, isPending, error } = useQuizes();
  const { data: originalVideos, isPending: originalVideosPending, error: originalVideosError } = useOriginalVideos();
  const location = useLocation();
  const [ searchParams ] = useSearchParams();
  const videoId = searchParams.get("videoId");
  const query = location.search;

  if (isPending || originalVideosPending) return <Spinner />;
  if (error) showError(error);
  if (originalVideosError) showError(originalVideosError);
  return (
    <div className="quiz-list">
      {data?.quizes.map((quiz, index) => (
        <div key={quiz.id} className="quiz-list-item">
          <h1>Quiz {index + 1}</h1>
          <h2>{quiz.name}</h2>
          <p>{quiz.description}</p>
          <Link to={`/quiz/${quiz.id}/menu${query}`} className="nav-tab">CONTINUE</Link>
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
        <div className="video-reference">
          <BsFillInfoCircleFill size={20} />
          <span>This quiz is related to the compressed video you produced!</span>
        </div>
      )
    }
    const originalVideo = originalVideos.find(video => parseInt(video.id) === parseInt(quiz.video_id));
    if (originalVideo) {
      return (
        <div className="video-reference">
          <BsFillInfoCircleFill size={20} />
          <span>This quiz is related to {originalVideo.name}!</span>
        </div>
      )
    }
    return <></>;
  }
}
