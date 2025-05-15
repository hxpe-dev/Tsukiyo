const statusMap: Record<string, string> = {
  completed: 'Completed',
  ongoing: 'Ongoing',
  hiatus: 'On hiatus',
  cancelled: 'Cancelled',
};

export function getStatusText(status: string): string {
  const statusText = statusMap[status.toLowerCase()];
  return statusText ? statusText : 'Unknown';
}
