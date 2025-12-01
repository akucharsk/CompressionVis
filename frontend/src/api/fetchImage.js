import {STATUS} from "../utils/enums/status";
import RetryLimitError from "../exceptions/RetryLimitError";
import {DEFAULT_RETRY_TIMEOUT_MS} from "../utils/constants";
import {handleApiError} from "../utils/errorHandler";

export const fetchImage = async (retries, url, controller = null) => {
    const resp = controller
        ? await fetch(url, { signal: controller.signal })
        : await fetch(url);

    if (resp.status === STATUS.HTTP_202_ACCEPTED) {
        if (retries === 0) {
            throw new RetryLimitError();
        }
        await new Promise(res => setTimeout(res, DEFAULT_RETRY_TIMEOUT_MS));
        return fetchImage(retries - 1, url, controller);
    }

    await handleApiError(resp);

    const blob = await resp.blob();
    return URL.createObjectURL(blob);
};