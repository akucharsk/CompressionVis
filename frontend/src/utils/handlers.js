export const handleError = (error, throwFurther = false, handleAbort = false) => {
    if (!handleAbort && error.name === "AbortError") {
        return;
    }
    if (throwFurther) {
        throw error;
    }
    console.error(error);
}
