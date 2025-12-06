import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "../utils/urls";
import { useNavigate } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { fetchWithCredentials } from "../api/genericFetch";

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const showError = useError();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithCredentials(`${apiUrl}/login/`, {
        method: "POST",
        body: {
          username,
          password,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whoami"] });
      navigate("/admin");
    },
    onError: (error) => {
      showError(error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", margin: "auto", gap: "3rem", padding: "2rem", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <img src={"/logo192.png"} alt="Logo" style={{ width: "4rem", height: "4rem" }} />
        <span style={{ fontSize: "2rem", fontWeight: "bold", fontStyle: "italic", color: "#aaa" }}>ViCom</span>
      </div>
      <h1>Administrator Login</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ backgroundColor: "var(--background-second)", color: "var(--font-color)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem" }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ backgroundColor: "var(--background-second)", color: "var(--font-color)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.5rem" }} />
        <button type="submit" style={{ backgroundColor: "var(--netflix-red)", color: "var(--font-color)", border: "none", borderRadius: "8px", padding: "0.5rem", width: "100%", cursor: "pointer" }}>Login</button>
      </form>
    </div>
  )
}