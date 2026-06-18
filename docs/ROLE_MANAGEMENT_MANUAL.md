# Role Management Manual — AWYAD MES

> **Version:** 1.0  
> **System:** AWYAD Monitoring, Evaluation & Reporting System  
> **Audience:** System Administrators, AWYAD Managers

---

## Overview

The AWYAD MES uses a **role-based access control (RBAC)** model. Every user account is assigned one or more roles. A role is a named set of permissions that controls which modules and actions that user can perform.

Roles are managed under **Settings → User Management** (admin access required).

---

## Full Permissions Reference

The following permissions exist in the system. Each role is granted a specific subset.

| Permission | Module | What it allows |
|---|---|---|
| `users.create` | Users | Create new user accounts |
| `users.read` | Users | View user list and profiles |
| `users.update` | Users | Edit user details and status |
| `users.delete` | Users | Delete user accounts |
| `users.manage_roles` | Users | Assign or remove roles from users |
| `roles.create` | Roles | Create new roles |
| `roles.read` | Roles | View roles and their permission sets |
| `roles.update` | Roles | Edit role permission sets |
| `roles.delete` | Roles | Delete roles |
| `permissions.read` | Permissions | View available permissions |
| `permissions.manage` | Permissions | Grant or revoke permissions on roles |
| `projects.create` | Projects | Create new projects |
| `projects.read` | Projects | View project list and details |
| `projects.update` | Projects | Edit project information |
| `projects.delete` | Projects | Delete projects |
| `projects.manage_members` | Projects | Add or remove project team members |
| `activities.create` | Activities | Create new activities |
| `activities.read` | Activities | View own activities |
| `activities.update` | Activities | Edit activities |
| `activities.delete` | Activities | Delete activities |
| `activities.read_all` | Activities | View activities across all projects/users |
| `indicators.create` | Indicators | Create new indicators |
| `indicators.read` | Indicators | View indicators and targets |
| `indicators.update` | Indicators | Edit indicators and enter data |
| `indicators.delete` | Indicators | Delete indicators |
| `cases.create` | Case Management | Create new cases |
| `cases.read` | Case Management | View cases |
| `cases.update` | Case Management | Edit cases |
| `cases.delete` | Case Management | Delete cases |
| `reports.view` | Reports | View reports and analytics |
| `reports.export` | Reports | Export data to Excel/CSV |
| `dashboard.view` | Dashboard | View the main dashboard |
| `dashboard.view_all` | Dashboard | View organisation-wide data on dashboard |
| `donors.create` | Donors | Add new donors |
| `donors.read` | Donors | View donor list |
| `donors.update` | Donors | Edit donor information |
| `donors.delete` | Donors | Delete donors |
| `strategies.create` | Strategy Framework | Create strategies |
| `strategies.read` | Strategy Framework | View strategies |
| `strategies.update` | Strategy Framework | Edit strategies |
| `strategies.delete` | Strategy Framework | Delete strategies |
| `pillars.create` | Strategy Framework | Create pillars |
| `pillars.read` | Strategy Framework | View pillars |
| `pillars.update` | Strategy Framework | Edit pillars |
| `pillars.delete` | Strategy Framework | Delete pillars |
| `components.create` | Strategy Framework | Create programme components |
| `components.read` | Strategy Framework | View programme components |
| `components.update` | Strategy Framework | Edit programme components |
| `components.delete` | Strategy Framework | Delete programme components |
| `audit_logs.read` | Audit Logs | View system audit trail |
| `audit_logs.export` | Audit Logs | Export audit logs |

---

## Roles

### 1. Administrator (`admin`)

> **System role — cannot be deleted.**  
> Full, unrestricted access to every module and function in the system.

**Intended for:** IT administrators and designated system owners only.

#### Granted Access
All permissions in the system — every module, every action.

#### Restricted Access
None.

---

### 2. AWYAD Admin (`awyad_admin`)

> Full system administration equivalent to Administrator, specifically for AWYAD staff managing the platform.

**Intended for:** Senior AWYAD staff responsible for platform governance.

#### Granted Access
All permissions in the system — every module, every action (identical to `admin`).

#### Restricted Access
None.

---

### 3. Manager (`manager`)

> Can manage projects and activities across the organisation, view all data, and produce reports.

**Intended for:** Programme managers and team leads overseeing multiple projects.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | Create, view, edit, manage members |
| Activities | Create, view (own + all), edit |
| Indicators | Create, view, edit |
| Case Management | Create, view, edit |
| Reports | View, export |
| Dashboard | View (own data + all organisation data) |
| Users | View user list |
| Donors | View, create, edit |
| Strategy Framework | View strategies, pillars, components |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Delete projects |
| Activities | Delete activities |
| Indicators | Delete indicators |
| Cases | Delete cases |
| Users | Create, edit, delete users; assign roles |
| Roles & Permissions | No access |
| Donors | Delete donors |
| Strategy Framework | Create, edit, delete strategies / pillars / components |
| Audit Logs | No access |

---

### 4. Program Officer (`program_officer`)

> Manages project activities, budgets, and operational reporting for assigned projects.

**Intended for:** Programme officers handling day-to-day project implementation.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | Create, view, edit, manage members |
| Activities | Create, view (own + all), edit |
| Indicators | View |
| Case Management | Create, view, edit |
| Reports | View |
| Dashboard | View |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Delete projects |
| Activities | Delete activities |
| Indicators | Create, edit, delete |
| Cases | Delete cases |
| Reports | Export |
| Dashboard | Organisation-wide view |
| Users | All user management |
| Roles & Permissions | No access |
| Donors | No access |
| Strategy Framework | No access |
| Audit Logs | No access |

---

### 5. M&E Coordinator (`me_coordinator`)

> Full indicator creation and validation access; views all project data and dashboards.

**Intended for:** M&E leads responsible for the monitoring and evaluation framework.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Indicators | Create, view, edit, delete |
| Projects | View |
| Activities | View (own + all) |
| Reports | View, export |
| Dashboard | View (own + all organisation data) |
| Audit Logs | View |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Create, edit, delete, manage members |
| Activities | Create, edit, delete |
| Case Management | No access |
| Users | All user management |
| Roles & Permissions | No access |
| Donors | No access |
| Strategy Framework | No access |
| Audit Logs | Export |

---

### 6. M&E Officer (`me_officer`)

> Full M&E system access with approval rights.

**Intended for:** M&E officers supporting the M&E Coordinator.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Indicators | Create, view, edit, delete |
| Projects | View |
| Activities | View (own + all) |
| Reports | View, export |
| Dashboard | View (own + all organisation data) |
| Audit Logs | View |

#### Restricted Access
Same as **M&E Coordinator** — no project management, no case management, no user/role administration.

---

### 7. M&E Assistant (`me_assistant`)

> Data entry and basic M&E reporting.

**Intended for:** Junior M&E staff performing data collection and entry.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Indicators | Create, view, edit, delete |
| Projects | View |
| Activities | View (own + all) |
| Reports | View, export |
| Dashboard | View (own + all organisation data) |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Create, edit, delete, manage members |
| Activities | Create, edit, delete |
| Case Management | No access |
| Users | All user management |
| Roles & Permissions | No access |
| Donors | No access |
| Strategy Framework | No access |
| Audit Logs | No access |

---

### 8. Finance Manager (`finance_manager`)

> Manages financial tracking, expenditures, and budget approvals across all projects.

**Intended for:** Finance leads with oversight responsibility.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | View |
| Activities | View (own + all) |
| Reports | View, export |
| Dashboard | View |
| Audit Logs | View, export |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Create, edit, delete, manage members |
| Activities | Create, edit, delete |
| Indicators | No access |
| Case Management | No access |
| Users | All user management |
| Roles & Permissions | No access |
| Donors | No access |
| Strategy Framework | No access |

---

### 9. Finance Officer (`finance_officer`)

> Financial oversight and approval.

**Intended for:** Finance officers reviewing and approving financial entries.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | View |
| Activities | View (own + all) |
| Reports | View, export |
| Dashboard | View |
| Audit Logs | View, export |

#### Restricted Access
Same as **Finance Manager** — read-only access limited to financial reporting data.

---

### 10. Finance Assistant (`finance_assistant`)

> Financial data entry.

**Intended for:** Junior finance staff entering expenditure and budget data.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | View |
| Activities | View (own + all) |
| Reports | View, export |
| Dashboard | View |
| Audit Logs | View, export |

#### Restricted Access
Same as **Finance Officer** — no creation, editing, or deletion rights.

---

### 11. Executive Management (`executive`)

> Strategic view and oversight across all programmes.

**Intended for:** Executive Director and senior leadership.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | View |
| Activities | View (own + all) |
| Reports | View, export |
| Dashboard | View (own + all organisation data) |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Create, edit, delete, manage members |
| Activities | Create, edit, delete |
| Indicators | No access |
| Case Management | No access |
| Users | All user management |
| Roles & Permissions | No access |
| Donors | No access |
| Strategy Framework | No access |
| Audit Logs | No access |

---

### 12. Project Coordinator (`project_coordinator`)

> Coordinates and manages project implementation for assigned projects.

**Intended for:** Coordinators responsible for specific project delivery.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | Create, view, edit, manage members |
| Activities | Create, view (own + all), edit |
| Indicators | View |
| Case Management | Create, view, edit |
| Reports | View |
| Dashboard | View |

#### Restricted Access
Same as **Program Officer** — no deletion rights, no financial or administrative access.

---

### 13. User (`user`)

> Can create and edit own activities and view shared data.

**Intended for:** General staff requiring basic data entry access.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | View |
| Activities | Create, view (own only), edit |
| Indicators | View |
| Case Management | Create, view, edit |
| Reports | View, export |
| Dashboard | View (own data only) |
| Donors | View |
| Strategy Framework | View strategies, pillars, components |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Create, edit, delete, manage members |
| Activities | Delete, view other users' activities |
| Indicators | Create, edit, delete |
| Cases | Delete |
| Dashboard | Organisation-wide view |
| Users | All user management |
| Roles & Permissions | No access |
| Donors | Create, edit, delete |
| Strategy Framework | Create, edit, delete |
| Audit Logs | No access |

---

### 14. Viewer (`viewer`)

> Read-only access to view data and reports.

**Intended for:** Stakeholders, auditors, or observers who need to view data but must not modify anything.

#### Granted Access

| Module | Allowed Actions |
|---|---|
| Projects | View |
| Activities | View (own only) |
| Indicators | View |
| Case Management | View |
| Reports | View |
| Dashboard | View (own data only) |
| Donors | View |
| Strategy Framework | View strategies, pillars, components |

#### Restricted Access

| Module | What is blocked |
|---|---|
| Projects | Create, edit, delete, manage members |
| Activities | Create, edit, delete, view all |
| Indicators | Create, edit, delete |
| Cases | Create, edit, delete |
| Reports | Export |
| Dashboard | Organisation-wide view |
| Users | All user management |
| Roles & Permissions | No access |
| Donors | Create, edit, delete |
| Strategy Framework | Create, edit, delete |
| Audit Logs | No access |

---

## Permissions Summary Matrix

| Permission | admin | awyad_admin | manager | program_officer | me_coordinator | me_officer | me_assistant | finance_manager | finance_officer | finance_assistant | executive | project_coordinator | user | viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| users.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users.read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users.update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users.manage_roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| roles.*/permissions.manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| projects.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| projects.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| projects.update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| projects.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| projects.manage_members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| activities.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| activities.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| activities.update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| activities.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| activities.read_all | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| indicators.create | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| indicators.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| indicators.update | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| indicators.delete | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| cases.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| cases.read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| cases.update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| cases.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| reports.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports.export | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| dashboard.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| dashboard.view_all | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| donors.create/update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| donors.read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| donors.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| strategies/pillars/components — read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| strategies/pillars/components — create/update/delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| audit_logs.read | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| audit_logs.export | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Assigning Roles to Users

1. Log in as an **Administrator** or **AWYAD Admin**.
2. Navigate to **Settings → User Management**.
3. Click the user's name to open their profile.
4. Under **Assign Roles**, check the desired role(s) and save.

> A user can hold **multiple roles**. Their effective permissions are the **union** of all granted permissions across all assigned roles.

---

## Important Notes

- **System roles** (`admin`, `manager`, `user`, `viewer`) are created automatically during setup and cannot be deleted.
- Only users with `users.manage_roles` permission can change role assignments.
- Only users with `permissions.manage` permission can change what permissions a role includes.
- The default admin account (`admin@awyad.org`) must have its password changed immediately after first login.
- Deletion permissions (`*.delete`) are intentionally restricted and should only be assigned to trusted roles.

---

*Last updated: June 2026*
