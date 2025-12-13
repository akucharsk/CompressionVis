import { useCallback, useState } from "react";

export default function QuestionOption({
  optionClass,
  onClick,
  optionText,
  defaultIsChecked = false,
}) {
  const [isChecked, setIsChecked] = useState(defaultIsChecked);
  const handleClick = useCallback(() => {
    onClick(!isChecked);
    setIsChecked(!isChecked);
  }, [isChecked, onClick]);
  return (
    <div
      className={`quiz-option ${optionClass}`}
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
