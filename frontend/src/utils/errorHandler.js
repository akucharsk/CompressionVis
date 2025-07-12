export const handleApiError = async (response) => {
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMessage = data.message || data.error || `HTTP ${response.status}`;

        const error = new Error(errorMessage);
        error.statusCode = response.status;
        error.status = response.status;

        throw error;
    }
    return response;
};