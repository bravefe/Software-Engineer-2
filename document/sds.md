# System Design Specification (SDS)

**Project Name:** Macau678 Purchase Approval System  
**Document Version:** 1.0  
**Status:** Approved / Base Architecture  
**Traceability Reference:** [Software Requirements Specification (SRS)](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/srs.md)

---

## 1. Technology Stack

### 1.1 Frontend Technologies
* **Framework / Core Library:** React 18 (v18.3.x) with TypeScript 5.x — provides component modularity, strict typing, and high maintainability (NFR-05).
* **Build Tool & Dev Server:** Vite — enables rapid development cycles with Hot Module Replacement (HMR).
* **UI & Styling Framework:** Bootstrap 5.3 paired with responsive CSS — provides clean layout grids, accessible form controls, modals, and clear status badges (NFR-02).
* **State Management:** React Context API (`AuthContext`) combined with React hooks (`useState`, `useEffect`, `useCallback`) for local view and session state management.
* **HTTP / Client Transport:** Native browser `fetch` API encapsulated in a centralized, typed API client module (`client/src/api.ts`) configured with `credentials: "include"` for HTTP-only cookie session handling.

- Framework: React
- Build Tool: Vite
- Programming Language: TypeScript
- Styling: Tailwind css
- HTTP Client: Fetch API

### 1.2 Backend Technologies
* **Runtime Environment:** Node.js (v18.x or v20.x LTS).
* **Web Framework:** Express 4 (v4.21.x) with TypeScript — modular REST API architecture (NFR-05).
* **Execution Utility:** `tsx` for TypeScript execution in development and node runtime for production.
* **ORM & Database Client:** Prisma ORM (v5.x) with Prisma Client — ensures type-safe queries, migration tracking, and relational integrity.
* **Authentication & Cryptography:** 
  * `jsonwebtoken` for generating and verifying signed JWT session tokens.
  * `bcrypt` for salted password hashing (10 salt rounds), guaranteeing no plaintext password storage (NFR-01).
* **Middleware:**
  * `cookie-parser` for reading secure, HTTP-only session cookies.
  * `cors` for Cross-Origin Resource Sharing control with credentials support.
  * `express.json()` for parsing incoming JSON request payloads.

- Runtime Environment: Node.js
- Framework: Express.js
- Programming Language: TypeScript
- API Architecture: RESTful API

### 1.3 Database Technologies
* **Database Engine:** PostgreSQL 16 (executed via Docker container `postgres:16-alpine` for local development and test environments).
* **Data Definition & Query Language:** Prisma Schema Language (PSL) mapped to native PostgreSQL DDL and transactions.
* **Data Integrity Features:** Foreign key constraints (`ON DELETE RESTRICT` for referential integrity), check constraints, transaction atomicity via `$transaction`, and indexed query columns (NFR-04).

- Database Management System: PostgreSQL
- ORM: Prisma ORM

### 1.4 Development and Testing Tools
* **Containerization:** Docker & Docker Compose for isolated and reproducible local PostgreSQL database instances.
* **Backend Unit & Integration Testing:** Vitest paired with Supertest executing against an isolated test database (`macau678_test`).
* **Frontend Component Testing:** Vitest, JSDOM, and React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`).
* **End-to-End (E2E) Browser Testing:** Playwright automated testing across desktop and tablet viewports.

- Frontend and Backend Unit Testing: Vitest
- End-to-End Testing: Playwright
- Version Control: Git
- Package Manager: NPM
- Continuous Integration: Git Action

---

## 2. System Architecture

### 2.1 Architecture Overview
The Macau678 Purchase Approval System follows a decoupled **Three-Tier Client-Server Architecture**:
1. **Presentation Tier (Client / SPA):** A responsive React single-page application handling user interaction, form inputs, dynamic validation, role-based views, and HTTP calls.
2. **Application / Logic Tier (Node.js & Express API):** A stateless RESTful API responsible for user authentication, server-side role-based authorization (RBAC), business rule enforcement (valid status transitions, ownership verification, non-self-approval), and request history logging.
3. **Data Tier (PostgreSQL):** A relational database providing ACID transactions, referential integrity, and historical audit storage.

```mermaid
flowchart TD
    subgraph Client["Presentation Tier (Client / SPA)"]
        UI["React 18 + Bootstrap UI"]
        AuthCtx["AuthContext (User Identity & Role)"]
        APIClient["Typed API Layer (api.ts)"]
        UI --> AuthCtx
        AuthCtx --> APIClient
    end

    subgraph Server["Application Tier (Node.js / Express API)"]
        Gateway["Express Server (:3000)"]
        Middleware["CORS, Cookie Parser, JSON Parser"]
        AuthMid["requireAuth & requireRole Guards"]
        Routers["Routers: /api/auth, /api/requests, /api/reports"]
        PrismaClient["Prisma ORM Client Layer"]
        
        Gateway --> Middleware
        Middleware --> AuthMid
        AuthMid --> Routers
        Routers --> PrismaClient
    end

    subgraph Database["Persistence Tier (PostgreSQL 16)"]
        PG[("PostgreSQL DB (:5432)")]
        PrismaClient -->|Connection Pool / SQL| PG
    end

    APIClient -->|RESTful JSON / HTTP-only Cookies| Gateway
```

### 2.2 Frontend Architecture
* **View Structure:** Divided by actor roles (`REQUESTER` and `REVIEWER` per AD-02):
  * **Authentication:** `Login.tsx` (FR-01).
  * **Requester Views:**
    * `RequesterDashboard.tsx`: Overview of submitted requests and current status indicators (FR-03, FR-08).
    * `CreateRequest.tsx`: Purchase request submission form with fields for title, description, amount, justification, reviewer selection, and Draft vs. Submit actions (FR-02, BR-02).
    * `EditRequest.tsx`: Modification form enabled exclusively for `RETURNED` requests (FR-05, BR-06).
    * `RequestDetail.tsx`: Detailed view showing request parameters, current status, and full historical timeline of decisions (FR-03, FR-06).
  * **Reviewer Views:**
    * `ReviewerQueue.tsx`: Queue displaying requests assigned to the logged-in Reviewer (FR-03, BR-04).
    * `ReviewRequestDetail.tsx`: Review interface containing request details, decision action buttons (Approve, Reject, Return), and reason input modal (FR-04, BR-05).
  * **Reporting View:**
    * `RequestReports.tsx`: Request overview filtered by status and submission date ranges (FR-08).
* **Context & Security Guards:**
  * `AuthContext`: Supplies active user profile (`id`, `name`, `email`, `role`) and authentication methods (`login`, `logout`).
  * `ProtectedRoute`: Enforces client-side route access control based on user role, complementing mandatory server-side guards (NFR-01).

### 2.3 Backend Architecture
* **Modular Layering:**
  * `src/index.ts` & `src/app.ts`: Decoupled server setup allowing integration test suites to bind to ephemeral ports without conflict.
  * `src/middleware/auth.ts`: Authentication guard (`requireAuth`) validating JWT cookies and active user records; role guard (`requireRole(['REQUESTER', 'REVIEWER'])`) enforcing authorization on protected endpoints (FR-01, NFR-01).
  * `src/routes/auth.ts`: Endpoints for login, logout, and current user profile retrieval.
  * `src/routes/requests.ts`: Endpoints for creating, listing, viewing, updating, and reviewing purchase requests.
  * `src/routes/reports.ts`: Endpoints for filtering requests by status and date aggregations (FR-08).
  * `src/services/historyService.ts`: Centralized service to record audit logs for status transitions and review decisions in a transactional manner (FR-06, BR-08).

### 2.4 Database Architecture
* Normalized relational structure (3NF) ensuring atomicity and consistency.
* Primary keys are auto-incrementing integers (`id Int @id @default(autoincrement())`).
* Strict foreign keys:
  * `requesterId` $\rightarrow$ `User.id` (`onDelete: Restrict`)
  * `reviewerId` $\rightarrow$ `User.id` (`onDelete: Restrict`)
  * `requestId` in `RequestHistory` $\rightarrow$ `PurchaseRequest.id` (`onDelete: Cascade`)
  * `actorId` in `RequestHistory` $\rightarrow$ `User.id` (`onDelete: Restrict`)
* Strategic database indexes on query filters: `[requesterId]`, `[reviewerId]`, `[status]`, `[createdAt]`.

### 2.5 Component Communication
* Communication between client and server occurs via standard HTTP/1.1 REST JSON transactions.
* Session identity is maintained using signed HTTP-only cookies (`macau678_session`) with `SameSite=Lax` and `HttpOnly` flags.
* All modification endpoints accept and return `application/json` payloads.

### 2.6 Business Logic Responsibilities
* **Server Authoritative Enforcement:** The server is the single source of truth:
  * Prevents a Requester from approving or reviewing their own request (BR-03).
  * Enforces that Reviewers can only review requests assigned to them (BR-04, AC-09).
  * Mandates a non-empty reason when a request is rejected or returned (BR-05, AC-06).
  * Restricts request editing strictly to requests with `RETURNED` status (BR-06, AC-07).
  * Enforces valid status transitions according to BR-07 lifecycle rules.
  * Automatically writes history logs inside database transactions upon any status modification (BR-08).
* **Client Responsibilities:** Responsive form validation, user feedback alerts, loading states, and dynamic display of authorized action triggers.

---

## 3. Data Design

### 3.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ PURCHASE_REQUEST : "submits (as Requester)"
    USER ||--o{ PURCHASE_REQUEST : "assigned to (as Reviewer)"
    USER ||--o{ REQUEST_HISTORY : "acts as (actor)"
    PURCHASE_REQUEST ||--o{ REQUEST_HISTORY : "tracks timeline"

    USER {
        int id PK
        string email UK
        string passwordHash
        string name
        enum role "REQUESTER | REVIEWER"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    PURCHASE_REQUEST {
        int id PK
        string requestNumber UK
        string title
        string description
        decimal amount
        string justification
        enum status "DRAFT | PENDING_REVIEW | APPROVED | REJECTED | RETURNED"
        int requesterId FK
        int reviewerId FK
        datetime submittedAt
        datetime createdAt
        datetime updatedAt
    }

    REQUEST_HISTORY {
        int id PK
        int requestId FK
        int actorId FK
        enum action "CREATED | SUBMITTED | RESUBMITTED | EDITED | APPROVED | REJECTED | RETURNED"
        enum fromStatus "DRAFT | PENDING_REVIEW | RETURNED"
        enum toStatus "DRAFT | PENDING_REVIEW | APPROVED | REJECTED | RETURNED"
        string reason
        datetime createdAt
    }
```

### 3.2 Entity Descriptions
1. **User (Actor):** Represents an authenticated Macau678 staff member. Contains credentials, role assignment (`REQUESTER` or `REVIEWER`), and activation status (FR-01, AD-02).
2. **PurchaseRequest (Core Entity):** The primary entity representing a purchase proposal. Stores request title, detailed description, monetary amount, business justification, current lifecycle status, foreign key to the submitting Requester, and foreign key to the assigned Reviewer (FR-02, FR-07).
3. **RequestHistory (Audit & Timeline):** An immutable chronological record of every status transition and review decision, including the acting user, previous status, new status, decision reason (mandatory for rejection/return), and timestamp (FR-06, BR-08).

### 3.3 Database Relationships
* **User to PurchaseRequest (Submission):** One-to-Many (`requesterId`). Tracks request ownership. `onDelete: Restrict` prevents deleting users with active requests.
* **User to PurchaseRequest (Assignment):** One-to-Many (`reviewerId`). Designates the single assigned reviewer per request (BR-02, BR-10, AD-03). `onDelete: Restrict`.
* **PurchaseRequest to RequestHistory:** One-to-Many (`requestId`). Captures audit trail. Configured with `onDelete: Cascade`.
* **User to RequestHistory:** One-to-Many (`actorId`). Records the authenticated user who initiated the action. `onDelete: Restrict`.

### 3.4 Data Constraints and Ownership
* **Field Constraints:**
  * `PurchaseRequest.title`: String, minimum 3 characters, maximum 150 characters, mandatory non-empty (FR-02).
  * `PurchaseRequest.description`: String/Text, maximum 2000 characters, mandatory non-empty (FR-02).
  * `PurchaseRequest.amount`: Decimal(12, 2), strictly positive (> 0.00) (FR-02).
  * `PurchaseRequest.justification`: String/Text, maximum 2000 characters, mandatory non-empty (FR-02).
  * `RequestHistory.reason`: String/Text, mandatory non-empty when action is `REJECTED` or `RETURNED` (BR-05, AC-06); optional for creation or approval.
* **Ownership and Isolation Rules (BR-09, AC-10):**
  * Requesters can only view and query purchase requests where `requesterId === currentUser.id` (FR-03, AC-03).
  * Reviewers can only view and review purchase requests where `reviewerId === currentUser.id` (FR-03, BR-04, AC-09).
  * Self-approval prevention: A user cannot review or approve a request if `requesterId === currentUser.id` (BR-03, AC-08).

### 3.5 Database Migrations and Seeding
* **Migrations:** Managed via Prisma Migrate (`prisma migrate dev`). Version-controlled SQL files stored in `server/prisma/migrations/`.
* **Idempotent Seed Script (`prisma/seed.ts`):**
  * Seeds demo accounts for each role with bcrypt-hashed passwords (e.g., `requester1@macau678.com`, `reviewer1@macau678.com`).
  * Seeds sample purchase requests across different statuses (`Draft`, `Pending Review`, `Approved`, `Rejected`, `Returned`) along with corresponding history entries to enable immediate end-to-end testing and UAT.

---

## 4. User Interface Design

### 4.1 Screen and Page Overview
* **Login (`/login`):** Authentication form supporting email and password inputs with immediate error feedback on invalid attempts (FR-01, AC-01).
* **Requester Dashboard (`/requester/dashboard`):** Displays status summary metric cards (Drafts, Pending Review, Returned, Approved, Rejected) and a table of recent requests (FR-03, FR-08).
* **Create Request (`/requests/new`):** Input form for title, description, amount, justification, and reviewer assignment dropdown with "Save as Draft" and "Submit for Review" options (FR-02, BR-02, AC-02).
* **Edit Returned Request (`/requests/:id/edit`):** Edit form for modifying title, description, amount, and justification. Strictly accessible only when status is `RETURNED` (FR-05, BR-06, AC-07).
* **Request Detail View (`/requests/:id`):** Displays comprehensive request details, current status badge, and the chronological `RequestHistory` timeline with review reasons (FR-03, FR-06).
* **Reviewer Queue (`/reviewer/queue`):** Table showing all requests currently assigned to the logged-in Reviewer, filterable by status (`Pending Review`, `Approved`, `Rejected`, `Returned`) (FR-03, BR-04, AC-04).
* **Reviewer Decision Modal / Action (`/requests/:id/review`):** Interface for assigned Reviewer to inspect request details and select action:
  * **Approve:** Updates status to `APPROVED` (FR-04, AC-05).
  * **Reject:** Prompts for mandatory reason and updates status to `REJECTED` (FR-04, BR-05, AC-06).
  * **Return:** Prompts for mandatory reason and updates status to `RETURNED` (FR-04, BR-05, AC-06).
* **Reports View (`/reports`):** Overview screen allowing authorized users to view status breakdowns and filter requests by status and date range (FR-08, AC-12).

### 4.2 Navigation Structure
A top navigation bar dynamically renders navigation links based on the authenticated user's role:
* **Brand Logo:** Macau678 Purchase Approval System (links to home dashboard).
* **Requester Navigation:**
  * `Dashboard` (`/requester/dashboard`)
  * `My Requests` (`/requester/requests`)
  * `+ New Request` (`/requests/new`)
* **Reviewer Navigation:**
  * `Review Queue` (`/reviewer/queue`)
  * `Reports` (`/reports`)
* **User Profile & Logout (Right):** Displays authenticated user name, role badge (`REQUESTER` or `REVIEWER`), and `Sign Out` button (FR-01).

```mermaid
graph TD
    Login["/login"] -->|Authenticate| RoleCheck{User Role}
    
    RoleCheck -->|REQUESTER| RDash["/requester/dashboard"]
    RoleCheck -->|REVIEWER| RQueue["/reviewer/queue"]

    RDash --> RNew["/requests/new"]
    RDash --> RList["/requester/requests"]
    RList --> RDetail["/requests/:id"]
    RDetail -->|If Returned| REdit["/requests/:id/edit"]

    RQueue --> RevDetail["/requests/:id"]
    RevDetail --> ReviewModal["Review Action (Approve / Reject / Return)"]
    RQueue --> Reports["/reports"]
```

### 4.3 UI Components
* **Status Badges:** Distinct visual badges for each lifecycle state:
  * `Draft`: Secondary (Grey)
  * `Pending Review`: Primary (Blue/Amber)
  * `Approved`: Success (Green)
  * `Rejected`: Danger (Red)
  * `Returned`: Warning (Orange)
* **History Timeline:** Chronological card stream displaying action name, actor name, timestamp, and review reason note (FR-06).
* **Review Decision Modal:** Bootstrap modal dialog enforcing reason text entry prior to enabling Reject or Return submission buttons (BR-05).

### 4.4 Form Validation
* **Client-Side Form Validation:**
  * Title: Mandatory, 3–150 characters.
  * Description: Mandatory, max 2000 characters.
  * Amount: Mandatory, numeric decimal > 0.00.
  * Justification: Mandatory, max 2000 characters.
  * Assigned Reviewer: Mandatory selection from active reviewer list (BR-02).
  * Reject/Return Reason: Mandatory non-empty string when rejecting or returning (BR-05).
* **Server-Side Mirroring:** All validations are re-checked authoritatively by Express middleware before database persistence.

### 4.5 Loading, Empty and Error States
* **Loading States:** Centered spinners (`spinner-border text-primary`) displayed during asynchronous data fetching; submit buttons disabled to prevent duplicate requests.
* **Empty States:** Clear informational cards (e.g., *"No purchase requests submitted yet"*, *"No requests currently pending your review"*).
* **Error States:** Dismissible alert boxes (`alert alert-danger`) displaying structured, human-readable error messages returned from the API (NFR-02).

---

## 5. API Design

### 5.1 API Conventions
* **Base URL:** All API endpoints are prefixed with `/api`.
* **Data Transport:** Payloads are transmitted as JSON with UTF-8 character encoding.
* **HTTP Verbs:**
  * `GET`: Idempotent retrieval of resources or reports.
  * `POST`: Creation of new entities (sessions, requests, review decisions).
  * `PUT` / `PATCH`: Updating existing requests (edits on returned requests).
* **Authentication:** Handled via HTTP-only cookie `macau678_session`.

### 5.2 Endpoint Naming Conventions

#### Authentication (`/api/auth`)
* `POST /api/auth/login`: Authenticate user credentials and set session cookie (FR-01, AC-01).
* `POST /api/auth/logout`: Invalidate session and clear cookie (FR-01).
* `GET /api/auth/me`: Retrieve currently authenticated user context and role (FR-01).

#### Requesters & Users (`/api/users`)
* `GET /api/users/reviewers`: Retrieve list of active Reviewers for assignment selection (FR-07, BR-02).

#### Purchase Requests (`/api/requests`)
* `POST /api/requests`: Create a new purchase request as `DRAFT` or `PENDING_REVIEW` (FR-02, AC-02).
* `GET /api/requests`: List requests for the logged-in user:
  * For `REQUESTER`: Returns own requests (`requesterId === currentUser.id`) (FR-03, AC-03).
  * For `REVIEWER`: Returns requests assigned to current reviewer (`reviewerId === currentUser.id`) (FR-03, BR-04, AC-04).
* `GET /api/requests/:id`: Retrieve detailed purchase request by ID, verifying access permission (FR-03, BR-09, AC-10).
* `PATCH /api/requests/:id`: Update request details. Permitted strictly if `status === RETURNED` and user is the requester (FR-05, BR-06, AC-07).
* `POST /api/requests/:id/submit`: Submit a `DRAFT` or resubmit a `RETURNED` request to `PENDING_REVIEW` (FR-02, BR-07, AC-07).
* `POST /api/requests/:id/review`: Record a review decision (`APPROVE`, `REJECT`, `RETURN`) with reason (FR-04, BR-03, BR-04, BR-05, AC-05, AC-06).
* `GET /api/requests/:id/history`: Retrieve full audit history timeline for a request (FR-06, BR-08, AC-11).

#### Reporting (`/api/reports`)
* `GET /api/reports/summary`: Aggregate counts of requests grouped by status (FR-08, AC-12).
* `GET /api/reports/requests`: Filter requests by status and date range (`startDate`, `endDate`) (FR-08, AC-12).

### 5.3 Request and Response Structure

#### Example: Create Purchase Request (`POST /api/requests`)
**Request Body:**
```json
{
  "title": "Ergonomic Office Chairs for Engineering Team",
  "description": "5x ergonomic mesh chairs to replace damaged office seating.",
  "amount": 1250.00,
  "justification": "Improves posture and replaces chairs with broken adjustment levers.",
  "reviewerId": 2,
  "status": "PENDING_REVIEW"
}
```

**Success Response (`201 Created`):**
```json
{
  "id": 101,
  "requestNumber": "PR-2026-00101",
  "title": "Ergonomic Office Chairs for Engineering Team",
  "amount": "1250.00",
  "status": "PENDING_REVIEW",
  "requesterId": 1,
  "reviewerId": 2,
  "createdAt": "2026-11-03T10:00:00.000Z"
}
```

#### Example: Review Decision (`POST /api/requests/:id/review`)
**Request Body:**
```json
{
  "decision": "REJECT",
  "reason": "Department budget for furniture has already been exhausted this quarter."
}
```

#### Standard Error Envelope
All error responses return a standardized JSON structure with appropriate HTTP status codes:
```json
{
  "error": "Reason is mandatory when rejecting or returning a purchase request.",
  "code": "VALIDATION_ERROR",
  "details": ["reason must not be empty"]
}
```

### 5.4 Validation and Error Handling
* `400 Bad Request` (`VALIDATION_ERROR`): Missing required fields, negative amount, missing rejection/return reason, or invalid status transition.
* `401 Unauthorized` (`AUTH_REQUIRED`, `INVALID_CREDENTIALS`): Unauthenticated user or invalid login credentials.
* `403 Forbidden` (`ACCESS_DENIED`, `SELF_REVIEW_FORBIDDEN`): User attempting to access another user's request (BR-09), requester attempting to review/approve their own request (BR-03), or reviewer attempting to review unassigned requests (BR-04).
* `404 Not Found` (`NOT_FOUND`): Request or user does not exist.
* `409 Conflict` (`INVALID_STATE_TRANSITION`): Attempting to edit a request that is not in `RETURNED` status (BR-06) or invalid lifecycle progression (BR-07).
* `500 Internal Server Error` (`INTERNAL_SERVER_ERROR`): Unhandled server exceptions.

---

## 6. Authentication and Authorization

### 6.1 Authentication Mechanism
* Users authenticate via email and password using `POST /api/auth/login`.
* Email addresses are sanitized (lowercased and trimmed).
* Account activation is checked (`isActive === true`); inactive accounts are denied with a generic credentials error to prevent enumeration.

### 6.2 Password Security
* **Storage:** Passwords are never stored in plaintext. They are hashed using `bcrypt` with a work factor of 10 rounds (NFR-01).
* **Validation:** Verified via `bcrypt.compare(password, user.passwordHash)`.
* **Password Policy:** Minimum 8 characters.

### 6.3 Session or Token Management
* **Token Standard:** JSON Web Token (JWT) signed with HMAC SHA-256 (`JWT_SECRET`).
* **Payload:** Contains `userId`, `email`, and `role`.
* **Expiration:** 8 hours (`expiresIn: "8h"`).
* **Storage & Transmission:** Placed into an HTTP-only cookie (`macau678_session`) with `httpOnly: true`, `sameSite: "lax"`, and `secure: process.env.NODE_ENV === "production"`.

### 6.4 Current-User Retrieval
* `GET /api/auth/me` reads the cookie, verifies token validity, checks the user in the database, and returns the sanitized user profile:
```json
{
  "user": {
    "id": 1,
    "name": "Alex Wong",
    "email": "alex.wong@macau678.com",
    "role": "REQUESTER"
  }
}
```

### 6.5 Logout Mechanism
* Handled via `POST /api/auth/logout`. The server executes `res.clearCookie("macau678_session")` with matching attributes, removing the token from the client browser (FR-01).

### 6.6 Role and Permission Matrix

| Feature / Action | Requester | Reviewer | Traced Requirement |
| :--- | :---: | :---: | :--- |
| Login / Logout | Yes | Yes | FR-01, AC-01 |
| View Own Requests | Yes | No (unless requester) | FR-03, AC-03 |
| Create Purchase Request | Yes | No | FR-02, BR-01, AC-02 |
| Edit Returned Request | Yes (Own) | No | FR-05, BR-06, AC-07 |
| Resubmit Request | Yes (Own) | No | FR-05, BR-07, AC-07 |
| View Assigned Review Queue | No | Yes | FR-03, BR-04, AC-04 |
| Approve Assigned Request | No | Yes | FR-04, BR-03, BR-04, AC-05 |
| Reject Assigned Request (with reason) | No | Yes | FR-04, BR-04, BR-05, AC-06 |
| Return Assigned Request (with reason) | No | Yes | FR-04, BR-04, BR-05, AC-06 |
| View Request History / Decision Log | Yes (Own) | Yes (Assigned) | FR-06, BR-08, AC-11 |
| View Reports & Filters | Yes | Yes | FR-08, AC-12 |

### 6.7 Record Ownership and Access Restrictions
1. **Requester Isolation (BR-09, AC-10):** Requesters are restricted to viewing and managing their own submitted requests. Attempts to access other requests return `404 Not Found` or `403 Forbidden`.
2. **Reviewer Scope Restriction (BR-04, AC-09):** A Reviewer can view and act upon only the requests explicitly assigned to them (`request.reviewerId === currentUser.id`).
3. **Non-Self-Approval Guard (BR-03, AC-08):** Even if a user holds a reviewer identity, the system blocks them from approving, rejecting, or returning any request where `request.requesterId === currentUser.id`.
4. **Lifecycle State Transition Matrix (BR-07):**
   * `Draft` $\rightarrow$ `Pending Review` (Submission)
   * `Pending Review` $\rightarrow$ `Approved` (Terminal Approval)
   * `Pending Review` $\rightarrow$ `Rejected` (Terminal Rejection)
   * `Pending Review` $\rightarrow$ `Returned` (Requires reason, enables editing)
   * `Returned` $\rightarrow$ `Pending Review` (Resubmission after edits)
   * `Approved` and `Rejected` are **Terminal States** (no further transitions or edits permitted per FR-05).

```mermaid
stateDiagram-v2
    [*] --> Draft : Create Request
    Draft --> PendingReview : Submit (BR-07)
    PendingReview --> Approved : Approve (FR-04, AC-05)
    PendingReview --> Rejected : Reject with reason (FR-04, BR-05, AC-06)
    PendingReview --> Returned : Return with reason (FR-04, BR-05, AC-06)
    Returned --> PendingReview : Edit & Resubmit (FR-05, BR-07, AC-07)
    Approved --> [*]
    Rejected --> [*]
```

---

## 7. Environment Variables

| Variable Name | Required | Example / Default Value | Purpose | Traced Requirement |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/macau678?schema=public` | PostgreSQL connection string for Prisma ORM | NFR-04 |
| `TEST_DATABASE_URL` | Yes (for tests) | `postgresql://postgres:postgres@localhost:5432/macau678_test?schema=public` | Isolated PostgreSQL database for Vitest and Playwright test suites | NFR-04 |
| `PORT` | No | `3000` | Port for Express backend server | NFR-05 |
| `JWT_SECRET` | Yes | `macau678-super-secret-jwt-key-min-32-chars` | Secret key used for signing and verifying session JWTs | NFR-01, FR-01 |
| `NODE_ENV` | No | `development` / `production` | Environment mode; controls cookie `Secure` flag and error stack trace display | NFR-01 |

---

## 8. Deployment Design

### 8.1 Local Development Deployment
* **Database Container:** PostgreSQL 16 Alpine container instantiated via Docker:
  ```bash
  docker run --name macau678-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=macau678 -p 5432:5432 -d postgres:16-alpine
  ```
* **Backend Application:** Served via `tsx watch src/index.ts` on port 3000.
* **Frontend Application:** Vite development server running on port 5173 with proxy configuration forwarding `/api` calls to port 3000.

### 8.2 Production and Cloud Deployment Architecture (Lab 5 & GCP Target)
Per section 5.1 and 5.3 of the course specifications, the application is designed to be containerized and deployable to Google Cloud Platform (GCP Cloud Run or GKE):

```mermaid
flowchart LR
    ClientBrowser["Client Browser (HTTPS)"]
    IngressProxy["Nginx / Cloud Load Balancer (:443)"]
    StaticClient["Vite Production SPA Assets"]
    ExpressAPI["Macau678 Express API Container (:3000)"]
    PostgresDB[("Managed PostgreSQL / Cloud SQL (:5432)")]

    ClientBrowser -->|HTTPS| IngressProxy
    IngressProxy -->|Serve UI| StaticClient
    IngressProxy -->|Proxy /api| ExpressAPI
    ExpressAPI -->|Prisma Connection Pool| PostgresDB
```

1. **Static Build & Serving:** Frontend built via `vite build` into static assets (`dist`), served via Nginx with caching headers.
2. **API Container:** Docker container running Node.js with compiled TypeScript (`node dist/src/index.js`).
3. **Database Layer:** Managed PostgreSQL instance (GCP Cloud SQL or containerized volume) with SSL enforcement and regular automated backups.
4. **Environment Isolation:** Secrets and configuration variables (`DATABASE_URL`, `JWT_SECRET`) provided through environment secret managers.

---

## 9. Identified Ambiguities and Decisions Log

| Item ID | Topic | Current SRS Status | System Design Decision / Resolution |
| :--- | :--- | :--- | :--- |
| **AMB-01** | Reviewer Assignment Mechanism | FR-07 states: *"The system shall assign each submitted request to an authorized Reviewer."* Does not specify whether this is automatic, round-robin, or selected by the Requester. | In Sprint 1, the Requester selects an active Reviewer from a dropdown during submission (`GET /api/users/reviewers`). Can be extended to automated routing in later sprints. |
| **AMB-02** | Currency & Numerical Scale | Amount is required in FR-02, but specific currency symbols or maximum bounds are not defined. | Standardized on `Decimal(12, 2)` (up to 9,999,999,999.99), formatted to 2 decimal places with strictly positive checks (`> 0.00`). |
| **AMB-03** | Request Numbering Scheme | Unique identifier not explicitly detailed in SRS. | Auto-generated human-readable reference number formatted as `PR-YYYY-XXXXX` based on auto-incrementing integer ID. |
| **AMB-04** | Draft Saving vs. Direct Submission | FR-02 mentions "submit their requests for review" and BR-07 includes `Draft -> Pending Review`. | System allows Requesters to save as `DRAFT` (status `DRAFT`, editing allowed) before formally clicking "Submit for Review" (transitions to `PENDING_REVIEW`). |
| **AMB-05** | Attachments & File Uploads | Not explicitly listed in Scope 3.1 or 3.2. | Excluded from Sprint 1 baseline to minimize unnecessary complexity; can be added in Sprint 2 under feature contracts if requested. |
