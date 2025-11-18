// resources/js/Pages/JobAssignments/types.ts
export interface Assignment {
    id: number;
    stage: string | null;
    job_card: {
        job_no: string;
        service_inward: { rma: string; contact: { name: string; phone: string; email: string } };
    };
    user: { name: string };
    status: { name: string };
    assigned_at: string;
    started_at: string | null;
    completed_at: string | null;
    time_spent_minutes: number;
    report?: string;
    engineer_note?: string;
    billing_amount?: number;
    billing_details?: string;
    billing_confirmed_by?: { name: string } | null;
    delivered_confirmed_at?: string | null;
    delivered_confirmed_by?: string;
    delivered_otp?: string;
    customer_satisfaction_rating?: number | null;
    merit_points?: number;
    admin_verifier?: { name: string } | null;
    admin_verified_at?: string | null;
    admin_verification_note?: string;
    auditor?: { name: string } | null;
    audited_at?: string | null;
    audit_note?: string;
}

export interface Props {
    assignment: Assignment;
    can: { update: boolean; delete: boolean; adminClose: boolean };
    supervisors: { id: number; name: string }[];
    users: { id: number; name: string }[];
}
