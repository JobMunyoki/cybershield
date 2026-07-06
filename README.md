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

## Environment Variables

CyberShield uses environment variables to keep sensitive configuration out of the source code.

### Backend `.env.example`

```env
DJANGO_SECRET_KEY=generate-a-new-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

DB_NAME=cybershield_db
DB_USER=root
DB_PASSWORD=your-database-password
DB_HOST=localhost
DB_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

### Frontend `.env.example`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### Production Environment

In production, the backend uses Railway environment variables and the frontend uses Vercel environment variables.

Production frontend API variable:

```env
VITE_API_BASE_URL=https://cybershield-production-42cd.up.railway.app/api
```

Real `.env` files are excluded from Git and should never be committed.

## Testing Summary

CyberShield includes automated backend and frontend tests.

### Backend Tests

Backend tests cover:

- Model behavior
- API authentication
- Pagination
- Sorting
- Role-based permissions
- Incident reporting
- Audit-log creation
- Incident timeline creation
- Critical alert acknowledgement and dismissal

Backend test result:

```text
23 tests passed
```

Run backend tests:

```bash
cd backend
python manage.py test core.tests -v 2
```

### Frontend Tests

Frontend tests cover:

- Login form rendering
- Failed login handling
- Successful login token storage
- Protected route loading state
- Unauthenticated redirects
- Role-based route access
- AuthContext user loading and logout

Frontend test result:

```text
12 tests passed
```

Run frontend tests:

```bash
cd frontend
npm run test:run
```

## Production Deployment

### Backend

The backend is deployed on Railway using:

- Django
- Django REST Framework
- Gunicorn
- Railway MySQL
- WhiteNoise for static files
- Environment variables for production configuration

Production backend:

```text
https://cybershield-production-42cd.up.railway.app
```

Backend admin:

```text
https://cybershield-production-42cd.up.railway.app/admin/
```

### Frontend

The frontend is deployed on Vercel using:

- React
- Vite
- Material UI
- Axios
- Environment variables for the backend API URL

Production frontend:

```text
https://cybershield-three-pi.vercel.app
```

## Security Notes

Sensitive values are stored in environment variables and excluded from Git.

The following files should not be committed:

```text
backend/.env
frontend/.env
```

Safe example files are included:

```text
backend/.env.example
frontend/.env.example
```

Production security improvements include:

- Django `SECRET_KEY` stored outside source code
- Database credentials stored outside source code
- `DEBUG=False` in production
- Railway-hosted MySQL database
- CORS restricted to the Vercel frontend URL
- CSRF trusted origins configured for production
- Secure cookie settings enabled when `DEBUG=False`
- Gunicorn used as the production server
- WhiteNoise used for static files

## Live Links

Frontend:

```text
https://cybershield-three-pi.vercel.app
```

Backend Admin:

```text
https://cybershield-production-42cd.up.railway.app/admin/
```

GitHub Repository:

```text
https://github.com/JobMunyoki/cybershield
```

## Author

Job Munyoki

GitHub:

```text
https://github.com/JobMunyoki
```
