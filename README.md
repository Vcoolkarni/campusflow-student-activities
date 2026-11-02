# CampusFlow Student Activity Management and Reporting

Version 1.1.0. A responsive full-stack institutional activity management application.

## Run the project

Requires Node.js 22.13 or newer and npm. From this folder:

```powershell
npm ci
npm run dev
```

The first launch builds the Worker configuration if needed. Startup checks the existing local schema, applies missing migration statements without deleting records, and starts the development server. Open the Local URL, normally http://127.0.0.1:5173, and use Sign in with ChatGPT. On loopback development this is a simulated account named Seedy; production authentication is handled by Sites.

For Windows npm `EPERM` errors while creating package directories:

```powershell
node -e "const fs=require('fs');const lock=JSON.parse(fs.readFileSync('package-lock.json'));for(const p of Object.keys(lock.packages)){if(p)fs.mkdirSync(p,{recursive:true})}"
npm install --prefer-offline --no-audit --no-fund --workspaces=false
```

The local database and evidence files live under ignored `.wrangler/state/v3`. Production uses separate D1 and R2 resources. Test data is never uploaded as part of source deployment.

## First demonstration

1. Sign in as the first administrator. Choose Load sample workspace only if the workspace is empty, or create departments manually.
2. Configure institute name, academic years, semesters, programs, classes, divisions, categories, and activity types under Academic setup.
3. Add faculty and resource people. Create students individually or import CSV/XLSX using the directory template.
4. Create a draft activity. If no departments are configured, add the department directly under the Department field. Saving it selects it without clearing the form. Record objectives, dates, location, coordinator, and budget. Use Organization to add target groups, faculty contributions, and experts.
5. Add participants and evidence. Attendance supports individual changes, mark all present, and CSV/XLSX import.
6. Submit the activity. HOD/authorized reviewers verify, IQAC/authorized reviewers approve, and corrections can be returned with a reason.
7. Record outcomes and finish attendance before marking the activity completed. Present participants can access generated printable certificates and submit feedback.
8. Apply filters in Reports, choose a grouping and framework, and export CSV/XLSX or use Print / Save PDF.
9. Download a portable backup from Settings. Restore missing records and file bytes from a version 2 backup while preserving existing records and account permissions.

## Modules

Overview; activities; calendar; students; departments; approvals; evidence library; reports; academic setup; faculty; resource people; settings and account assignments. The activity detail view includes Details, Participants, Organization, Evidence, Feedback, and History. Student views omit staff-only organization and history information.

## Roles and authentication

Administrator manages the institute. HOD manages the assigned department. Faculty Coordinator edits their own department activities. IQAC reviews institute-wide records. Management has read access. Student sees published activities relevant to their department or participation, their own student records, their own participation, and permitted activity reports. Attendance sheets and other students' private records are not exposed to students.

Use Settings to preassign account roles by email or update signed-in users. Site sharing is a separate owner-controlled access gate; preparing an account does not grant permission to visit the private Site. The application does not store or manage passwords because hosted sign-in is delegated to ChatGPT. Inactive accounts are rejected server-side, and administrators cannot demote/deactivate themselves.

## Reports

The activity register and participation register export CSV and real XLSX files. Summaries group by department, academic year, semester, class, division, category, activity type, coordinator, student, resource person, or faculty contribution. Additional reports list achievements and missing activity reports. Filters cover academic year, department, semester, class, division, category, type, status, coordinator, student, and dates; title/resource-person text search is supported. Additional target groups are included in class/division filtering and grouped reports.

Attendance percentage uses present divided by present plus absent; unrecorded attendance is excluded. Points use 2 for present participants, 3 for volunteers, 10 for winners, and 7 for runners-up. IQAC/NBA/NAAC/AAA/University audit selections label the report; the institute must map reports to its required criteria. PDF and certificate printing use the browser Print / Save PDF command.

## Imports and files

Student import accepts CSV or the first worksheet of an XLSX workbook, up to 500 rows and 10 MB. Required headers are name, prn, email, department, class, division, semester, year. Optional program is supported. Use configured department codes and academic values. Store PRNs as text in Excel if they contain leading zeros. Attendance import uses prn, attendance, responsibility, achievement, certificate. Allowed attendance values: Registered, Present, Absent. Roles: Participant, Volunteer, Winner, Runner-up.

Evidence accepts PDF, JPG, PNG, and CSV, up to 10 MB per file. Image/PDF signatures and sizes are checked server-side. Files are stored in R2 and downloaded through authorized endpoints. Portable JSON backups include records and evidence bytes, limited to 5000 records and 20 MB of evidence. Restore only inserts missing records; it does not overwrite or delete existing records, restore account permissions, or schedule backups.

## Verify

```powershell
npx tsc --noEmit
npm run build
node scripts/test-exports.mjs
# With ordinary npm run dev running:
npm run test:integration
# Stop the ordinary server and start explicit local role-test mode:
npm run dev:test
# In a separate terminal:
npm run test:requirements
```

The role-test middleware runs only with explicit opt-in, only on loopback, and only in Vite development. It is excluded from deployed Worker routes. Test profiles are accessible at `/__test__/signin?profile=admin`, `faculty`, `hod`, `iqac`, `student`, or `management`. The extended test script prepares account assignments and local data for these profiles. They have no hosted effect and do not bypass Sites authentication in production. Tests retain clearly named QA records for inspection.

Verification covers authenticated access, all six roles, department scopes, student privacy, malformed input, academic configuration, unique identifiers, duplicate prevention including concurrent requests, approval concurrency, file protection, registration, attendance, generated certificates, feedback, backup, actual missing-record/file restoration, and deactivation. CSV/XLSX utility tests cover quoting, invalid rows, formula escaping, numeric cells, and XML integrity. Browser checks include forms, Excel import, reporting, and responsive layouts.

## Source map

- `app/page.tsx`: main workspace, filters, activity forms, attendance and evidence controls.
- `components/workspace-modules.tsx`: academic configuration, directories, organization, reports, backup, feedback, account assignments.
- `components/workspace-ui.tsx`: shared accessible field/dialog components.
- `app/api/manage/route.ts`: scoped reads, core record mutations, atomic approval workflow.
- `app/api/records/route.ts`: academic masters, directories, target groups, contributions, registration and feedback.
- `app/api/files/route.ts`: protected evidence upload and download.
- `app/api/backup/route.ts`: portable record/file backup and non-overwriting restore.
- `app/api/certificate/route.ts`: authorized printable certificates.
- `db/schema.ts`, `drizzle/`: sixteen physical tables, constraints, indexes, append-only schema migrations.
- `lib/server.ts`, `lib/model.ts`: authentication, authorization, validation, shared types and defaults.
- `lib/export.ts`, `lib/import.ts`: CSV/XLSX import/export utilities.
- `scripts/setup-local.mjs`, `scripts/dev.mjs`: safe local startup and migration checks.

## Remaining optional extensions

QR attendance, automatic email delivery, scheduled backup jobs, external ERP integration, legally verified digital signatures, and institution-specific accreditation form templates are not included. The built-in certificates are printable participation records with a reference; authorized institutional signatures are handled by the institute. Academic lookup values share a master_data table; activity-to-student, faculty, resource-person and target-group relationships use junction tables.

See `public/CampusFlow-Project-Guide.pdf` for the explanation document, database summary, setup instructions, demonstration script, test evidence, and viva questions.

## Render deployment

The Render entry point is `npm run start:render`. It initializes the local D1-compatible database, serves the built Worker on `0.0.0.0:$PORT`, and enables a password-protected administrator session when `CAMPUSFLOW_ADMIN_PASSWORD` and `CAMPUSFLOW_SESSION_SECRET` are configured. `CAMPUSFLOW_ADMIN_EMAIL`, `CAMPUSFLOW_ADMIN_NAME`, and `CAMPUSFLOW_PERSIST_DIR` are optional.

On a free Render web service, the local database and evidence storage are ephemeral and can reset on redeploy or instance replacement. For durable production use, upgrade the web service and attach a persistent disk at `/opt/render/project/src/.render-state`, or migrate the D1/R2 bindings to managed external services.
