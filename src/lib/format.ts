export function formatBytes(bytes: number, decimals: number = 2) {
	if (!+bytes) return "0 B";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function formatUptime(seconds: number, t: (key: string) => string) {
	if (seconds >= 86400) {
		return `${Math.floor(seconds / 86400)} ${t("serverCard.days")}`;
	} else {
		return `${Math.floor(seconds / 3600)} ${t("serverCard.hours")}`;
	}
}
