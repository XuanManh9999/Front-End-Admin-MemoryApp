interface IFormatDateOptions {
  timeZone?: string;
}

function formatDate(isoString: string, options?: IFormatDateOptions): string {
  const date = new Date(isoString);

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: options?.timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(date).replace(",", "");
}

export { formatDate };
