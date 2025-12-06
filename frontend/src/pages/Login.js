import { useCallback, useState } from "react";
import { MdError } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "../utils/urls";
import { useNavigate } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { fetchWithCredentials } from "../api/genericFetch";
import "../styles/pages/Login.css";

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
      console.log(error);
      showError(error);
    },
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    loginMutation.mutate();
  }, [loginMutation]);

  const renderLoginError = useCallback(() => {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "var(--background-second)", color: "var(--font-color)", border: "1px solid var(--netflix-red)", borderRadius: "8px", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <MdError size={20} style={{ color: "var(--netflix-red)" }} />
          <p style={{ color: "var(--netflix-red)", fontWeight: "bold" }}>{loginMutation?.error?.message || "Unexpected error occurred"}</p>
        </div>
        <p style={{ color: "var(--font-color)", fontWeight: "bold" }}>Reason: {loginMutation?.error?.response?.data?.message || "Unknown reason"}</p>
      </div>
    )
  }, [loginMutation.error]);

  return (
    <div className="main-panel">
      <div className="header-panel">
        <img src={"/logo192.png"} alt="Logo" style={{ width: "4rem", height: "4rem" }} />
        <span>ViCom</span>
      </div>
      <h1>Administrator Login</h1>
      {loginMutation.error && renderLoginError()}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}