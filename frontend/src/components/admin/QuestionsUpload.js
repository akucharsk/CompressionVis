import { useState } from "react";
import QuestionsFormatInfo from "./QuestionsFormatInfo";
import { apiUrl } from "../../utils/urls";
import { fetchWithCredentials } from "../../api/genericFetch";
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useError } from "../../context/ErrorContext";

const QuestionsUpload = () => {
    const queryClient = useQueryClient();
    const [file, setFile] = useState(null);
    const { showError } = useError();
    const handleUpload = useCallback(async () => {
        if (!file) return alert("Please select a ZIP file!");

        const formData = new FormData();
        formData.append("file", file);
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
        </div>
    );
};

export default QuestionsUpload;
