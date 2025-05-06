import React from "react";

const QuizMenu = ({ startQuiz }) => {
    return (
        <div className="quiz-box">
            <h1>Test your knowledge</h1>
            <p>This short quiz will help you verify your uderstanding of video compression principles
                demonstrated in the application. You'll be asked questions related to the compression 
                method used (e.g. H.264), frame types (I/P/B), macroblocks, quality metrics, and differences
                between original and compressed video frames. After submitting each answer, you'll receive
                immediate feedback with detailed explanations to support your learning.
            </p>
            <p>
                Get ready to challenge yourself and reinforce your understanding!
            </p>
            <button onClick={startQuiz}>START QUIZ</button>
        </div>
    );
};

export default QuizMenu;