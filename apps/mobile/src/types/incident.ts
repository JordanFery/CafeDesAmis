export type IncidentReasonType =
  | "BEHAVIOR"
  | "LATE_ABSENCE"
  | "CONFLICT"
  | "PROCEDURE_NON_COMPLIANCE"
  | "CUSTOMER_ISSUE"
  | "OTHER";

export type IncidentStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type IncidentReason = {
  id: string;
  name: string;
  type: IncidentReasonType;
};

export type IncidentEmployeeRef = {
  user: { id: string; firstName: string; lastName: string };
};

export type Incident = {
  id: string;
  locationId: string;
  incidentDate: string;
  description: string;
  recurrence: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  status: IncidentStatus;
  reason: IncidentReason;
  reportedBy: { id: string; firstName: string; lastName: string };
  employees: IncidentEmployeeRef[];
};

export type CreateIncidentInput = {
  locationId: string;
  incidentDate: string;
  reasonId: string;
  description: string;
  recurrence?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  employeeIds?: string[];
};
