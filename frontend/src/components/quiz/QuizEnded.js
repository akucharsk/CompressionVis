import React from "react";

const QuizEnded = ({ userAnswers, questions }) => {

    console.log(questions)

    const arraysEqual = (a, b) => {
        if (a.length !== b.length) return false;
        return a.every((val, index) => val === b[index]);
    };

    const countScore = () => {
        let score = 0
        console.log(userAnswers)

        for (let i = 0; i < userAnswers.length; i ++) {
            console.log(userAnswers[i], questions[i].correctAnswer, "SIEMA")
            if (Array.isArray(userAnswers[i]) && Array.isArray(questions[i].correctAnswer)) {
                if (arraysEqual(userAnswers[i], questions[i].correctAnswer)) {
                    score += 1;
                }
            } else if (userAnswers[i] === questions[i].correctAnswer) {
                score += 1;
            }
        }

        return score
    }

    return (
        <div className="quiz-box">
            <h1>Quiz Completed!</h1>
            <p>Your score: {countScore()} / {questions.length}</p>
        </div>
    );
};

export default QuizEnded;
