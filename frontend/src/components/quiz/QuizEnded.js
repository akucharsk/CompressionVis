import React from "react";

const QuizEnded = ({ score, total }) => {
    return (
        <div className="quiz-box">
            <h1>Quiz Completed!</h1>
            <p>Your score: {score} / {total}</p>
        </div>
    );
};

export default QuizEnded;
