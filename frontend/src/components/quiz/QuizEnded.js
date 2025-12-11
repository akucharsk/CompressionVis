import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const QuizEnded = ({ questions, setUserAnswers, userAnswers }) => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const points = useMemo(() => {
        const result = { current: 0, total: 0 };
        questions.forEach((question, index) => {
            result.total += question.answers.filter(answer => answer.is_correct).length ?? 0;
            const answers = userAnswers[index];
            result.current += answers.filter(answer => question.answers[answer].is_correct).length || 0;
        });
        return result;
    }, [questions, userAnswers]);

    return (
        <div className="quiz-box">
            <h1>Quiz Completed!</h1>
            <p>Your score: {points.current} / {points.total}</p>
            <div className="end-navigation-box">
                <div
                    className="quiz-try-again-button"
                    onClick={() => {
                        setUserAnswers(Object.fromEntries(questions.map((_, index) => [index, []])))
                        navigate(`/quiz/${quizId}/menu`)
                    }}
                >
                    Try again
                </div>
                <div
                    className="quiz-see-results-button"
                    onClick={() => {}}
                    disabled
                >
                    See results
                </div>
            </div>
        </div>
    );
};

export default QuizEnded;
