from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.payroll.models import PayrollRun, Payslip


class PayrollService:

    @staticmethod
    async def list_runs(
        site_id: str, period_month: Optional[int] = None,
        period_year: Optional[int] = None, status: Optional[str] = None,
        page: int = 1, per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if period_month:
            query["period_month"] = period_month
        if period_year:
            query["period_year"] = period_year
        if status:
            query["status"] = status
        total = await PayrollRun.find(query).count()
        items = (
            await PayrollRun.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-PayrollRun.created_at).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def create_run(data: dict, site_id: str, user_id: str):
        run = PayrollRun(**data, site_id=site_id, created_by=user_id)
        await run.insert()
        await audit(AuditAction.CREATE, "payroll_runs", run.run_id, user_id, site_id)
        return run

    @staticmethod
    async def get_run(run_id: str, site_id: str):
        run = await PayrollRun.find_one({"run_id": run_id, "site_id": site_id})
        if not run:
            raise HTTPException(404, "Payroll run not found")
        slips = await Payslip.find({"run_id": run_id, "site_id": site_id}).to_list()
        return {"run": run, "payslips": slips}

    @staticmethod
    async def process_run(run_id: str, site_id: str, user_id: str):
        run = await PayrollRun.find_one({"run_id": run_id, "site_id": site_id})
        if not run:
            raise HTTPException(404, "Payroll run not found")
        if run.status != "draft":
            raise HTTPException(400, f"Cannot process a {run.status} run")

        from modules.people.models import Person, EmploymentStatus
        people = await Person.find({"site_id": site_id, "employment_status": {"$in": ["active", "deployed", "on_bench"]}}).to_list()

        from modules.leave_attendance.models import AttendanceRecord
        from_dt = datetime(run.period_year, run.period_month, 1)
        to_month = run.period_month + 1 if run.period_month < 12 else 1
        to_year = run.period_year if run.period_month < 12 else run.period_year + 1
        to_dt = datetime(to_year, to_month, 1)

        import calendar
        days_in_month = calendar.monthrange(run.period_year, run.period_month)[1]

        total_gross = 0.0
        total_deductions = 0.0
        total_net = 0.0
        count = 0

        for person in people:
            attendance = await AttendanceRecord.find({
                "person_id": person.person_id, "site_id": site_id,
                "date": {"$gte": from_dt, "$lt": to_dt},
            }).to_list()

            days_present = sum(1 for a in attendance if a.status == "present")
            days_half = sum(1 for a in attendance if a.status == "half_day")
            days_leave = sum(1 for a in attendance if a.status == "on_leave")
            effective_days = days_present + (days_half * 0.5)
            days_absent = days_in_month - effective_days - days_leave
            if days_absent < 0:
                days_absent = 0
            loss_of_pay = max(0, days_absent)

            basic = 25000.0
            hra = basic * 0.4
            conveyance = 1600.0
            special = 5000.0
            gross = basic + hra + conveyance + special
            pro_rated = gross * (effective_days / days_in_month) if days_in_month else gross

            pf_ee = min(pro_rated * 0.12, 1800.0)
            pf_er = pf_ee
            esi_ee = pro_rated * 0.0075 if pro_rated <= 21000 else 0
            esi_er = pro_rated * 0.0325 if pro_rated <= 21000 else 0
            pt = 200.0 if pro_rated > 15000 else 0
            tds_rate = 0.1
            tds = pro_rated * tds_rate

            deductions = pf_ee + esi_ee + pt + tds
            net = pro_rated - deductions

            slip = Payslip(
                payslip_id=f"PS-{run.period_year}-{run.period_month:02d}-{count + 1:04d}",
                run_id=run_id, person_id=person.person_id, site_id=site_id,
                period_month=run.period_month, period_year=run.period_year,
                basic_salary=round(basic, 2), hra=round(hra, 2),
                conveyance=conveyance, special_allowance=special,
                gross_salary=round(pro_rated, 2),
                pf_employee=round(pf_ee, 2), pf_employer=round(pf_er, 2),
                esi_employee=round(esi_ee, 2), esi_employer=round(esi_er, 2),
                professional_tax=pt, tds=round(tds, 2),
                total_deductions=round(deductions, 2), net_salary=round(net, 2),
                days_present=effective_days, days_absent=days_absent,
                leaves_taken=days_leave, loss_of_pay_days=loss_of_pay,
            )
            await slip.insert()
            total_gross += pro_rated
            total_deductions += deductions
            total_net += net
            count += 1

        run.status = "processing"
        run.headcount = count
        run.total_gross = round(total_gross, 2)
        run.total_deductions = round(total_deductions, 2)
        run.total_net = round(total_net, 2)
        run.processed_by = user_id
        run.processed_on = datetime.now()
        run.updated_at = datetime.now()
        await run.save()
        await audit(AuditAction.UPDATE, "payroll_runs", run_id, user_id, site_id, {"status": "processing", "headcount": count})
        return {"run": run, "payslips_generated": count}

    @staticmethod
    async def approve_run(run_id: str, site_id: str, user_id: str):
        run = await PayrollRun.find_one({"run_id": run_id, "site_id": site_id})
        if not run:
            raise HTTPException(404, "Payroll run not found")
        if run.status != "processing":
            raise HTTPException(400, f"Cannot approve a {run.status} run")
        run.status = "approved"
        run.approved_by = user_id
        run.approved_on = datetime.now()
        run.updated_at = datetime.now()
        await run.save()
        await audit(AuditAction.UPDATE, "payroll_runs", run_id, user_id, site_id, {"status": "approved"})
        return run

    @staticmethod
    async def disburse_run(run_id: str, site_id: str, user_id: str):
        run = await PayrollRun.find_one({"run_id": run_id, "site_id": site_id})
        if not run:
            raise HTTPException(404, "Payroll run not found")
        if run.status != "approved":
            raise HTTPException(400, f"Cannot disburse a {run.status} run")
        run.status = "disbursed"
        run.disbursed_on = datetime.now()
        run.updated_at = datetime.now()
        await run.save()
        await audit(AuditAction.UPDATE, "payroll_runs", run_id, user_id, site_id, {"status": "disbursed"})
        return run

    @staticmethod
    async def list_payslips(
        site_id: str, person_id: Optional[str] = None,
        period_month: Optional[int] = None, period_year: Optional[int] = None,
        page: int = 1, per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if person_id:
            query["person_id"] = person_id
        if period_month:
            query["period_month"] = period_month
        if period_year:
            query["period_year"] = period_year
        total = await Payslip.find(query).count()
        items = (
            await Payslip.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-Payslip.created_at).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def get_payslip(payslip_id: str, site_id: str):
        slip = await Payslip.find_one({"payslip_id": payslip_id, "site_id": site_id})
        if not slip:
            raise HTTPException(404, "Payslip not found")
        return slip
