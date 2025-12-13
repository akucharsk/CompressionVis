import "../../styles/components/QuizSidebar.css"
import { useQuiz } from "../../context/QuizContext";
import { useNavigate, useLocation } from "react-router-dom";

const QuizSidebar = () => {
    const {
        selectedQuestionIdx,
        setSelectedQuestionIdx,
        userAnswers,
        questions,
    } = useQuiz();
    const navigate = useNavigate();
    const location = useLocation();
    const query = location.search;
    return (
        <div className={"quiz-navigation-opened"}>
            {questions?.map((_, index) => (    
                <div 
                    key={index} 
                    className={selectedQuestionIdx === index ? "quiz-navigation-question-selected" : userAnswers[index] == null || userAnswers[index].length === 0 ? "quiz-navigation-question-nonanswered" : "quiz-navigation-question-answered"} 
                    onClick={() => setSelectedQuestionIdx(index)}
                >
                    <h3>{index + 1}</h3>
                    <div className={userAnswers[index] == null || userAnswers[index].length === 0 ? "quiz-navigation-check-true" : "quiz-navigation-check-false"}></div>
                </div>
            ))}
            <button className="quiz-try-again-button" style={{ width: "fit-content", padding: "1.5rem"}} onClick={() => navigate(`/quiz/list${query}`)}>EXIT QUIZ</button>
        </div>
    )
}

export default QuizSidebar;