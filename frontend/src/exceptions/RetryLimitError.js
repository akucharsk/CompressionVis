export default class RetryLimitError extends Error {
    constructor(message = "Retry limit reached when trying to fetch data. Please try again later.") {
        super(message);
        this.name = 'RetryLimitError';
    }
}