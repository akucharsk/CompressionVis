import { NavLink, useLocation } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { FiList } from "react-icons/fi";
import { MdQuiz } from "react-icons/md";

export default function GeneralAccess({ setOpen }) {
  const { search, pathname } = useLocation();

  return (
    <div className="nav-subcontainer">
      <NavLink to={`/compressed${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
             onClick={() => setOpen(false)}>
        VIDEOS
        <FiList size={20} />
      </NavLink>
      <NavLink to={`/quiz/list${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
          onClick={() => setOpen(false)}>
          QUIZ
          <MdQuiz size={20} />
      </NavLink>
      { pathname !== "/" && <NavLink to="/" className="nav-tab"
              onClick={() => setOpen(false)}>
          HOME
          <IoHome size={20} />
      </NavLink> }
    </div>
  )
}