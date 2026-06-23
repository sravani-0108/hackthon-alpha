/** Case workflow status labels (distinct from alert status "Open"). */
export function formatCaseStatus(status: string): string {
  switch (status) {
    case 'Open':
      return 'Awaiting review';
    case 'Under Review':
      return 'Under review';
    case 'Assigned':
      return 'Assigned';
    case 'Closed':
      return 'Closed';
    case 'SAR Filed':
      return 'SAR filed';
    default:
      return status;
  }
}

export function caseStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Open':
    case 'Under Review':
      return 'badge-medium';
    case 'Assigned':
      return 'badge-high';
    case 'SAR Filed':
      return 'badge-critical';
    case 'Closed':
      return 'badge-low';
    default:
      return 'badge-medium';
  }
}
