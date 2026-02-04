## Database schema

1. User
   id (PK)
   name
   email
   password_hash
   phone
   role (enum: guest, host, security, admin)
   created_at
   updated_at
2. VisitRequest
   id (PK)
   guest_id (FK → User)
   host_id (FK → User)
   purpose
   visit_date
   status (enum: pending_host_review, rejected_by_host, pending_security, rejected_by_security, approved)
   rejection_reason (nullable)
   created_at
   updated_at
3. Pass (Entry Permit)
   id (PK)
   visit_request_id (FK → VisitRequest)
   code (unique QR/numeric code)
   issued_by (FK → User, security role)
   valid_from
   valid_until
   is_used (boolean)
   created_at
4. TrafficLog (Check-in/Check-out)
   id (PK)
   pass_id (FK → Pass)
   checked_in_at
   checked_out_at (nullable)
   recorded_by (FK → User, security role)