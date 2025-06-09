import {STATUS} from "../utils/enums/status";
import RetryLimitError from "../exceptions/RetryLimitError";
import {DEFAULT_RETRY_TIMEOUT_MS} from "../utils/constants";
import {data} from "react-router-dom";

export const fetchImage = async (retries, url, controller = null) => {

    const resp =
        controller !== null ?
            await fetch(url, { signal: controller.signal }) :
            await fetch(url);

    if (resp.status === STATUS.HTTP_102_PROCESSING) {
        if (retries === 0) {
            throw new RetryLimitError();
        }
        await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_TIMEOUT_MS));
        return await fetchImage(retries - 1, url, controller).catch(console.error);
    }
    if (!resp.ok) {
        const data = await resp.text();
        throw new Error(`${resp.status}: ${data}`);
    }
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
}