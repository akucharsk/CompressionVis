import { useSearchParams } from "react-router-dom";
import { INDICATOR_OPTIONS } from "../../utils/constants";
import { IndicatorOption } from "./IndicatorOption";

export function extractIndicators(indicators) {
    return indicators?.split(",")?.filter(indicator => indicator in INDICATOR_OPTIONS) || [];
}

export default function IndicatorConfig({ loadingFields }) {
    const [ searchParams, setSearchParams ] = useSearchParams();

    const options = JSON.parse(JSON.stringify(INDICATOR_OPTIONS));
    loadingFields.forEach(field => {
        options[field].isLoading = true;
    });
    const indicators = extractIndicators(searchParams.get("indicators"));

    const onChange = (value) => {
        const newIndicators =
            indicators.includes(value) ?
            indicators.filter(indicator => indicator !== value).join(",") :
            indicators.concat([ value ]).join(",");
        setSearchParams(prev => {
            prev.set("indicators", newIndicators);
            return prev;
        });
    };

    return (
        <div className="indicators-config">
            <span className="indicators-config-heading">Indicators</span>
            <div className="indicator-options">
                { Object.values(INDICATOR_OPTIONS).map(({ label, value }) => (
                    <IndicatorOption
                        label={label}
                        isLoading={loadingFields.includes(value)}
                        onChange={() => onChange(value)}
                        isChecked={indicators.includes(value)}
                        key={value}
                    />
                ))}
            </div>
        </div>
    );
}
