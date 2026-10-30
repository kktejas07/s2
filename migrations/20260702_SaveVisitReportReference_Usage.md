What to run after applying migrations:

1) Run migrations SQL scripts in order:
   - 20260702_Create_VisitReportReferences_Table.sql
   - 20260702_Create_SaveVisitReportReference_Proc.sql
   - 20260702_Add_CreateInCurrentFy_Param_To_UpdateLatestSONumber.sql

2) Verify stored procedures deployed. Adjust UpdateLatestSONumber logic per real DB schema; the script contains pseudo-code.

3) After DB deploy, ensure IIS app pool restarted and app has DB permissions.

Notes:
- I added VisitReportReferences table and SaveVisitReportReference proc to record mapping between visits, report numbers and control numbers.
- I added CreateInCurrentFy handling to UpdateLatestSONumber; ensure dbo.ServiceOrders and dbo.ControlNumbers exist and field names match.
- Code changes added: ViewModel/Domain flag CreateInCurrentFy and ControlNumberService passes flag to SP via Dapper parameter.

Limitations:
- The DB stored procedure patch is template/pseudocode — please adapt to your real DB design and business rules before running on production.
