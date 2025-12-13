import React, { useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import { scale as chroma } from "chroma-js";

const QuizEnded = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        quizQuery,
        userAnswers,
        setUserAnswers,
        setSelectedQuestionIdx,
        setStep,
    } = useQuiz();
    const { data } = quizQuery;
    const questions = useMemo(() => data?.quiz?.questions || [], [data]);
    const { current, total } = useMemo(() => {
        const result = { current: 0, total: 0 };
        questions.forEach((question, index) => {
            result.total += question.answers.filter(answer => answer.is_correct).length ?? 0;
            const answers = userAnswers[index];
            const incorrectAnswers = answers.filter(answer => !question.answers[answer].is_correct);
            const correctAnswers = answers.filter(answer => question.answers[answer].is_correct);
            result.current += incorrectAnswers.length > 0 ? 0 : correctAnswers.length;
        });
        return result;
    }, [questions, userAnswers]);

    const query = location.search;
    const scale = chroma(['#ff0000', '#ffff00', '#00aa00']).domain([0, total]);

    return (
        <div className="quiz-box" style={{ gap: "1rem" }}>
            <h1>Quiz Completed!</h1>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "2.5rem" }}>
                <span>Your score: </span>
                <span style={{ color: scale(current).hex() }}>{current} / {total}</span>
            </div>
            <div className="end-navigation-box">
                <div
                    className="quiz-try-again-button"
                    onClick={() => {
                        setUserAnswers(Object.fromEntries(questions.map((_, index) => [index, []])));
                        setSelectedQuestionIdx(0);
                        navigate(`/quiz/${quizId}/menu${query}`)
                        setStep("question");
                    }}
                >
                    TRY AGAIN
                </div>
                <div
                    className="quiz-see-results-button"
                    onClick={() => setStep("results")}
                >
                    SEE RESULTS
                </div>
                <div
                    className="quiz-try-again-button"
                    onClick={() => navigate(`/quiz/list${query}`)}
                >
                    EXIT QUIZ
                </div>
            </div>
        </div>
    );
};

export default QuizEnded;
