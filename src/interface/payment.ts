export interface IPayment {
    id: number;
    user_id: number;
    name: string | null;
    email: string | null;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string; // ISO datetime
}

export interface IPaymentStats {
    period: string; // "2025-10-01" | "2025-10" | "2025"
    payments_count: number;
    total_amount: number;
}

export interface IUpcomingRenewal {
    subscription_id: number;
    user_id: number;
    plan: string;
    start_date: string; // 'YYYY-MM-DD'
    end_date: string; // 'YYYY-MM-DD'
    name: string;
    email: string;
}

export interface IRegistrationStats {
    period: string; // "2025-10-01" | "2025-10" | "2025"
    registrations: number;
}
