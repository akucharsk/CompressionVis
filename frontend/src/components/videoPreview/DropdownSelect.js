import React from "react";

const DropdownSelect = ({ label, value, onChange, options, disabled = false }) => (
    <div className={`dropdown ${disabled ? "dropdown-disabled" : ""}`}>
        <label>{label}</label>
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            {options.map((opt) => (
                <option key={`${label}:${opt.value}`} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

export default DropdownSelect;
