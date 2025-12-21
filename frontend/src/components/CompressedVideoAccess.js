import { NavLink, useLocation } from "react-router-dom";
import { LuBlocks } from "react-icons/lu";
import { MdCompareArrows } from "react-icons/md";

export default function CompressedVideoAccess({ setOpen }) {
  const { search } = useLocation();
  return (
    <div className="nav-subcontainer">
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
    </div>
  )
}
