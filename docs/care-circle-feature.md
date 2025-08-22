# Care Circle Feature Documentation

## Overview

The Care Circle feature enables secure, granular sharing of health data with trusted caregivers, family members, and clinicians. This feature provides time-limited, scope-based access with comprehensive audit logging and emergency access capabilities.

## Key Features

### 1. Secure Invitation System
- Email-based invitations with magic links
- Role-based access control (Viewer/Editor)
- Granular scope permissions (medications, appointments, health logs, documents, profile)
- Time-limited access with customizable expiration dates
- Personal messages for context

### 2. Permission Management
- **Viewer Role**: Read-only access to specified data
- **Editor Role**: Full CRUD access to specified data
- **Scope Control**: Fine-grained permissions for different data types
- **Quick Presets**: Common permission bundles (Caregiver Basic, Clinician Read-only, etc.)

### 3. Audit Trail
- Complete activity logging for all delegated actions
- Filterable by resource type, date range, and actor
- CSV export functionality
- Real-time activity tracking

### 4. Emergency Access (ICE)
- Time-limited emergency access codes
- Single-use 6-digit codes
- Read-only access to essential information (medications, allergies)
- Owner notification when used

## User Interface Components

### Care Circle Main Page (`/care-circle`)

The main Care Circle page provides:
- Overview of all care circle members
- Member status indicators (Active, Pending, Expired, Revoked)
- Permission scope badges
- Quick action buttons (Edit, Revoke)
- Activity log access

**Key UI Elements:**
- Member cards showing email, role, status, and permissions
- "Invite Member" button for new invitations
- "View Activity" button for audit log access
- Responsive design for mobile and desktop

### Invite Modal

The invitation modal features:
- Email input with validation
- Role selection (Viewer/Editor)
- Individual permission checkboxes
- Quick preset buttons for common scenarios
- Duration selection with presets and custom options
- Personal message field
- Permission preview section

**Smart Features:**
- Real-time permission preview
- Validation of required fields
- Helpful tooltips explaining permissions
- Preset bundles for common use cases

### Audit Log Viewer

The audit viewer includes:
- Chronological activity list
- Filtering by resource type, date range, and limit
- Action icons for different operations (Create, Update, Delete, Download, View)
- Expandable metadata details
- CSV export functionality
- Responsive timeline view

### Access Control Components

**RestrictedAccessWrapper**: 
- Automatically enforces scope-based access
- Shows appropriate access badges
- Graceful fallback for denied access
- Higher-order component and hook variants

## Database Schema

### New Tables

1. **care_circle_members**
   - Member relationships and basic info
   - Status tracking (invited, active, revoked, expired)
   - Invite tokens and timestamps

2. **access_grants**
   - Permission scopes and expiration
   - Linked to care circle members
   - Granular permission control

3. **audit_log**
   - Complete activity tracking
   - Action and resource type logging
   - Metadata storage for context

4. **ice_tokens**
   - Emergency access code management
   - Single-use token tracking
   - Automatic expiration

### Enhanced RLS Policies

Updated Row Level Security policies support:
- Owner access to all own data
- Delegated access via care circle grants
- Automatic scope and role validation
- Time-based access expiration
- Audit trail generation

## API Endpoints

### `/api/care-circle`
- `GET`: List all care circle members with grants
- `POST ?action=invite`: Send new invitation
- `POST ?action=accept`: Accept invitation via token
- `PUT ?memberId=X`: Update member permissions
- `DELETE ?memberId=X`: Revoke member access

### `/api/audit-log`
- `GET`: Retrieve audit log with filtering options
- Query parameters: resourceType, startDate, endDate, limit

### `/api/ice`
- `POST`: Generate emergency access code
- `PUT`: Validate and use emergency access code

## Security Features

### Access Control
- Row Level Security enforcement
- Scope-based permission validation
- Time-limited access grants
- Automatic expiration handling

### Audit & Compliance
- Complete action logging
- Immutable audit trail
- Owner notifications for changes
- Emergency access tracking

### Privacy Protection
- Magic link expiration
- Single-use invite tokens
- Secure code generation
- No PHI exposure beyond grants

## Usage Scenarios

### Family Caregiver
1. Owner invites family member with "Caregiver Basic" preset
2. Grants access to medications and appointments
3. Sets 30-day expiration
4. Family member can view schedules and help with reminders

### Healthcare Provider
1. Owner invites clinician with "Clinician Read-only" preset
2. Grants access to health logs and documents
3. Sets custom expiration for appointment duration
4. Provider can review patient data during treatment

### Emergency Situation
1. Owner generates ICE code
2. First responder uses code for emergency access
3. Gets immediate access to medications and allergies
4. Owner is notified of emergency access use

## Technical Implementation

### Type Safety
- Comprehensive TypeScript definitions
- Zod schema validation
- Runtime type checking
- API contract enforcement

### Real-time Updates
- Supabase realtime subscriptions
- Automatic UI updates
- Live status changes
- Instant notifications

### Error Handling
- Graceful fallbacks
- User-friendly error messages
- Automatic retry mechanisms
- Comprehensive logging

### Performance
- Efficient database queries
- Proper indexing strategy
- Lazy loading for large datasets
- Optimized real-time subscriptions

## Testing

### Integration Tests
- Complete flow testing (invite → accept → use)
- Permission validation tests
- API endpoint validation
- Database function testing
- RLS policy verification

### Security Tests
- Access control validation
- Token expiration testing
- Unauthorized access prevention
- Audit log integrity

## Migration & Deployment

### Database Migration
Four migration files handle:
1. New table creation with proper relationships
2. Helper functions for access control
3. Enhanced RLS policies for existing tables
4. Audit triggers for automatic logging

### Environment Setup
No additional environment variables required - uses existing Supabase configuration.

### Rollback Strategy
All changes are additive - existing functionality remains unchanged if Care Circle features are not used.

## Future Enhancements

### Planned Features
- Email notification system
- Mobile push notifications
- Advanced permission templates
- Bulk permission management
- Integration with external health systems

### Scalability Considerations
- Partition strategy for large audit logs
- Caching for frequent access checks
- Background job processing for notifications
- Multi-tenant isolation improvements