class MasterDataService:
    @staticmethod
    async def get_visit_statuses():
        return {"data": [
            {"id": 1, "name": "Scheduled"}, {"id": 2, "name": "Initiated"},
            {"id": 3, "name": "Completed"}, {"id": 4, "name": "QC Completed"},
            {"id": 5, "name": "Finance Completed"}, {"id": 6, "name": "Invoice Initiated"},
            {"id": 7, "name": "Invoice Completed"}, {"id": 8, "name": "Invoice Cancelled"},
            {"id": 9, "name": "Payment Initiated"},
        ]}

    @staticmethod
    async def get_job_types():
        return {"data": ["inspection", "calibration", "audit", "training", "testing"]}

    @staticmethod
    async def get_user_roles():
        return {"data": [
            {"id": 1, "name": "Super Admin"}, {"id": 2, "name": "Admin"},
            {"id": 3, "name": "Employee"}, {"id": 4, "name": "Coordinator"},
            {"id": 5, "name": "Quality Check"}, {"id": 6, "name": "Finance"},
        ]}

    @staticmethod
    async def get_invoice_types():
        return {"data": ["customer", "supplier"]}

    @staticmethod
    async def get_complaint_modes():
        return {"data": ["Email", "Phone", "In-Person", "Portal", "Letter"]}

    @staticmethod
    async def get_expense_types():
        return {"data": ["travel", "food", "hotel", "mileage", "other"]}

    @staticmethod
    async def get_photo_categories():
        return {"data": ["visual", "defect", "measurement", "environment", "label"]}

    @staticmethod
    async def get_finding_severities():
        return {"data": ["critical", "major", "minor", "observation"]}
