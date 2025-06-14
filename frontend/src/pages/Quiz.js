import React, { useState } from "react";
import { questionsList as questions} from "./data/Questions";
import QuizMenu from "../components/quiz/QuizMenu";
import QuizQuestion from "../components/quiz/QuizQuestion";
import QuizEnded from "../components/quiz/QuizEnded";
import QuizSidebar from "../components/quiz/QuizSidebar";
import "../styles/pages/Quiz.css";

const Quiz = () => {
    const [step, setStep] = useState("menu"); 
    const [selectedQuestion, setSelectedQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null))
    const [score, setScore] = useState(0);

    const endQuiz = () => {
        setStep("end")
    }

    const startQuiz = () => {
        setStep("question");
        setSelectedQuestion(0);
        setScore(0);
    };

    if (step === "menu") {
        return (
        <>
            <div className="quiz-content">
                <QuizMenu startQuiz={startQuiz} />
            </div>
        </>
        )
    }

    if (step === "question") {
        return (
            <>
            <div className="quiz-content">
                <QuizSidebar
                    questions={questions}
                    selectedQuestion={selectedQuestion}
                    setSelectedQuestion={setSelectedQuestion}
                    selectedAnswers={userAnswers}
                />
                <QuizQuestion
                    allQuestionsNumber={questions.length}
                    questionNumber={selectedQuestion + 1}
                    question={questions[selectedQuestion].question}
                    type={"checkbox"}
                    options={questions[selectedQuestion].answers}
                    setSelectedQuestion={setSelectedQuestion}
                    selectedAnswer={userAnswers[selectedQuestion]}
                    userAnswers={userAnswers}
                    setUserAnswers={setUserAnswers}
                    endQuiz={endQuiz}
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
