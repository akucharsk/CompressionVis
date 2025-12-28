import { useState } from "react";
import QuestionsFormatInfo from "./QuestionsFormatInfo";
import { apiUrl } from "../../utils/urls";
<<<<<<< HEAD

const QuestionsUpload = () => {
    const [file, setFile] = useState(null);
    const [selectedSet, setSelectedSet] = useState(1);
    const [questions, setQuestions] = useState(null);

    const handleUpload = async () => {
=======
import { fetchWithCredentials } from "../../api/genericFetch";
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useError } from "../../context/ErrorContext";

const QuestionsUpload = () => {
    const queryClient = useQueryClient();
    const [file, setFile] = useState(null);
    const { showError } = useError();
    const handleUpload = useCallback(async () => {
>>>>>>> master
        if (!file) return alert("Please select a ZIP file!");

        const formData = new FormData();
        formData.append("file", file);
<<<<<<< HEAD

        try {
            const res = await fetch(`${apiUrl}/upload-questions/`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            alert(data.message);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        }
    };

    const handleFetchQuestions = async () => {
        try {
            const res = await fetch(`${apiUrl}/questions/${selectedSet}/`);
            if (!res.ok) throw new Error("Failed to fetch questions");

            const data = await res.json();
            setQuestions(data);
        } catch (err) {
            console.error(err);
            alert("Error fetching questions.");
        }
    };

    const handleDownloadZip = () => {
        window.open(`${apiUrl}/download-questions/`, "_blank");
    };

    return (
        <div style={{ marginTop: "30px" }}>
            <h2>Import Questions (ZIP)</h2>

            <input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files[0])}
            />
            <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
                Upload
            </button>

            <hr />

            <h3>Preview Questions</h3>
            <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
            >
                {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>questions{n}.json</option>
                ))}
            </select>
            <button onClick={handleFetchQuestions} style={{ marginLeft: "10px" }}>
                Show
            </button>

            {questions && (
                <pre>
                    {JSON.stringify(questions, null, 2)}
                </pre>
            )}

            <QuestionsFormatInfo />

            <hr />

            <button onClick={handleDownloadZip}>Download Current ZIP</button>
=======
        return await fetchWithCredentials(`${apiUrl}/upload-questions/`, {
            method: "POST",
            body: formData,
        });
    }, [file]);

    const fileUploadMutation = useMutation({
        mutationFn: handleUpload,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["quizes"] });
            alert("Upload successful.");
        },
        onError: (err) => {
            showError(err);
        },
    });

    return (
        <div style={{ marginTop: "30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <h2>Import Questions (ZIP)</h2>
            <QuestionsFormatInfo />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem", gap: "1rem" }}>
                <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setFile(e.target.files[0])}
                    hidden
                    id="zip-upload"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontWeight: "bold" }}>
                    <label htmlFor="zip-upload">
                        Choose ZIP file
                    </label>
                    { file && <p>{file.name}</p> }
                </div>
                <button onClick={fileUploadMutation.mutate}>
                    Upload
                </button>
            </div>
>>>>>>> master
        </div>
    );
};

export default QuestionsUpload;
