Introduction to the GatePass360 system is a web-based system for managing individual access requests to an organizational, academic, or administrative complex. This system performs the process of requesting access, reviewing, approving, and recording entry and exit in a structured and trackable manner. The goal of the system is to eliminate manual and paper processes, increase transparency, and accurately record the history of entry and exit of individuals; so that the status of a request or list of individuals present in the complex can be viewed at any time. 2. Roles and Access Levels The system includes four main roles, each role having specific tasks and access. Guest
• Register a login request
• View the status of your requests
• View the issued permission (if approved)

Host
• View your own requests
• Approve or reject the guest request
• Record an explanation if the request is rejected

Security
• View requests approved by the host
• Issuing login permission
Internet Engineers of Systems Engineers
• Register guest login and logout

Admin
• Manage users and roles
• View all requests and reports
• Full access to all parts of the system
All access restrictions are applied only on the server side.
3. System performance scenario
   The system workflow is designed in a step-by-step and trackable manner.
   Initially, the guest completes the login request form. This form includes basic information such as name,
   contact number, purpose of visit, date of visit, and host name. After registration, the request is in
   the "Waiting for host review" status.
   After logging into the system, the host views the request and decides to approve or reject it. If rejected, the reason for rejection is stored in the system and is visible to the guest.
   If the request is approved, its status changes to the stage of review by the security guard.
   In the next stage, the security guard reviews the request and, if finally approved, issues an entry permit. This permit has a unique QR code or simple numeric code and a validity period.
   At the time of visit, the security guard registers the permit code in the system. If the permit is valid and not expired, the guest's entry is registered. At the time of departure, an exit registration is also performed so that the system can accurately maintain the presence status of people.
   At any time, the system administrator can view a complete report of requests, entries and exits

Frontend:
HTML, CSS and JavaScript
Communication with the server via Fetch API
• Backend:
Node.js and Express
RESTful architecture
• Database:
PostgreSQL
• Authentication:
JWT with expiration date
• Authorization:
Role-Based Access Control (RBAC)
.5 Application Programming Interfaces (APIs)
Authentication
• POST /api/auth/register
• POST /api/auth/login
• POST /api/auth/logout
• GET /api/auth/me
Request login
• POST /api/visits (guest)
• GET /api/visits/me (guest)
• GET /api/visits/host (host)
• PATCH /api/visits/:id/approve (host)
• PATCH /api/visits/:id/reject (host)
Internet Engineers, Systems Engineers
Authorization and Traffic
• POST /api/passes (security)
• POST /api/passes/check-in (security)
• POST /api/passes/check-out (security)

Administration
• GET /api/admin/reports
• PATCH /api/admin/users/:id/role
.6User Interface
• Guest Request Registration Page
• Request Status Tracking Page
• Host Panel for Reviewing Requests
• Security Panel for Licensing and Traffic Registration
• Management Panel for Reports
• Display List of People in the Collection (Based on Logins and No Logouts)
.7Security Considerations
• Password Hashing with bcrypt
• Input Data Validation
• Check License Expiration Before Registering Login
• Prevent Reuse of Used License
• Use Parameterized Queries to Prevent SQL Injection