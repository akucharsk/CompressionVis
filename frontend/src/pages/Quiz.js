import React, { useState, useMemo } from "react";
import QuizMenu from "../components/quiz/QuizMenu";
import QuizQuestion from "../components/quiz/QuizQuestion";
import QuizEnded from "../components/quiz/QuizEnded";
import QuizSidebar from "../components/quiz/QuizSidebar";
import "../styles/pages/Quiz.css";
import Spinner from "../components/Spinner";
import { useParams } from "react-router-dom";
import { useQuiz } from "../hooks/quizes";

const Quiz = () => {
    const { quizId } = useParams();
    const { data, isPending, error } = useQuiz(quizId);
    const questions = useMemo(() => data?.quiz?.questions || [], [data]);
    console.log({ questions, data });
    const [step, setStep] = useState("question"); 
    const [selectedQuestion, setSelectedQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState(Object.fromEntries(questions.map((_, index) => [index, []])))

    const endQuiz = () => {
        setStep("end")
    }

    if (isPending) return <Spinner />;

    if (step === "question") {
        return (
            <>
            <div className="quiz-content">
                <QuizQuestion
                    allQuestionsNumber={questions.length}
                    questionNumber={selectedQuestion + 1}
                    question={questions[selectedQuestion]}
                    type={"checkbox"}
                    options={questions[selectedQuestion].answers}
                    setSelectedQuestion={setSelectedQuestion}
                    selectedAnswer={userAnswers[selectedQuestion]}
                    userAnswers={userAnswers}
                    setUserAnswers={setUserAnswers}
                    endQuiz={endQuiz}
                />
                <QuizSidebar
                    questions={questions}
                    selectedQuestion={selectedQuestion}
                    setSelectedQuestion={setSelectedQuestion}
                    selectedAnswers={userAnswers}
                />
            </div>
            </>
        );
    }

    if (step === "end") {
        return (
        <>
            <div className="quiz-content">
                <QuizEnded 
                    userAnswers={userAnswers}
                    questions={questions}
                    setStep={setStep}
                    setUserAnswers={setUserAnswers}
                />
            </div>
        </>
        )
    }

    return null;
};

export default Quiz;
