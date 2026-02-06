-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(50) CHECK (role IN ('guest', 'host', 'security', 'admin')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create VisitRequest table
CREATE TABLE IF NOT EXISTS "VisitRequest" (
    id SERIAL PRIMARY KEY,
    guest_id INT REFERENCES "User"(id),
    host_id INT REFERENCES "User"(id),
    purpose TEXT NOT NULL,
    description TEXT,
    visit_date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending_host_review', 'rejected_by_host', 'pending_security', 'rejected_by_security', 'approved')) NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Pass table
CREATE TABLE IF NOT EXISTS "Pass" (
    id SERIAL PRIMARY KEY,
    visit_request_id INT REFERENCES "VisitRequest"(id),
    code VARCHAR(255) UNIQUE NOT NULL,
    issued_by INT REFERENCES "User"(id),
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create TrafficLog table
CREATE TABLE IF NOT EXISTS "TrafficLog" (
    id SERIAL PRIMARY KEY,
    pass_id INT REFERENCES "Pass"(id),
    checked_in_at TIMESTAMP NOT NULL,
    checked_out_at TIMESTAMP,
    recorded_by INT REFERENCES "User"(id)
);

-- Create TokenBlacklist table for logout functionality
CREATE TABLE IF NOT EXISTS "TokenBlacklist" (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    user_id INT REFERENCES "User"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON "TokenBlacklist"(token);

