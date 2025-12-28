import "../../styles/components/QuizSidebar.css"
import { useQuiz } from "../../context/QuizContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

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

    const getQuestionClass = useCallback((index) => {
        if (selectedQuestionIdx === index) return "question selected";
        if (userAnswers[index] == null || userAnswers[index].length === 0) return "question nonanswered";
        return "question answered";
    }, [selectedQuestionIdx, userAnswers]);

    const getCheckClass = useCallback((index) => {
        if (userAnswers[index] == null || userAnswers[index].length === 0) return "quiz-navigation-check-true";
        return "quiz-navigation-check-false";
    }, [userAnswers]);

    return (
        <div className={"quiz-navigation"}>
            {questions?.map((_, index) => (    
                <div 
                    key={index} 
                    className={getQuestionClass(index)} 
                    onClick={() => setSelectedQuestionIdx(index)}
                >
                    <h3>{index + 1}</h3>
                    <div className={getCheckClass(index)}></div>
                </div>
            ))}
            <button className="quiz-try-again-button" onClick={() => navigate(`/quiz/list${query}`)}>EXIT QUIZ</button>
        </div>
    )
}

export default QuizSidebar;