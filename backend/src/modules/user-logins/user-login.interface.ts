import { tags } from "typia";

export interface UserLogin {
    id: number;
    user_id: number;
    login_time: string & tags.Format<"date-time">;
    logout_time?: string & tags.Format<"date-time"> | null;
    session_duration_seconds?: number | null;
    ip_address: string;
    region: string;
    device_type: string;
    browser: string;
    created_at: string & tags.Format<"date-time">;
    updated_at: string & tags.Format<"date-time">;
}