import React, { useState } from "react";
import { questionsList as questions} from "./data/Questions";
import QuizMenu from "../components/quiz/QuizMenu";
// import QuizQuestion from "../components/quiz/QuizQuestion";
import QuizQuestionNew from "../components/quiz/QuizQuestionNew";
import QuizEnded from "../components/quiz/QuizEnded";
import "../styles/pages/Quiz.css";

const QuizNew = () => {
    const [step, setStep] = useState("menu"); 
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);

    const startQuiz = () => {
        setStep("question");
        setCurrentIdx(0);
        setScore(0);
    };

    const answerQuestion = (answer) => {
        const correct = questions[currentIdx].correctAnswer;
        if (answer === correct) {
            setScore(score + 1);
        }

        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(currentIdx + 1);
        } else {
            setStep("end");
        }
    };

    if (step === "menu") {
        return <QuizMenu startQuiz={startQuiz} />;
    }

    if (step === "question") {
        return (
            <QuizQuestionNew
                // number={currentIdx + 1}
                // total={questions.length}
                // question={questions[currentIdx].question}
                // answers={questions[currentIdx].answers}
                // onAnswer={answerQuestion}
                allQuestionsNumber={questions.length}
                questionNumber={currentIdx}
                question={questions[currentIdx].question}
                type={"checkbox"}
                options={questions[currentIdx].answers}
            />
        );
    }

    if (step === "end") {
        return <QuizEnded score={score} total={questions.length} />;
    }

    return null;
};

export default QuizNew;
