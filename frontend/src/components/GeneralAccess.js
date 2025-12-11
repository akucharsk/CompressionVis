import { NavLink, useLocation } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { MdQuiz, MdCompareArrows } from "react-icons/md";
import { LuBlocks } from "react-icons/lu";

export default function GeneralAccess({ setOpen }) {
  const location = useLocation();
  const search = location.search;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem"}}>
      <NavLink to="/" className="nav-tab"
              onClick={() => setOpen(false)}>
          HOME
          <IoHome size={20} />
      </NavLink>
      <NavLink to={`/compress${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}
      >
          MACROBLOCKS
          <LuBlocks size={20} />
      </NavLink>
      <NavLink to={`/comparison${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}>
          COMPARISON
          <MdCompareArrows size={20} />
      </NavLink>
      <NavLink to={`/quiz/list${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}>
          QUIZ
          <MdQuiz size={20} />
      </NavLink>
    </div>
  )
}