import { tags } from "typia/lib/module";

export interface IUserLogin {
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

export namespace IUserLogin {
  export interface ICreate {
    user_id: number;
    login_time: string & tags.Format<"date-time">;
    logout_time?: string & tags.Format<"date-time"> | null;
    session_duration_seconds?: number | null;
    ip_address: string;
    region: string;
    device_type: string;
    browser: string;
  }

  export interface IResponse {
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

  export interface IUpdate {
    id: number;
    logout_time?: string & tags.Format<"date-time"> | null;
  }
}