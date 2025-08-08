/*
  Warnings:

  - You are about to drop the `user_logins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_logins" DROP CONSTRAINT "user_logins_user_id_fkey";

-- DropTable
DROP TABLE "public"."user_logins";

-- DropTable
DROP TABLE "public"."users";

-- CreateTable
CREATE TABLE "public"."UserLogin" (
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

    CONSTRAINT "UserLogin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLogin_user_id_idx" ON "public"."UserLogin"("user_id");

-- CreateIndex
CREATE INDEX "UserLogin_login_time_idx" ON "public"."UserLogin"("login_time");

-- CreateIndex
CREATE INDEX "UserLogin_region_idx" ON "public"."UserLogin"("region");

-- CreateIndex
CREATE INDEX "UserLogin_device_type_idx" ON "public"."UserLogin"("device_type");

-- CreateIndex
CREATE INDEX "UserLogin_browser_idx" ON "public"."UserLogin"("browser");
