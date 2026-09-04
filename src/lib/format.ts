export function money(n: number | null | undefined): string {
  return "TT$" + Number(n || 0).toLocaleString();
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return min + "m ago";
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + "h ago";
  const day = Math.floor(hr / 24);
  if (day < 7) return day + "d ago";
  return new Date(iso).toLocaleDateString();
}

export function countdown(endsAt: string | null, now: number): string {
  if (!endsAt) return "";
  let ms = new Date(endsAt).getTime() - now;
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3.6e6);
  const m = Math.floor((ms % 3.6e6) / 6e4);
  const sec = Math.floor((ms % 6e4) / 1000);
  return (h > 0 ? h + "h " : "") + m + "m " + String(sec).padStart(2, "0") + "s";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
