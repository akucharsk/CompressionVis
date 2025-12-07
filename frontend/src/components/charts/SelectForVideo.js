import "../../styles/components/charts/SelectForVideo.css";
import { useState } from "react";

const SelectForVideo = ({ options, onChange }) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const choose = (opt) => {
        setSelected(opt);
        setOpen(false);
        onChange?.(opt);
    };

    return (
        <div className="select-wrapper">
            <div className="select-trigger" onClick={() => setOpen(!open)}>
                {selected ? (
                    <div className="select-selected">
                        <img src={selected.thumbnail} alt="" />
                        <span>{selected.name}</span>
                    </div>
                ) : (
                    <span>Wybierz...</span>
                )}
            </div>

            {open && (
                <div className="select-options">
                    {options.map(opt => (
                        <div
                            key={opt.id}
                            className="select-option"
                            onClick={() => choose(opt)}
                        >
                            <img src={opt.thumbnail} alt="" />
                            <span>{opt.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SelectForVideo;
