-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_logins" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL,
    "logout_time" TIMESTAMP(3),
    "session_duration_seconds" INTEGER,
    "ip_address" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_logins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "user_logins_user_id_idx" ON "public"."user_logins"("user_id");

-- CreateIndex
CREATE INDEX "user_logins_login_time_idx" ON "public"."user_logins"("login_time");

-- CreateIndex
CREATE INDEX "user_logins_region_idx" ON "public"."user_logins"("region");

-- CreateIndex
CREATE INDEX "user_logins_device_type_idx" ON "public"."user_logins"("device_type");

-- CreateIndex
CREATE INDEX "user_logins_browser_idx" ON "public"."user_logins"("browser");

-- AddForeignKey
ALTER TABLE "public"."user_logins" ADD CONSTRAINT "user_logins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
