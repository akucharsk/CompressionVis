import Spinner from "../Spinner"

export function IndicatorOption({ label, isLoading, onChange, isChecked }) {
  const cursor = isLoading ? "not-allowed" : "pointer";
  return (
    <label>
      <div style={{ cursor, ...(isLoading && { backgroundColor: "transparent" }) }} className="indicator-option">
          <span>{ label }</span>
          <input
            type="checkbox"
            disabled={isLoading}
            checked={isChecked}
            onChange={onChange}
            style={{ cursor, accentColor: "red" }}
          />
          { isLoading && <Spinner size={16} /> }
      </div>
    </label>
  );
}
