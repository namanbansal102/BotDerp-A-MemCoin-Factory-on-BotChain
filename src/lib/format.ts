export const shortAddress = (address?: string) =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

export const formatAmount = (value?: bigint) => {
  if (value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(value);
};

export const timeAgo = (seconds?: bigint) => {
  if (!seconds) return "";
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - Number(seconds));
  const units: [number, string][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [2592000, "day"],
    [31536000, "month"],
  ];
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  void units;
  return `${Math.floor(diff / 31536000)} year(s) ago`;
};

export const ipfsToHttp = (uri?: string) => {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${uri.replace("ipfs://", "")}`;
  }
  return uri;
};
