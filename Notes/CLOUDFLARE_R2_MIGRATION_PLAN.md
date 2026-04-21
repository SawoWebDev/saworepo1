# Cloudflare R2 Migration Plan - SAWO Admin Panel

**Document Version**: 1.0  
**Date**: April 17, 2026  
**Status**: Planning Phase  
**Current Storage**: Supabase Storage → **Target**: Cloudflare R2

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Target Architecture](#target-architecture)
4. [Advantages of R2 vs Supabase](#advantages-of-r2-vs-supabase)
5. [Implementation Phases](#implementation-phases)
6. [Detailed Steps Per Phase](#detailed-steps-per-phase)
7. [Code Changes Required](#code-changes-required)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)
10. [Timeline & Milestones](#timeline--milestones)
11. [Risk Assessment](#risk-assessment)

---

## 📊 Executive Summary

The SAWO Admin Panel currently uses **Supabase Storage** for managing product images and PDFs. This plan outlines a migration to **Cloudflare R2** for the following benefits:

- **Cost Reduction**: R2 offers cheaper egress pricing and storage rates
- **Performance**: Cloudflare's global CDN for faster delivery
- **Flexibility**: Direct S3-compatible API for better control
- **Scalability**: Better suited for larger file volumes

**Estimated Timeline**: 4-6 weeks  
**Risk Level**: Medium (requires careful data migration and testing)

---

## 🏗️ Current Architecture Analysis

### Storage Structure
```
CURRENT STATE (Supabase Storage):
├── Buckets
│   ├── product-images/     (Product photos, spec images, thumbnails)
│   └── product-pdf/        (Product documentation PDFs)
└── Database (PostgreSQL via Supabase)
    └── products table
        ├── thumbnail: text (URL string)
        ├── images: text[] (URL array)
        ├── spec_images: text[] (URL array)
        └── files: jsonb[] (objects with .url property)
```

### Current Upload Flow
1. **Frontend** (React - `Products.jsx`)
   - File selected by user
   - Image conversion to WebP (if applicable)
   - Direct upload to Supabase via `uploadFileToSupabase()`
   - Public URL stored in database

2. **Supabase Storage**
   - Handles file storage and public URL generation
   - Manages access policies and authentication

3. **Database**
   - Stores references (URLs) to files
   - No file path transformation logic

### File Types Handled
- **Images**: JPG, PNG, WebP (converted to WebP)
- **PDFs**: Direct upload, no conversion
- **Storage Buckets**: 
  - `product-images` - all product imagery
  - `product-pdf` - product documentation

### Current Implementation Details
```javascript
// Location: frontend/src/Administrator/Products.jsx
async function uploadFileToSupabase(file, bucket = "product-images") {
  // Converts images to WebP
  // Generates unique filename with timestamp
  // Uploads to Supabase storage
  // Returns public URL for storage in database
}
```

---

## 🎯 Target Architecture

### R2 Storage Structure
```
TARGET STATE (Cloudflare R2):
├── R2 Bucket (sawo-production)
│   ├── product-images/    (Product photos, spec images, thumbnails)
│   │   ├── YYYY/MM/DD/    (Organized by date)
│   │   └── *.webp
│   ├── product-pdf/       (Product documentation)
│   │   ├── YYYY/MM/DD/
│   │   └── *.pdf
│   └── thumbnails/        (Resized/optimized images)
├── CDN (Cloudflare Workers or direct R2 public URL)
└── Database (No changes to schema)
    └── products table (URLs point to R2/CDN)
```

### Upload Flow Architecture
```
┌─────────────────┐
│  React Frontend │
│   (Products.jsx)│
└────────┬────────┘
         │
         ├─────> File Validation
         ├─────> WebP Conversion
         └─────> Direct to R2 via API
                 OR
                 Backend Proxy
                 
         │
         ▼
┌──────────────────────────────┐
│  Cloudflare R2 (S3-compatible)│
│  ├── product-images/         │
│  ├── product-pdf/            │
│  └── Public URL generation   │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Cloudflare CDN + Workers    │
│  (Optional image optimization)│
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  MySQL Database              │
│  (Store R2 URLs)             │
└──────────────────────────────┘
```

---

## 💡 Advantages of R2 vs Supabase

| Feature | Supabase | Cloudflare R2 | Winner |
|---------|----------|---------------|--------|
| **Egress Cost** | $0.15/GB | $0/GB | R2 ✅ |
| **Storage Cost** | $5/GB/month | $0.015/GB | R2 ✅ |
| **API Type** | Custom | S3-Compatible | R2 ✅ |
| **Global CDN** | Limited | Full Cloudflare Edge | R2 ✅ |
| **Request Cost** | Included | $0.36/million reads | Supabase ✅ |
| **Setup Complexity** | Low | Medium | Supabase ✅ |
| **Control** | Limited | Full | R2 ✅ |
| **Image Optimization** | Basic | Workers Integration | R2 ✅ |

---

## 📅 Implementation Phases

### Phase 1: Foundation & Setup (Week 1)
- [ ] Create Cloudflare R2 bucket
- [ ] Configure R2 credentials and API tokens
- [ ] Set up CORS and access policies
- [ ] Create development bucket for testing

### Phase 2: Backend Integration (Week 1-2)
- [ ] Install AWS SDK / Cloudflare R2 SDK
- [ ] Create R2 utility functions in backend
- [ ] Implement file upload endpoints
- [ ] Add error handling and validation

### Phase 3: Frontend Integration (Week 2)
- [ ] Update upload functions to use new backend endpoints or direct R2
- [ ] Modify `uploadFileToSupabase()` → `uploadFileToR2()`
- [ ] Test file uploads with new system
- [ ] Maintain backward compatibility during transition

### Phase 4: Data Migration (Week 3)
- [ ] Script to fetch all files from Supabase
- [ ] Migrate files to R2 maintaining structure
- [ ] Update database URLs to point to R2
- [ ] Verify all URLs work correctly

### Phase 5: Testing & Validation (Week 3-4)
- [ ] End-to-end upload tests
- [ ] Download/display tests for all file types
- [ ] Performance benchmarks
- [ ] User acceptance testing

### Phase 6: Deployment & Rollback (Week 4-5)
- [ ] Production deployment
- [ ] Monitor for errors
- [ ] Keep Supabase data as backup
- [ ] Document any issues

### Phase 7: Cleanup & Optimization (Week 5-6)
- [ ] Disable Supabase storage uploads
- [ ] Implement optional image optimization via Workers
- [ ] Set up monitoring and logging
- [ ] Remove Supabase bucket after 30-day confirmation period

---

## 🔧 Detailed Steps Per Phase

### Phase 1: Foundation & Setup

#### Step 1.1: Create R2 Bucket
1. Log in to Cloudflare Dashboard
2. Navigate to **R2** → **Create bucket**
3. Bucket name: `sawo-production` (or `sawo-staging` for development)
4. Region: Select geographically closest region
5. Configuration:
   - [ ] Enable CORS
   - [ ] Allow public reads for CDN
   - [ ] Set lifecycle rules (optional: delete old files after X days)

#### Step 1.2: Configure Access Credentials
1. Navigate to **R2** → **Bucket Settings** → **API tokens**
2. Create new API token with:
   - **Permissions**: Read + Write on bucket
   - **Bucket**: sawo-production
   - **TTL**: No expiration (or yearly rotation)
3. Store credentials securely:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_ACCESS_KEY_ID`
   - `CLOUDFLARE_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET_NAME`

#### Step 1.3: Set Up Environment Variables

**Backend (`.env` or `process.env`)**
```env
# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=sawo-production
CLOUDFLARE_R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com

# Alternative: Using Cloudflare's domain
R2_PUBLIC_URL=https://sawo-assets.your-domain.com
```

**Frontend (`.env`)**
```env
# Option A: Backend proxy (recommended for security)
REACT_APP_UPLOAD_API=https://api.sawogroup.com/api/upload

# Option B: Direct R2 (requires CORS setup)
REACT_APP_R2_BUCKET_URL=https://sawo-assets.your-domain.com
```

#### Step 1.4: CORS Configuration
In Cloudflare R2 bucket settings, configure CORS:
```json
[
  {
    "AllowedOrigins": ["https://admin.sawogroup.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

---

### Phase 2: Backend Integration

#### Step 2.1: Install Dependencies

```bash
cd backend
npm install aws-sdk
# or
npm install @aws-sdk/client-s3
```

#### Step 2.2: Create R2 Upload Utility

**File: `backend/utils/r2Upload.js`**

```javascript
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to Cloudflare R2
 * @param {Buffer} fileBuffer - File content
 * @param {string} fileName - File name with extension
 * @param {string} bucket - Bucket name (product-images, product-pdf, etc.)
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadToR2(fileBuffer, fileName, bucket = "product-images", contentType = "image/webp") {
  try {
    const now = new Date();
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    const key = `${bucket}/${datePath}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: "max-age=31536000", // 1 year (files are immutable)
    });

    await s3Client.send(command);

    // Return public URL
    const publicURL = `${process.env.R2_PUBLIC_URL}/${key}`;
    return publicURL;
  } catch (error) {
    console.error("R2 Upload Error:", error);
    throw new Error(`Failed to upload file to R2: ${error.message}`);
  }
}

/**
 * Delete file from R2
 * @param {string} key - S3 key (path) of the file
 */
async function deleteFromR2(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("R2 Delete Error:", error);
    throw new Error(`Failed to delete file from R2: ${error.message}`);
  }
}

module.exports = { uploadToR2, deleteFromR2 };
```

#### Step 2.3: Create Upload API Endpoint

**File: `backend/routes/upload.js`** (new file)

```javascript
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadToR2 } = require("../utils/r2Upload");

// In-memory storage (files don't persist locally)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

/**
 * POST /api/upload
 * Uploads file to R2
 * Body: multipart/form-data with file field
 * Query: bucket (optional, default: product-images)
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const bucket = req.query.bucket || "product-images";
    const contentType = req.file.mimetype;

    // Validate bucket
    if (!["product-images", "product-pdf"].includes(bucket)) {
      return res.status(400).json({ error: "Invalid bucket" });
    }

    const url = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      bucket,
      contentType
    );

    res.json({ url, fileName: req.file.originalname });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### Step 2.4: Add Upload Route to App

**File: `backend/app.js`** (modify)

```javascript
const uploadRouter = require("./routes/upload");
app.use("/api/upload", uploadRouter);
```

#### Step 2.5: Install Multer for File Handling

```bash
npm install multer
```

---

### Phase 3: Frontend Integration

#### Step 3.1: Update Upload Function

**File: `frontend/src/utils/r2Upload.js`** (new file)

```javascript
/**
 * Upload file to R2 via backend proxy
 * @param {File} file - File object from input
 * @param {string} bucket - Target bucket (product-images, product-pdf)
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadFileToR2(file, bucket = "product-images") {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `${process.env.REACT_APP_UPLOAD_API}?bucket=${bucket}`,
      {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type for FormData - browser will set boundary
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw error;
  }
}

/**
 * Convert image to WebP for optimization
 * (Keep existing conversion logic)
 */
export async function convertToWebP(file) {
  // Existing implementation...
}
```

#### Step 3.2: Modify Products.jsx

**File: `frontend/src/Administrator/Products.jsx`** (modify upload calls)

```javascript
// BEFORE:
// import { uploadFileToSupabase } from "./supabase";
// const url = await uploadFileToSupabase(file, bucket);

// AFTER:
import { uploadFileToR2 } from "../utils/r2Upload";
const url = await uploadFileToR2(file, bucket);
```

Replace all occurrences of `uploadFileToSupabase` with `uploadFileToR2`.

#### Step 3.3: Update Image Display Components

**File: `frontend/src/components/OptimizedImage.jsx`**

```javascript
// No changes needed - URLs will point to R2/CDN instead of Supabase
// Component remains the same, only URL source changes
```

---

### Phase 4: Data Migration

#### Step 4.1: Create Migration Script

**File: `scripts/migrateSupabaseToR2.js`** (new file)

```javascript
const { createClient } = require("@supabase/supabase-js");
const { uploadToR2 } = require("../backend/utils/r2Upload");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const STORAGE_BUCKETS = ["product-images", "product-pdf"];
const OUTPUT_LOG = "migration_results.json";

/**
 * Migrate all files from Supabase to R2
 */
async function migrateFiles() {
  const results = {
    startTime: new Date().toISOString(),
    buckets: {},
    errors: [],
    totalMigrated: 0,
  };

  for (const bucket of STORAGE_BUCKETS) {
    console.log(`\n📦 Starting migration for bucket: ${bucket}`);
    results.buckets[bucket] = { total: 0, migrated: 0, failed: 0, files: [] };

    try {
      const files = await listSupabaseFiles(bucket);
      results.buckets[bucket].total = files.length;

      for (const file of files) {
        try {
          const fileBuffer = await downloadFromSupabase(bucket, file.name);
          const url = await uploadToR2(
            fileBuffer,
            file.name,
            bucket,
            file.metadata?.mimetype || "application/octet-stream"
          );

          results.buckets[bucket].files.push({
            oldPath: `${bucket}/${file.name}`,
            newURL: url,
            migrated: true,
          });

          results.buckets[bucket].migrated++;
          results.totalMigrated++;

          console.log(`✅ ${file.name} → R2`);
        } catch (error) {
          results.buckets[bucket].failed++;
          results.errors.push(`Failed to migrate ${file.name}: ${error.message}`);
          console.error(`❌ Failed: ${file.name}`);
        }
      }
    } catch (error) {
      results.errors.push(`Bucket error [${bucket}]: ${error.message}`);
      console.error(`❌ Bucket error: ${error.message}`);
    }
  }

  results.endTime = new Date().toISOString();

  // Save results
  fs.writeFileSync(OUTPUT_LOG, JSON.stringify(results, null, 2));
  console.log(`\n📊 Migration complete. Results saved to ${OUTPUT_LOG}`);
  console.log(`Total files migrated: ${results.totalMigrated}`);

  return results;
}

/**
 * List all files in Supabase bucket
 */
async function listSupabaseFiles(bucket) {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const allFiles = [];

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list("", { limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } });

    if (error) throw error;
    if (!data || data.length === 0) break;

    const realFiles = data.filter((f) => f.id !== null);
    allFiles.push(...realFiles);

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allFiles;
}

/**
 * Download file from Supabase
 */
async function downloadFromSupabase(bucket, filePath) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error) throw error;
  return await data.arrayBuffer();
}

// Run migration
migrateFiles().catch(console.error);
```

#### Step 4.2: Update Database URLs

**File: `scripts/updateDatabaseURLs.js`** (new file)

```javascript
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

/**
 * Update all product URLs in database from Supabase → R2
 */
async function updateProductURLs() {
  const migrationLog = JSON.parse(fs.readFileSync("migration_results.json", "utf-8"));
  const urlMap = {}; // Old URL → New URL mapping

  // Build URL mapping from migration log
  for (const [bucket, data] of Object.entries(migrationLog.buckets)) {
    for (const file of data.files) {
      // Extract old Supabase URL and map to new R2 URL
      // urlMap["old-url"] = "new-r2-url"
    }
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Update thumbnail URLs
    for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
      await connection.execute(
        "UPDATE products SET thumbnail = ? WHERE thumbnail = ?",
        [newUrl, oldUrl]
      );

      // Update images array (if stored as JSON string)
      await connection.execute(
        "UPDATE products SET images = JSON_REPLACE(images, ?, ?) WHERE JSON_CONTAINS(images, ?)",
        [oldUrl, newUrl, JSON.stringify(oldUrl)]
      );

      // Similar for spec_images...
    }

    console.log("✅ Database URLs updated successfully");
  } finally {
    await connection.end();
  }
}

updateProductURLs().catch(console.error);
```

#### Step 4.3: Backup Supabase Data

```bash
# Export all products before migration
# Using supabase CLI or direct API calls
supabase db dump --db-url "postgresql://..." > backup_products.sql
```

---

### Phase 5: Testing & Validation

#### Step 5.1: Unit Tests

**File: `backend/tests/r2Upload.test.js`** (new file)

```javascript
const { uploadToR2, deleteFromR2 } = require("../utils/r2Upload");

describe("R2 Upload Utility", () => {
  it("should upload a file to R2", async () => {
    const buffer = Buffer.from("test content");
    const url = await uploadToR2(buffer, "test.txt", "product-images", "text/plain");
    expect(url).toMatch(/sawo-assets/);
  });

  it("should delete a file from R2", async () => {
    // Test deletion
  });
});
```

#### Step 5.2: Integration Tests

```javascript
describe("Upload API Endpoint", () => {
  it("should upload image via /api/upload", async () => {
    const response = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    });
    expect(response.ok).toBe(true);
  });

  it("should reject invalid file types", async () => {
    // Test validation
  });
});
```

#### Step 5.3: Manual Testing Checklist

- [ ] Upload JPG image → converts to WebP → stored in R2
- [ ] Upload PNG image → converts to WebP → stored in R2
- [ ] Upload PDF file → stored in R2 without conversion
- [ ] Verify public URL works
- [ ] Verify image displays in product detail page
- [ ] Verify product edit with new image upload
- [ ] Test with slow network (throttle in dev tools)
- [ ] Verify file size limits enforced
- [ ] Test concurrent uploads

#### Step 5.4: Performance Benchmarks

Compare before/after:
- Upload speed
- File size reduction (WebP conversion)
- Download speed (via CDN)
- Database query speed (no change expected)

---

### Phase 6: Deployment & Rollback

#### Step 6.1: Production Deployment

1. **Pre-deployment**:
   - [ ] All tests passing
   - [ ] Code review completed
   - [ ] Backup of Supabase bucket taken
   - [ ] Backup of database taken

2. **Deployment Steps**:
   ```bash
   # Backend
   cd backend
   npm install aws-sdk
   git commit -m "Add R2 upload integration"
   
   # Frontend
   cd frontend
   npm run build
   # Deploy to Vercel or hosting
   ```

3. **Gradual Rollout**:
   - Deploy to staging first
   - Test for 24 hours
   - Deploy to production
   - Monitor for errors

#### Step 6.2: Monitoring

Create alerts for:
- Upload failures
- R2 API errors
- High latency
- Large file rejections

```javascript
// Example: Log all uploads
async function uploadToR2(...args) {
  try {
    const result = await s3Client.send(command);
    console.log(`[R2_SUCCESS] File uploaded: ${fileName}`);
    return result;
  } catch (error) {
    console.error(`[R2_ERROR] Upload failed: ${error.message}`);
    // Send alert to monitoring service
  }
}
```

#### Step 6.3: Rollback Plan

If issues occur:

1. **Immediate Rollback**:
   ```bash
   # Revert frontend to use old uploadFileToSupabase
   git checkout HEAD~1 -- frontend/src/Administrator/Products.jsx
   npm run build && deploy
   ```

2. **Keep Both Systems Running**:
   - Add feature flag to switch between R2 and Supabase
   - During rollback, flag disables R2, enables Supabase
   - No data loss, only rollback to old uploads

3. **Database Rollback**:
   - If URLs were updated, restore from backup
   - Or manually revert with UPDATE queries

---

### Phase 7: Cleanup & Optimization

#### Step 7.1: Image Optimization via Cloudflare Workers (Optional)

**File: `cloudflare-worker.js`**

```javascript
/**
 * Cloudflare Worker for image optimization
 * Serves optimized images on-demand
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const imageURL = `https://${process.env.R2_BUCKET}.r2.cloudflarestorage.com${url.pathname}`;

    // Add optimization parameters
    const optimized = new URL(imageURL);
    optimized.searchParams.append("quality", "85");
    optimized.searchParams.append("format", "webp");

    return fetch(optimized);
  },
};
```

#### Step 7.2: Disable Supabase Uploads

After 30 days of successful R2 operation:

```javascript
// Disable old Supabase upload function
export async function uploadFileToSupabase() {
  throw new Error("Supabase uploads discontinued. Use R2.");
}
```

#### Step 7.3: Archive Supabase Data

Keep for 30 days, then:
- Export all files for archival
- Delete from Supabase
- Store in cold storage (AWS Glacier)

#### Step 7.4: Documentation Updates

- [ ] Update README with new upload process
- [ ] Update API documentation
- [ ] Document R2 bucket structure
- [ ] Create troubleshooting guide

---

## 💻 Code Changes Required

### Summary of Files to Modify/Create

```
Backend:
├── CREATE: utils/r2Upload.js              (R2 upload utilities)
├── CREATE: routes/upload.js               (Upload API endpoint)
├── CREATE: scripts/migrateSupabaseToR2.js (Migration script)
├── CREATE: scripts/updateDatabaseURLs.js  (URL update script)
├── MODIFY: app.js                         (Register upload route)
├── MODIFY: package.json                   (Add aws-sdk, multer)
└── MODIFY: .env                           (Add R2 credentials)

Frontend:
├── CREATE: src/utils/r2Upload.js          (R2 upload wrapper)
├── MODIFY: src/Administrator/Products.jsx (Use new upload)
├── MODIFY: .env                           (Add upload API URL)
└── NO CHANGE: Image display components    (URL changes transparent)

Scripts:
├── CREATE: scripts/migrateSupabaseToR2.js
├── CREATE: scripts/updateDatabaseURLs.js
└── CREATE: scripts/verifyMigration.js

Tests:
├── CREATE: backend/tests/r2Upload.test.js
└── CREATE: backend/tests/uploadAPI.test.js
```

### Environment Variables to Add

```env
# Backend
CLOUDFLARE_ACCOUNT_ID=xxxx
CLOUDFLARE_ACCESS_KEY_ID=xxxx
CLOUDFLARE_SECRET_ACCESS_KEY=xxxx
CLOUDFLARE_R2_BUCKET_NAME=sawo-production
CLOUDFLARE_R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://sawo-assets.sawogroup.com

# Frontend
REACT_APP_UPLOAD_API=https://api.sawogroup.com/api/upload
```

---

## 🧪 Testing Strategy

### Test Coverage Levels

1. **Unit Tests**
   - R2 upload function
   - URL parsing
   - Error handling

2. **Integration Tests**
   - Upload API endpoint
   - File storage and retrieval
   - Database URL updates

3. **E2E Tests**
   - Upload via admin panel
   - Image display in product page
   - PDF download
   - Search/filter (verify data integrity)

4. **Performance Tests**
   - Upload speed
   - Download speed via CDN
   - Concurrent uploads
   - Large file handling (100MB+)

### Staging Environment Testing

```
1. Deploy to staging
2. Run full test suite
3. Perform data migration in staging
4. Test all admin features
5. Verify database integrity
6. Load test (simulate 100 concurrent users)
7. Rollback and test restore
```

---

## 🔄 Rollback Plan

### Scenario 1: R2 Upload Failures (Days 1-3)

**Immediate Action**:
1. Disable R2 uploads via feature flag
2. Switch back to Supabase for new uploads
3. Investigate error logs
4. No data loss (old files still in both systems)

**Resolution**:
- Fix R2 configuration
- Test in staging
- Re-enable R2 uploads

### Scenario 2: Data Integrity Issues (Weeks 1-4)

**Immediate Action**:
1. Stop accepting new uploads
2. Restore database from backup
3. Verify all URLs point to correct files
4. Resume uploads after verification

### Scenario 3: Performance Issues

**Immediate Action**:
1. Enable Supabase CDN caching
2. Check Cloudflare Workers for bottlenecks
3. Verify R2 bucket region matches users
4. If unresolved, rollback to Supabase

### Rollback Script

```bash
#!/bin/bash
# Immediate rollback to Supabase

# 1. Revert code
git revert HEAD
npm run build && deploy

# 2. Stop new R2 uploads
# (Feature flag in code handles this)

# 3. Restore database (if needed)
mysql < backup_products.sql

# 4. Notify team
echo "Rollback complete. Using Supabase for uploads."
```

---

## 📊 Timeline & Milestones

### Week 1: Foundation
- **Day 1-2**: R2 bucket setup, credentials, environment vars
- **Day 3-4**: Backend R2 utility + upload endpoint
- **Day 5**: Initial testing of backend uploads

**Milestone 1**: ✅ Backend can upload to R2

### Week 2: Integration
- **Day 6-8**: Frontend integration, update Products.jsx
- **Day 9-10**: Create migration scripts
- **Day 11-12**: Staging environment testing

**Milestone 2**: ✅ Full upload flow works (frontend → backend → R2)

### Week 3: Data & Testing
- **Day 13-15**: Data migration (Supabase → R2)
- **Day 16-17**: Database URL updates
- **Day 18-19**: Comprehensive testing

**Milestone 3**: ✅ All existing files migrated to R2

### Week 4-5: Deployment
- **Day 20-22**: Production deployment
- **Day 23-25**: Monitoring and monitoring
- **Day 26-30**: Keep Supabase as backup, prepare cleanup

**Milestone 4**: ✅ Production live with R2, Supabase backup active

### Week 6: Optimization
- **Day 31+**: Implement optional features (Workers, cleanup)

**Milestone 5**: ✅ Full optimization and documentation complete

---

## ⚠️ Risk Assessment

### High-Risk Items

1. **Data Loss During Migration**
   - **Risk**: Incomplete file transfer or URL mapping errors
   - **Mitigation**: Backup all files, verify each migration, run data integrity checks
   - **Impact**: High - loss of product images/PDFs

2. **Egress Bandwidth Spike**
   - **Risk**: Downloading all files from Supabase for migration
   - **Mitigation**: Perform migration during low-traffic hours, use API rate limiting
   - **Impact**: Medium - increased costs if not managed

3. **URL Changes Break Existing Links**
   - **Risk**: External sites link to old Supabase URLs
   - **Mitigation**: Set up redirects in Supabase, keep old URLs for 6 months
   - **Impact**: Medium - SEO impact

### Medium-Risk Items

1. **R2 API Rate Limiting**
   - **Mitigation**: Implement exponential backoff, queue uploads
   
2. **CORS Issues with Direct Upload**
   - **Mitigation**: Use backend proxy (recommended), test CORS thoroughly

3. **Performance Degradation**
   - **Mitigation**: Load test, compare CDN providers, have rollback ready

### Low-Risk Items

1. **Frontend Code Breaking**
   - **Mitigation**: Backward compatible changes, feature flags
   
2. **Database Schema Changes**
   - **Mitigation**: No schema changes needed (URL remains text/array)

---

## 📝 Checklist for Implementation

- [ ] **Setup Phase**
  - [ ] R2 bucket created
  - [ ] API credentials generated
  - [ ] CORS configured
  - [ ] Environment variables set in dev, staging, production

- [ ] **Backend Phase**
  - [ ] AWS SDK installed
  - [ ] R2 upload utility created
  - [ ] Upload API endpoint implemented
  - [ ] Error handling added
  - [ ] Tests written

- [ ] **Frontend Phase**
  - [ ] R2 wrapper function created
  - [ ] Products.jsx updated
  - [ ] File upload tested
  - [ ] Image display verified

- [ ] **Migration Phase**
  - [ ] Migration script created
  - [ ] Dry run executed
  - [ ] Database backup taken
  - [ ] Full migration executed
  - [ ] URL verification completed

- [ ] **Testing Phase**
  - [ ] Unit tests passing
  - [ ] Integration tests passing
  - [ ] Staging environment verified
  - [ ] Performance benchmarks acceptable
  - [ ] Rollback tested

- [ ] **Deployment Phase**
  - [ ] Code review completed
  - [ ] Staging tested for 24 hours
  - [ ] Production deployment executed
  - [ ] Monitoring alerts set up
  - [ ] Team notified

- [ ] **Cleanup Phase**
  - [ ] Supabase bucket kept for 30 days
  - [ ] Optional: Workers image optimization
  - [ ] Documentation updated
  - [ ] Team trained on new process

---

## 🔗 Resources & References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK v3 for S3 (compatible with R2)](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Multer Upload Middleware](https://github.com/expressjs/multer)
- [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)

---

## 🎯 Success Criteria

✅ Implementation is successful when:

1. **Functionality**
   - All files upload successfully to R2
   - All existing files migrated and accessible
   - No broken image or PDF links

2. **Performance**
   - Upload time < 2 seconds for typical images
   - Download via CDN faster than Supabase
   - No latency increase for product pages

3. **Reliability**
   - Zero data loss during migration
   - Automated error alerts in place
   - Rollback capability verified

4. **Cost**
   - Monthly costs reduced vs. Supabase
   - No surprise egress charges
   - Budget optimization documented

5. **Maintainability**
   - Code documented
   - Team trained
   - Clear troubleshooting guide available

---

## 📞 Support & Escalation

**During Implementation**:
- Slack channel: `#r2-migration`
- Oncall: [team-lead]
- Escalation: [manager]

**Post-Deployment**:
- Monitoring dashboard: [link]
- Runbook: [link]
- Contact: [team-email]

---

**Document Author**: Claude AI  
**Last Updated**: April 17, 2026  
**Status**: Ready for Review

