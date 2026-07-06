# CyberShield

CyberShield is a cybersecurity incident and vulnerability management system built with Django REST Framework, React, Material UI, MySQL, Railway, and Vercel.

The system helps security teams track assets, report incidents, manage vulnerabilities, monitor critical alerts, record investigation timelines, and maintain audit logs.

## Live Demo

Frontend:

https://cybershield-three-pi.vercel.app

Backend Admin:

https://cybershield-production-42cd.up.railway.app/admin/

GitHub Repository:

https://github.com/JobMunyoki/cybershield

## Main Features

### Authentication and Role-Based Access

CyberShield supports authenticated access with role-based permissions.

Supported roles include:

- Admin
- Security Analyst
- Staff

Admins have full access to assets, incidents, vulnerabilities, audit logs, and critical alert management. Security Analysts can manage security operations, while Staff users can report and view their own incidents.

### Asset Management

Users can register and manage organizational assets such as routers, laptops, desktops, servers, and other IT resources.

Asset records include:

- Asset name
- Asset type
- IP address
- Owner department
- Risk level
- Status

### Incident Management

Users can report and manage cybersecurity incidents.

Incident records include:

- Title
- Description
- Category
- Severity
- Status
- Affected asset
- Assigned user
- Reporter

The system supports status tracking, assignment, filtering, pagination, sorting, and audit logging.

### Incident Response Timeline

Each incident has a response timeline for recording investigation updates.

Timeline entries can include:

- Notes
- Evidence
- Actions taken
- Status changes
- Assignment changes

This helps preserve a clear history of how an incident was handled.

### Vulnerability Management

CyberShield allows security teams to register, track, and manage vulnerabilities affecting organizational assets.

Vulnerability records include:

- Title
- Description
- Affected asset
- Risk level
- CVSS score
- Status
- Recommendation

### Critical Security Alerts

The dashboard highlights active critical incidents and vulnerabilities.

Critical alerts can be:

- Viewed
- Acknowledged
- Dismissed

Acknowledgement and dismissal actions are stored persistently and recorded in the audit logs.

### Dashboard and Analytics

The dashboard provides a security overview showing:

- Total assets
- Total incidents
- Open incidents
- Resolved incidents
- Total vulnerabilities
- Open vulnerabilities
- Incident charts
- Vulnerability charts
- Critical security alerts

### PDF Reporting

The dashboard supports downloading a PDF security report containing key security metrics and analytics.

### Audit Logs

CyberShield records important user actions such as:

- Asset creation and updates
- Incident reporting
- Incident updates
- Vulnerability creation and updates
- Timeline updates
- Critical alert acknowledgement
- Critical alert dismissal

Audit logs support pagination and sorting.

### CSV Export

The system supports CSV export for selected records such as assets, incidents, vulnerabilities, and audit logs.

## Tech Stack

### Backend

- Python
- Django
- Django REST Framework
- Simple JWT Authentication
- MySQL
- Gunicorn
- WhiteNoise
- python-dotenv

### Frontend

- React
- Vite
- Material UI
- Axios
- Recharts
- jsPDF
- Vitest
- React Testing Library

### Deployment

- Railway for Django backend
- Railway MySQL for production database
- Vercel for React frontend

## Project Structure

```text
cybershield/
├── backend/
│   ├── config/
│   ├── core/
│   ├── requirements.txt
│   ├── Procfile
│   ├── .env.example
│   └── manage.py
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
└── README.md
```
