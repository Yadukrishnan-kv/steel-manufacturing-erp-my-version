/*
  Warnings:

  - You are about to drop the column `created_at` on the `customer_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `customer_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `customer_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `sales_order_id` on the `customer_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `service_request_id` on the `customer_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `customer_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `customer_portal_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `customer_portal_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `customer_portal_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `last_login` on the `customer_portal_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `customer_portal_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `customer_portal_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `document_type` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `file_name` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `file_path` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `file_size` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `mime_type` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `sales_order_id` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `service_request_id` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `documents` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `customer_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `customer_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `customer_portal_credentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `customer_portal_credentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `customer_portal_credentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentType` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customer_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "serviceRequestId" TEXT,
    "salesOrderId" TEXT,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "customer_feedback_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "customer_feedback_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_customer_feedback" ("category", "feedback", "id", "rating") SELECT "category", "feedback", "id", "rating" FROM "customer_feedback";
DROP TABLE "customer_feedback";
ALTER TABLE "new_customer_feedback" RENAME TO "customer_feedback";
CREATE INDEX "customer_feedback_customerId_idx" ON "customer_feedback"("customerId");
CREATE INDEX "customer_feedback_rating_idx" ON "customer_feedback"("rating");
CREATE TABLE "new_customer_portal_credentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_portal_credentials_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customer_portal_credentials" ("email", "id") SELECT "email", "id" FROM "customer_portal_credentials";
DROP TABLE "customer_portal_credentials";
ALTER TABLE "new_customer_portal_credentials" RENAME TO "customer_portal_credentials";
CREATE UNIQUE INDEX "customer_portal_credentials_customerId_key" ON "customer_portal_credentials"("customerId");
CREATE UNIQUE INDEX "customer_portal_credentials_email_key" ON "customer_portal_credentials"("email");
CREATE TABLE "new_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "salesOrderId" TEXT,
    "serviceRequestId" TEXT,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_documents" ("id") SELECT "id" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
CREATE INDEX "documents_customerId_idx" ON "documents"("customerId");
CREATE INDEX "documents_documentType_idx" ON "documents"("documentType");
CREATE TABLE "new_service_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "amcContractId" TEXT,
    "warrantyInfo" TEXT,
    "completionDate" DATETIME,
    "customerRating" INTEGER,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "service_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_requests_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "service_requests_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_requests" ("amcContractId", "assignedTo", "completionDate", "createdAt", "createdBy", "customerId", "customerRating", "description", "feedback", "id", "location", "priority", "salesOrderId", "scheduledDate", "serviceNumber", "status", "type", "updatedAt", "updatedBy", "warrantyInfo") SELECT "amcContractId", "assignedTo", "completionDate", "createdAt", "createdBy", "customerId", "customerRating", "description", "feedback", "id", "location", "priority", "salesOrderId", "scheduledDate", "serviceNumber", "status", "type", "updatedAt", "updatedBy", "warrantyInfo" FROM "service_requests";
DROP TABLE "service_requests";
ALTER TABLE "new_service_requests" RENAME TO "service_requests";
CREATE UNIQUE INDEX "service_requests_serviceNumber_key" ON "service_requests"("serviceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
