import { NavLink, useLocation } from "react-router-dom";
import { MdQuiz } from "react-icons/md";
import { IoHome } from "react-icons/io5";

export default function QuizAccess({ setOpen, includeHome = false }) {
  const location = useLocation();
  const search = location.search;
  return (
    <div className="nav-subcontainer">
      <NavLink to={`/quiz/list${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
          onClick={() => setOpen(false)}>
          QUIZ
          <MdQuiz size={20} />
      </NavLink>
      { includeHome && (
        <NavLink to="/" className="nav-tab"
                onClick={() => setOpen(false)}>
          HOME
          <IoHome size={20} />
        </NavLink>
      )}
    </div>
  )
}