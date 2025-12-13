import QuizQuestion from "../components/quiz/QuizQuestion";
import QuizEnded from "../components/quiz/QuizEnded";
import QuizSidebar from "../components/quiz/QuizSidebar";
import QuizResults from "../components/quiz/QuizResults";
import "../styles/pages/Quiz.css";
import Spinner from "../components/Spinner";
import { useQuiz } from "../context/QuizContext";
import { useError } from "../context/ErrorContext";

const Quiz = () => {
    const { quizQuery, questions, step } = useQuiz();
    const { isPending, error } = quizQuery;
    const { showError } = useError();
    if (isPending || questions.length === 0) return <Spinner />;
    if (error) showError(error);

    switch (step) {
        case "question":
            return (
                <div className="quiz-content">
                    <QuizQuestion />
                    <QuizSidebar />
                </div>
            );
        case "end":
            return (
                <div className="quiz-content">
                    <QuizEnded />
                </div>
            );
        case "results":
            return (
                <div className="quiz-content">
                    <QuizResults />
                </div>
            );
        default:
            return null;
    }
};

export default Quiz;
