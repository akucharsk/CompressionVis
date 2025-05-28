import React, { useState } from "react";
import { questionsList as questions} from "./data/Questions";
import QuizMenu from "../components/quiz/QuizMenu";
// import QuizQuestion from "../components/quiz/QuizQuestion";
import QuizQuestionNew from "../components/quiz/QuizQuestionNew";
import QuizEnded from "../components/quiz/QuizEnded";
import QuizSidebar from "../components/quiz/QuizSidebarNew";
import "../styles/pages/Quiz.css";

const QuizNew = () => {
    const [step, setStep] = useState("menu"); 
    const [selectedQuestion, setSelectedQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null))
    const [score, setScore] = useState(0);

    const startQuiz = () => {
        setStep("question");
        setSelectedQuestion(0);
        setScore(0);
    };

    // const answerChange = (index) => {
    //     // const correct = questions[selectedQuestion].correctAnswer;
    //     // if (answer === correct) {
    //     //     setScore(score + 1);
    //     // }

    //     // if (selectedQuestion + 1 < questions.length) {
    //     //     setSelectedQuestion(selectedQuestion + 1);
    //     // } else {
    //     //     setStep("end");
    //     // }
    //     const newAnswers = [...userAnswers];

    //     if (newAnswers[selectedQuestion])
    // };

    if (step === "menu") {
        return <QuizMenu startQuiz={startQuiz} />;
    }

    if (step === "question") {
        return (
            <>
            {console.log(questions)}
            <QuizSidebar
                questions={questions}
                selectedQuestion={selectedQuestion}
                setSelectedQuestion={setSelectedQuestion}
                selectedAnswers={userAnswers}
            />
            <QuizQuestionNew
                allQuestionsNumber={questions.length}
                questionNumber={selectedQuestion + 1}
                question={questions[selectedQuestion].question}
                type={"checkbox"}
                options={questions[selectedQuestion].answers}
                setSelectedQuestion={setSelectedQuestion}
                selectedAnswer={userAnswers[selectedQuestion]}
                userAnswers={userAnswers}
                setUserAnswers={setUserAnswers}
            />
            </>
        );
    }

    if (step === "end") {
        return <QuizEnded score={score} total={questions.length} />;
    }

    return null;
};

export default QuizNew;
