import React from "react";

export default function QuestionsFormatInfo() {
    const example = {
        name: "Quiz 1",
        description: "This is a quiz about the capital of France",
        video_filename: "video.mp4",
        questions: [
            {
                question: "What is the capital of France?",
                answers: [
                    { text: "Paris", is_correct: true },
                    { text: "London", is_correct: false },
                    { text: "Berlin", is_correct: false }
                ],
                image: null
            },
            {
                question: "Which animal is shown in the picture?",
                answers: [
                    { text: "Dog", is_correct: false },
                    { text: "Cat", is_correct: true },
                    { text: "Rabbit", is_correct: false }
                ],
                image: "cat.jpg"
            }
        ]
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>questions.json File Format</h3>

            <p>The ZIP file can contain multiple quizzes (JSON files) as well as images related to the quizzes, nested in directories.</p>
            <p><strong>Structure of a single quiz:</strong></p>
            <ul>
                <li><strong>The name of the quiz</strong> - the name of the quiz</li>
                <li><strong>The description of the quiz</strong> - the description of the quiz</li>
                <li><strong>The name of the video file (optional)</strong> - the name of the video file if the quiz is associated with a video</li>
                <li><strong>The questions</strong></li>
            </ul>

            <p><strong>Structure of a single question:</strong></p>
            <ul>
                <li><code>question</code> – the question text</li>
                <li><code>answers</code> – a list of possible answers</li>
                <li>
                    each answer contains:
                    <ul>
                        <li><code>text</code> – answer text</li>
                        <li><code>is_correct</code> – <code>true</code> / <code>false</code></li>
                    </ul>
                </li>
                <li><code>image</code> – (optional) name of the image file inside the ZIP, or <code>null</code>. The image must be in the same directory as the quiz JSON file.</li>
            </ul>

            <p><strong>Example questions.json:</strong></p>
            <pre>{JSON.stringify(example, null, 2)}</pre>
        </div>
    );
}
