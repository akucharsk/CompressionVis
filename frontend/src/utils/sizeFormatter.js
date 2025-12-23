const SIZE_UNITS = ["B", "KB", "MB", "GB"];

export function sizeFormatter(size) {
    try {
        let newSize = Number(size);

        if (isNaN(newSize) || newSize < 0) {
            return "-|-";
        }

        let unitIndex = 0;

        while (newSize >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
            newSize /= 1024;
            unitIndex++;
        }

        return `${newSize.toFixed(2)} ${SIZE_UNITS[unitIndex]}`;
    } catch (e) {
        console.log("Error while formatting size. ", e);
        return "-|-";
    }
}
