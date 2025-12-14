import { useState, useMemo } from "react";
import { useQuizes } from "../../hooks/quizes";
import { useSingleQuiz } from "../../hooks/quizes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithCredentials } from "../../api/genericFetch";
import { apiUrl } from "../../utils/urls";
import { useError } from "../../context/ErrorContext";
import "../../styles/components/admin/QuestionManager.css";

export default function QuestionManager() {
  const queryClient = useQueryClient();
  const [selectedSet, setSelectedSet] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { data } = useQuizes();
  const quizQuery = useSingleQuiz(selectedSet);
  const quiz = useMemo(() => quizQuery.data?.quiz || {}, [quizQuery.data?.quiz]);
  const { showError } = useError();

  const deleteMutation = useMutation({
    mutationFn: async () => await fetchWithCredentials(`${apiUrl}/quiz/${selectedSet}/`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizes"] });
      setSelectedSet(null);
    },
    onError: (error) => {
      showError(error);
    },
  })

  if (data?.quizes?.length === 0) {
    return (
      <div style={{ border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem" }}>
        <h3>Preview Questions</h3>
        <h3>No quizzes found</h3>
      </div>
    )
  }
  return (
    <div className="question-manager">
      <h3>Quiz List</h3>
      <div className="question-manager-list">
        {data?.quizes?.map(quiz => (
          <div key={quiz.id} onClick={() => setSelectedSet(quiz.id)} className="question-manager-list-item">
            <div className="quiz-details">
              <span><strong>ID:</strong> {quiz.id}</span>
              <span><strong>Name:</strong> {quiz.name}</span>
              <span><strong>Assets Location:</strong> {quiz.assets_location}</span>
            </div>
            <button onClick={() => deleteMutation.mutate()} disabled={typeof selectedSet !== "number" && !selectedSet}>
              Delete
            </button>
          </div>
        ))}
      </div>
      <h3>Preview Quiz</h3>
      <h3>ID: {quiz?.id}</h3>
      <button onClick={() => {setShowPreview(prev => !prev)}}>
        {showPreview ? "Hide" : "Show"}
      </button>
      {quiz && showPreview && (
          <pre style={{ maxHeight: "140vh", overflowY: "auto" }}>
              {JSON.stringify(quiz, null, 2)}
          </pre>
      )}
    </div>
  )
}