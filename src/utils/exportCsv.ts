import { ServiceRequest } from '../types';

export function exportRequestsToCSV(requests: ServiceRequest[], filenamePrefix = 'mini_ecitizen_requests') {
  if (!requests.length) return;

  const headers = [
    'Request ID',
    'Date Submitted',
    'Citizen Name',
    'Citizen Email',
    'Category',
    'Location',
    'Status',
    'Description',
    'Admin Notes',
    'Last Updated',
  ];

  const escapeCSV = (str?: string) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = requests.map((req) => [
    escapeCSV(req.id),
    escapeCSV(new Date(req.createdAt).toLocaleString()),
    escapeCSV(req.userName || 'Anonymous'),
    escapeCSV(req.userEmail || 'N/A'),
    escapeCSV(req.category),
    escapeCSV(req.location),
    escapeCSV(req.status),
    escapeCSV(req.description),
    escapeCSV(req.adminNote || 'None'),
    escapeCSV(new Date(req.updatedAt).toLocaleString()),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
