import React, { useMemo, useCallback } from "react";
import "../../styles/components/QuizMenu.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import Spinner from "../Spinner";
import { useError } from "../../context/ErrorContext";

const QuizMenu = () => {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const location = useLocation();
    const { showError } = useError();
    const { quizQuery } = useQuiz();
    const { data, isPending, error } = quizQuery;
    const quiz = useMemo(() => data?.quiz || {}, [data]);
    const query = location.search;
    const startQuiz = useCallback(() => {
        navigate(`/quiz/${quizId}${query}`);
    }, [navigate, quizId, query]);
    if (isPending) return (
        <div className="spinner-container">
            <Spinner />
        </div>
    )
    if (error) showError(error);
    return (
        <div className="quiz-box">
            <h1>{quiz?.name}</h1>
            <p>{quiz?.description}</p>
            <div>
                <button onClick={startQuiz}>START QUIZ</button>
                <button onClick={() => navigate(`/quiz/list${query}`)}>BACK TO QUIZES</button>
            </div>
        </div>
    );
};

export default QuizMenu;