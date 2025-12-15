import { useCallback, useState } from "react";

export default function QuestionOption({
  optionClass,
  onClick,
  optionText,
  defaultIsChecked = false,
  disabled = false,
}) {
  const [isChecked, setIsChecked] = useState(defaultIsChecked);
  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick(!isChecked);
    setIsChecked(!isChecked);
  }, [isChecked, onClick, disabled]);
  return (
    <div
      className={`quiz-option ${optionClass} ${disabled ? "disabled" : ""}`}
      onClick={handleClick}
    >
      <input
        type="checkbox"
        style={{ cursor: "pointer" }}
        checked={isChecked}
        readOnly
      />
      <p>{optionText}</p>
    </div>
  );
}
