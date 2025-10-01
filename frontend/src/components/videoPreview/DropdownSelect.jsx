import React from "react";

const DropdownSelect = ({ label, value, onChange, options }) => (
    <div className="dropdown">
        <label>{label}</label>
        <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
                <option key={`${label}:${opt.value}`} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);


export default DropdownSelect;
