# Software Requirements Specification (SRS)

## Event Ticketing and Management Platform

**Version:** 1.0  
**Status:** Initial Requirements Specification  
**Document Type:** Software Requirements Specification

---

## Table of Contents

1. [Introduction
   - [1.1 Purpose]
   - [1.2 Scope]
2. [Overall Description]
   - [2.1 Product Perspective]
3. [User Classes and Characteristics]
   - [3.1 Unregistered User]
   - [3.2 Registered Customer]
   - [3.3 Event Organizer]
   - [3.4 Event Staff]
4. [Functional Requirements]
   - [4.1 Event Discovery]
   - [4.2 Customer Authentication]
   - [4.3 Ticket Booking and Purchase]
   - [4.4 Digital Ticket Generation]
   - [4.5 Booking and Ticket History]
   - [4.6 Ticket Validation]
   - [4.7 Event Organizer Requirements]
5. [Non-Functional Requirements]
6. [Major System Use Cases]
7. [Key System Workflows]
8. [Technology Requirements]
9. [Requirement Summary]
---

# 1. Introduction

## 1.1 Purpose

The purpose of this Software Requirements Specification (SRS) is to define the functional and non-functional requirements of an **Event Ticketing and Management Platform**.

The platform will allow customers to discover events, view event information, purchase tickets, receive digital tickets containing QR codes or barcodes, and present those tickets for validation at event entrances.

The system will also provide event organizers with tools to create and manage events, configure ticket pricing and capacity, monitor ticket sales and attendance, and validate customer tickets.

This document establishes the requirements that will guide the design, development, testing, and evaluation of the system.

---

## 1.2 Scope

The system will be a web-based platform consisting primarily of four user roles:

- **Unregistered User**
- **Registered Customer**
- **Event Organizer**
- **Event Staff**

Unregistered users will be able to discover and browse events without creating an account. Authentication will be required when a customer wants to purchase or book a ticket.

Authenticated customers will be able to:

- Search and discover events.
- Filter and sort events.
- View event details.
- Purchase tickets.
- Receive digital tickets.
- View QR codes/barcodes.
- Save or download tickets.
- View booking and ticket history.

Event organizers will be able to:

- Create and manage events.
- Set and update ticket prices.
- Manage event capacity and ticket availability.
- Monitor ticket sales.
- Track attendance.
- Validate tickets at event entrances.
- Monitor event performance.

---

# 2. Overall Description

## 2.1 Product Perspective

The system will operate as a centralized web-based event management and ticketing platform.

The platform will connect customers, event organizers, and authorized event staff through a common system.

`                         EVENT TICKETING PLATFORM
                                    |
        +---------------+-----------+-----------+---------------+
        |               |                       |               |
        v               v                       v               v
    CUSTOMER       ORGANIZER              EVENT STAFF      ADMINISTRATOR
        |               |                       |               |
  Discover Events   Manage Events         Validate Tickets   Oversee Platform
  Purchase Tickets  Manage Pricing        Scan QR/Barcode    Approve Organizers
  View Ticket       Track Sales           Check Validity     Approve Events
  View History      Track Attendance      Record Attendance  Handle Disputes
                                                             View Statistics
---

# 3. User Classes and Characteristics

## 3.1 Unregistered User

An unregistered user is a visitor who accesses the platform without creating or logging into an account.

The user will be able to:

- Browse events.
- Search for events.
- Filter events.
- Sort events.
- View event details.

The user will **not** be able to complete a ticket purchase until authenticated.

---

## 3.2 Registered Customer

A registered customer is an authenticated user who has an account on the platform.

The customer will be able to:

- Browse events.
- Search, filter and sort events.
- View event details.
- Purchase tickets.
- View digital tickets.
- Download or save tickets.
- View booking history.
- View previously purchased tickets.

---

## 3.3 Event Organizer

An event organizer is an authenticated user responsible for creating and managing events.

The organizer will be able to:

- Create and update events.
- Configure ticket prices.
- Configure event capacity.
- Monitor ticket availability.
- Track ticket sales.
- Track attendance.
- Monitor event performance.

---

## 3.4 Event Staff

Event staff are authorized users responsible for validating tickets at event entrances.

Event staff will be able to:

- Scan QR codes/barcodes.
- Verify ticket validity.
- Confirm that the ticket belongs to the correct event.
- Determine whether a ticket has already been used.
- Accept or reject tickets.
- View the validation result.
- Record attendance through ticket validation.

---

## 3.5 System Administrator

A system administrator is an authenticated user responsible for overseeing the
entire platform. The administrator ensures that organizers are legitimate, events
are legitimate, disputes are resolved, and the platform operates correctly.

The administrator will be able to:

- View and manage all user accounts.
- Approve or reject organizer accounts.
- Approve or reject events before publication.
- Suspend or ban accounts that violate platform rules.
- View platform-wide statistics (total users, events, sales, revenue).
- Handle customer complaints and disputes.
- Process refunds where required.
- Take down fraudulent, misleading, or rule-breaking events.
- Monitor system health and activity.

# 4. Functional Requirements

Functional requirements describe **what the system must do**.

---

## 4.1 Event Discovery

### FR-01: Access Events Without Authentication

The system shall allow an unregistered user to access the web application using a modern web browser without logging in.

### FR-02: Browse Events

The system shall display available events to users without requiring authentication.

### FR-03: Search Events

The system shall allow users to search for events using a search function.

### FR-04: Filter Events

The system shall allow users to filter events based on relevant event attributes such as:

- Event category
- Date
- Location
- Price
- Availability

### FR-05: Sort Events

The system shall allow users to sort event search results according to available sorting criteria.

### FR-06: View Event Details

The system shall display detailed information when a user selects an event.

Event details may include:

- Event name
- Description
- Date
- Time
- Location
- Ticket price
- Ticket availability
- Event image
- Organizer information

---

## 4.2 Customer Authentication

### FR-07: Customer Registration

The system shall allow a new customer to create an account.

### FR-08: Customer Login

The system shall allow registered customers to authenticate themselves.

### FR-09: Authentication Before Purchase

The system shall require a customer to be authenticated before purchasing a ticket.

### FR-10: Prevent Unauthorized Purchases

The system shall prevent unauthenticated users from completing ticket purchases.

---

## 4.3 Ticket Booking and Purchase

### FR-11: Select Ticket

The system shall allow an authenticated customer to select an available ticket for an event.

### FR-12: Display Ticket Price

The system shall clearly display the ticket price before the customer confirms the purchase.

### FR-13: Purchase Ticket

The system shall allow an authenticated customer to purchase an available ticket.

### FR-14: Confirm Purchase

The system shall provide confirmation after a successful ticket purchase.

### FR-15: Prevent Purchase Beyond Capacity

The system shall prevent customers from purchasing tickets when the event has reached its configured capacity.

### FR-16: Update Ticket Availability

The system shall update ticket availability after a successful purchase.

---

## 4.4 Digital Ticket Generation

### FR-17: Generate Digital Ticket

The system shall generate a digital ticket after a successful purchase.

### FR-18: Assign Unique Ticket Identifier

The system shall assign a unique identifier to every generated ticket.

### FR-19: Generate QR Code/Barcode

The system shall generate a QR code or barcode associated with each ticket.

### FR-20: Display Ticket Information

The system shall display relevant information on the digital ticket, including:

- Ticket identifier
- Event name
- Event date
- Event time
- Event location
- Ticket type
- Customer information where applicable
- QR code/barcode

### FR-21: View Digital Ticket

The system shall allow an authenticated customer to view their digital ticket.

### FR-22: Save/Download Ticket

The system shall allow customers to save or download their digital tickets for offline use.

---

## 4.5 Booking and Ticket History

### FR-23: View Booking History

The system shall allow authenticated customers to view their previous bookings.

### FR-24: View Purchased Tickets

The system shall display all tickets purchased by an authenticated customer in one location.

### FR-25: Access Previous Tickets

The system shall allow customers to access their previously generated tickets.

---

## 4.6 Ticket Validation

### FR-26: Scan Ticket

The system shall allow authorized event staff to scan a ticket's QR code or barcode.

### FR-27: Verify Ticket

The system shall verify whether the scanned ticket exists and is valid.

### FR-28: Verify Event

The system shall verify that the ticket belongs to the event at which it is being scanned.

### FR-29: Reject Invalid Tickets

The system shall reject tickets that are invalid, nonexistent, expired, or otherwise unauthorized.

### FR-30: Detect Previously Used Tickets

The system shall detect whether a ticket has already been validated.

### FR-31: Prevent Ticket Reuse

The system shall prevent a successfully validated ticket from being reused for entry.

### FR-32: Display Validation Result

The system shall display the ticket validation result to authorized event staff.

The result should clearly indicate whether the ticket is:

- Valid
- Invalid
- Already used
- Not associated with the event

### FR-33: Record Ticket Validation

The system shall record successful ticket validation for attendance tracking.

---

## 4.7 Event Organizer Requirements

### FR-34: Create Event

The system shall allow an authorized event organizer to create an event.

### FR-35: Update Event

The system shall allow an event organizer to update event information.

### FR-36: Set Ticket Pricing

The system shall allow an event organizer to configure ticket prices.

### FR-37: Update Ticket Pricing

The system shall allow an event organizer to update ticket prices where permitted.

### FR-38: Configure Event Capacity

The system shall allow an event organizer to define the maximum number of tickets available for an event.

### FR-39: Monitor Availability

The system shall allow an event organizer to monitor ticket availability in real time.

### FR-40: Track Ticket Sales

The system shall allow event organizers to view the number of tickets sold.

### FR-41: Track Attendance

The system shall allow event organizers to monitor attendance based on validated tickets.

### FR-42: Monitor Event Performance

The system shall provide event organizers with information that allows them to monitor overall event performance.

Performance information may include:

- Tickets available
- Tickets sold
- Tickets remaining
- Tickets validated
- Attendance
- Sales revenue

---
## 4.8 Administrator Requirements

### FR-43: View All Users

The system shall allow an administrator to view a list of all registered users,
including customers, organizers, and event staff.

### FR-44: Approve or Reject Organizer Accounts

The system shall allow an administrator to approve or reject applications from
users wishing to become event organizers.

### FR-45: Approve or Reject Events

The system shall allow an administrator to review an event before it becomes
publicly visible and to approve or reject it.

### FR-46: Suspend or Ban Accounts

The system shall allow an administrator to suspend or permanently ban user
accounts that violate platform policies.

### FR-47: View Platform-Wide Statistics

The system shall allow an administrator to view platform-wide statistics,
including:

- Total number of users
- Total number of organizers
- Total number of events
- Total tickets sold
- Total revenue
- Total disputes and refunds

### FR-48: Handle Disputes and Refunds

The system shall allow an administrator to review customer complaints and
process refunds where required.

### FR-49: Take Down Events

The system shall allow an administrator to remove or disable events that are
fraudulent, misleading, or violate platform rules.

### FR-50: Monitor System Health

The system shall allow an administrator to monitor platform activity, errors,
and suspicious behavior.
# 5. Non-Functional Requirements

Non-functional requirements describe **how well the system should perform its functions**.

---

## 5.1 Performance

### NFR-01: Fast Event Discovery

The system shall load event discovery and search results within an acceptable response time under normal operating conditions.

### NFR-02: Efficient Ticket Purchase

The ticket purchasing process shall require a minimal number of steps while maintaining transaction security.

### NFR-03: Efficient Data Fetching

The system shall minimize unnecessary API requests when retrieving event and ticket information.

---

## 5.2 Caching

### NFR-04: Client-Side Caching

The system shall use caching to reduce unnecessary API requests and improve application performance.

### NFR-05: TanStack Query

The frontend shall use **TanStack Query** to manage server-state fetching, caching, synchronization and refetching.

---

## 5.3 Responsiveness

### NFR-06: Responsive Interface

The system shall provide responsive interfaces for:

- Mobile devices
- Tablets
- Desktop computers

### NFR-07: Cross-Device Functionality

The core customer and organizer functionality shall remain usable across supported screen sizes.

---

## 5.4 Browser Compatibility

### NFR-08: Modern Browser Support

The system shall operate on commonly used modern web browsers, including:

- Microsoft Edge
- Google Chrome
- Mozilla Firefox
- Safari where applicable

---

## 5.5 Usability

### NFR-09: Simple Navigation

The system shall provide intuitive navigation that allows users to move between major sections without unnecessary steps.

### NFR-10: Low-Friction User Experience

The system shall minimize unnecessary steps during event discovery and ticket purchasing.

### NFR-11: Clear Pricing

The system shall display ticket prices clearly before purchase confirmation.

### NFR-12: Intuitive Organizer Interface

The organizer interface shall provide clear and understandable controls for:

- Event setup
- Ticket management
- Sales tracking
- Attendance monitoring

---

## 5.6 Accessibility

### NFR-13: Accessible Interface

The system shall provide an interface that is usable by users with different accessibility needs.

This should include appropriate:

- Text contrast
- Button sizes
- Form labels
- Keyboard navigation
- Meaningful error messages

---

## 5.7 Routing

### NFR-14: Client-Side Routing

The frontend shall use **TanStack Router** to provide structured and intuitive navigation between application views.

---

## 5.8 Security

### NFR-15: Secure Authentication

The system shall authenticate customers and organizers before allowing access to protected functionality.

### NFR-16: Protected Transactions

The system shall protect ticket purchasing operations against unauthorized access.

### NFR-17: Ticket Uniqueness

Every generated ticket shall have a unique identifier.

### NFR-18: Ticket Verification

The system shall verify tickets against the system's ticket records before granting entry.

### NFR-19: Ticket Reuse Prevention

The system shall prevent a successfully validated ticket from being used again.

### NFR-20: Authorization

The system shall restrict organizer and ticket-validation functionality to authorized users.

---

## 5.9 Reliability

### NFR-21: Reliable Ticket Generation

The system shall generate a ticket only after a successful purchase has been confirmed.

### NFR-22: Reliable Validation

The ticket validation process shall provide a consistent validation result when the system and required services are available.

### NFR-23: Data Consistency

The system shall maintain consistency between:

- Ticket availability
- Purchases
- Generated tickets
- Ticket validation
- Attendance records

---

## 5.10 Maintainability

### NFR-24: Type Safety

The frontend shall use **ReactJS and TypeScript** to improve maintainability and reduce runtime errors.

### NFR-25: Modular Architecture

The system shall be developed using a modular architecture that separates major functionality such as:

- Authentication
- Events
- Tickets
- Payments
- Users
- Event management
- Ticket validation


## 5.11 Administrative Security

### NFR-26: Administrator Authorization

The system shall restrict administrator functionality to users explicitly
assigned the administrator role.

### NFR-27: Audit Logging

The system shall record all administrator actions, including account approvals,
event approvals, suspensions, and refunds, for accountability and review.

### NFR-28: Separation of Roles

A user shall not be able to hold both the organizer and administrator roles
simultaneously, to prevent conflicts of interest.
---

# 6. Major System Use Cases

| User | Major Use Cases |
|---|---|
| **Unregistered User** | Browse events, search events, filter events, sort events, view event details |
| **Customer** | Register, login, search events, view event, purchase ticket, view digital ticket, download ticket, view booking history |
| **Event Organizer** | Create event, update event, set prices, set capacity, monitor availability, track sales, track attendance, monitor performance |
| **Event Staff** | Scan ticket, verify ticket, verify event, check previous use, accept/reject ticket, record attendance |

---

# 7. Key System Workflows

## 7.1 Customer Ticket Purchase Workflow

```text
User opens platform
        |
        v
Browse events
        |
        v
Search / Filter / Sort
        |
        v
Select event
        |
        v
View event details
        |
        v
Attempt to purchase
        |
        v
Is user authenticated?
       / \
     NO   YES
     |     |
     v     v
 Login   Select ticket
 /Signup     |
             v
       Confirm purchase
             |
             v
       Payment successful?
          /       \
        NO         YES
        |           |
        v           v
   Show error   Generate ticket
                   |
                   v
             Generate QR code
                   |
                   v
             Display ticket
                   |
                   v
             Save / Download
```

---

## 7.2 Ticket Validation Workflow

```text
Customer presents digital ticket
             |
             v
       Scan QR/Barcode
             |
             v
      Find ticket record
             |
             v
       Is ticket valid?
          /        \
        NO          YES
        |            |
        v            v
      REJECT     Check event
                     |
                     v
              Correct event?
                /       \
              NO         YES
              |           |
              v           v
            REJECT    Already used?
                         /      \
                       YES       NO
                       |          |
                       v          v
                     REJECT     ACCEPT
                                  |
                                  v
                         Mark ticket as used
                                  |
                                  v
                         Record attendance
```

---

# 8. Technology Requirements

| Area | Technology / Requirement |
|---|---|
| Frontend Framework | ReactJS |
| Programming Language | TypeScript |
| Server-State Management | TanStack Query |
| Client-Side Routing | TanStack Router |
| Ticket Representation | QR Code / Barcode |
| Application Type | Web Application |
| Supported Devices | Mobile, Tablet, Desktop |
| Supported Browsers | Modern web browsers |

> **Note:** Backend, database, payment provider and authentication technologies can be added once the project team finalizes the system architecture.

---

# 9. Requirement Summary

| Area | Main Functionality |
|---|---|
| **Event Discovery** | Browse, search, filter, sort and view events |
| **Authentication** | Registration and login |
| **Ticket Purchasing** | Select and purchase tickets |
| **Digital Tickets** | Generate, display, save and download tickets |
| **Ticket Validation** | Scan, verify and prevent ticket reuse |
| **Organizer Management** | Events, pricing, capacity, sales, attendance and performance |

---

# Team Contribution / Change Log



# Team

| Member | Reg Number | Area |
|---|---|---|
| Mwandira Blessings Trevor | BED/COM/13/24 | organiser functional requirements |
| Jimu Ishmael Amos | BSC/19/23 | Ticket-generation and door  validation|
| Tukula Paul | BED/COM/50/22 | Custoomer Requirements |
| Lobeni Joshua Sibusiso | BSC/INF/06/24 |non Functional Requirements |
| Chiumia Misheck | BSC/COM/22/24 | SRS and documention |



## Document Status

**Current Version:** 1.0  
**Status:** Initial Requirements Specification  
**Next Review:** To be determined by the project team