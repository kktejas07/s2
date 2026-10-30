# IQEApp Project Workflow Overview

## 1. Project Type
This project is a legacy ASP.NET MVC 5 web application for an internal business/operations platform.

## 2. Application Entry Flow
1. The application starts through Global.asax and Startup.
2. MVC routing and filters are registered.
3. The default route points to the login flow.

## 3. Authentication Flow
1. User opens the app.
2. LoginController validates credentials.
3. A forms-authentication cookie is created.
4. The user is redirected to the dashboard/module home.

## 4. Admin / Dashboard Flow
1. AdminController checks user permission.
2. The admin service fetches summary counts.
3. The dashboard view is rendered.

## 5. Service Order Flow
1. User opens the Service Order module.
2. The controller loads client, PO, and control-number data.
3. The user creates a service order.
4. The data is validated and saved through the service layer.
5. Any uploaded files are stored.
6. The result is returned to the UI.

## 6. Visit Processing Flow
1. User opens the visit schedule or processing page.
2. The system loads visit records and filters.
3. The service layer fetches visit and status data.
4. The UI displays scheduled visits and related details.

## 7. Invoice Flow
1. User opens the invoice module.
2. The system loads invoice list/default values.
3. The user selects visits and charges.
4. Invoice data is saved and consolidated.
5. The invoice summary is shown.

## 8. Report Flow
1. User selects a report type and filters.
2. The report service retrieves data.
3. The report is rendered to HTML and converted to PDF.
4. The PDF is returned to the user.

## 9. File Upload Flow
1. User uploads a document or image.
2. The file is received by the upload controller.
3. The file is stored to the configured path.
4. The file metadata is returned and attached to the relevant record.

## 10. End-to-End Lifecycle
User -> Login -> Dashboard -> Service Order -> Visit Processing -> Invoice -> Reporting
