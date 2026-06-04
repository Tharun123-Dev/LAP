/**
 * Generic CSV export — works for any array of flat objects.
 * Keys of the first object become the headers.
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`;

  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => escape(row[h])).join(','))
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Map a backend lead object to a flat CSV row.
 */
export function mapLeadToCSVRow(lead) {
  const getFieldValue = (label) => {
    const fv = (lead.field_values || []).find(
      v => (v.field?.label || '').toLowerCase().trim() === label.toLowerCase().trim()
    );
    return fv ? fv.value : '';
  };

  return {
    'ID': lead.id,
    'Full Name': lead.full_name || '',
    'Email': lead.email || '',
    'Phone': lead.phone || '',
    'Course of Interest': getFieldValue('Course of Interest'),
    'Source': getFieldValue('Source'),
    'Assigned Counselor': lead.counselor?.full_name || '',
    'Status': lead.status || '',
    'Date Created': lead.created_at
      ? new Date(lead.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : '',
    'Internal Notes': getFieldValue('Internal Notes'),
  };
}

export default exportToCSV;