import { useError } from "../context/ErrorContext";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";
import { useIdentity } from "../hooks/identity";

export default function Protected({ children }) {
  const navigate = useNavigate();
  const { data, isPending, error } = useIdentity();
  const { showError } = useError();
  if (isPending) return <Spinner />;
  if (error) showError(error);
  if (!data?.isAdmin) navigate("/");
  return children;
}