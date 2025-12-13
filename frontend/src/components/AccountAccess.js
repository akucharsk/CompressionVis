import { NavLink } from "react-router-dom";
import { useIdentity } from "../hooks/identity";
import Spinner from "./Spinner";
import { useError } from "../context/ErrorContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "../utils/urls";
import { useCallback } from "react";
import { fetchWithCredentials } from "../api/genericFetch";
import { IoLogInOutline, IoLogOutOutline, IoHome } from "react-icons/io5";
import { MdAdminPanelSettings } from "react-icons/md";

export default function AccountAccess({ setOpen, includeHome = false }) {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useIdentity();
  const { showError } = useError();
  const logoutMutation = useMutation({
    mutationFn: async () => await fetchWithCredentials(`${apiUrl}/logout/`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whoami"] });
    },
    onError: (error) => {
      showError(error);
    },
  });
  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    setOpen(false);
  }, [logoutMutation, setOpen]);
  if (isPending) return <Spinner />;
  if (error) showError(error);
  if (!data?.isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column"}}>
        { includeHome && (
          <NavLink to="/" className="nav-tab"
                  onClick={() => setOpen(false)}>
            HOME
            <IoHome size={20} />
          </NavLink>
        )}
        <NavLink to="/login" className="nav-tab"
              onClick={() => setOpen(false)}>
          LOGIN
          <IoLogInOutline size={20} />
        </NavLink>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column"}}>
      { includeHome && (
          <NavLink to="/" className="nav-tab"
                  onClick={() => setOpen(false)}>
            HOME
            <IoHome size={20} />
          </NavLink>
      )}
      <NavLink to="/admin" className="nav-tab"
              onClick={() => setOpen(false)}>
          ADMIN PANEL
          <MdAdminPanelSettings size={20} />
      </NavLink>
      <button className="nav-tab" onClick={handleLogout}>
          LOGOUT
          <IoLogOutOutline size={20} />
      </button>
    </div>
  )
}