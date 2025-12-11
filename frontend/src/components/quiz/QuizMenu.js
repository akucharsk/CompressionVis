import React, { useMemo, useCallback } from "react";
import "../../styles/components/QuizMenu.css"
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import Spinner from "../Spinner";
import { useError } from "../../context/ErrorContext";
const QuizMenu = () => {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const showError = useError();
    const { quizQuery } = useQuiz();
    const { data, isPending, error } = quizQuery;
    const quiz = useMemo(() => data?.quiz || {}, [data]);
    const startQuiz = useCallback(() => {
        navigate(`/quiz/${quizId}`);
    }, [navigate, quizId]);
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
            <div style={{ display: "flex" }}>
                <button onClick={startQuiz}>START QUIZ</button>
                <Link to="/quiz" className="nav-tab" >BACK TO QUIZES</Link>
            </div>
        </div>
    );
};

export default QuizMenu;