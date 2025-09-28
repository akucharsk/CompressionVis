import { useSearchParams } from "react-router-dom";
import { INDICATOR_OPTIONS } from "../../utils/constants";
import Select, { components } from "react-select";
import Spinner from "../Spinner";
import { SlArrowDownCircle, SlArrowUpCircle } from "react-icons/sl";

export default function IndicatorConfig({ loadingFields }) {
    const [ searchParams, setSearchParams ] = useSearchParams();

    const options = { ...INDICATOR_OPTIONS };
    loadingFields.forEach(field => {
        options[field].isLoading = true;
    });
    const indicator = searchParams.get("indicator") || "none";

    const Option = (props) => {
        const { data } = props;
        data.isDisabled = data.isLoading;
        return (
            <components.Option {...props}>
                <div style={{ display: 'flex', alignItems: 'center', gap: "5px" }}>
                    { data.isLoading && <Spinner size={15} />}
                    <span>{ data.label }</span>
                </div>
            </components.Option>
        );
    };

    const DropdownIndicator = (props) => {
        const { menuIsOpen } = props.selectProps;
        return (
            <components.DropdownIndicator {...props}>
                { menuIsOpen ? <SlArrowUpCircle /> : <SlArrowDownCircle /> }
            </components.DropdownIndicator>
        );
    };

    const indicatorConfigStyles = {
        control: (styles) => ({ ...styles, backgroundColor: "var(--background-second)", color: "white", cursor: "pointer", borderColor: "var(--netflix-gray)" }),
        option: (styles, { data, isDisabled, isFocused }) => {
            let style = { cursor: "pointer" };
            if (data.disabled || isDisabled) {
                style.backgroundColor = "#333333";
                style.color = "#aaaaaa";
                style.cursor = "not-allowed"
            } else if (isFocused) {
                style.backgroundColor = "#888888";
            } else {
                style.backgroundColor = "var(--background-second)";
            }
            return {
                ...styles,
                ...style
            }
        },
        singleValue: (styles) => ({ ...styles, color: "white" }),
        menu: (styles) => ({ ...styles, backgroundColor: "var(--background-second)" })
    }

    return (
        <div className="indicator-config">
            <span className="indicator-config-heading">Indicator</span>
            <Select 
                value={options[indicator]}
                options={Object.values(options)}
                onChange={(newValue) => {
                    if (newValue.isDisabled)
                        return;
                    setSearchParams(prev => {
                        newValue.value === "none" ? prev.delete("indicator") : prev.set("indicator", newValue.value);
                        return prev;
                    })
                }}
                components={{ Option, DropdownIndicator }}
                styles={indicatorConfigStyles}
            />
        </div>
    );
}
