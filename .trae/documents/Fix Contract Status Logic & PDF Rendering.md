I will update the teacher's contract status card to correctly reflect all states (including cancellation) and ensure the admin panel displays the correct contract PDF based on the user's role.

### **1. Update `TeacherContractStatusCard.tsx`**
I will align the status logic with the student's `ProgressStatusCard` to correctly handle **Cancelled**, **Expired**, **Active**, and **Pending** states.

**Changes:**
- Add `isCancelled` logic checking `contractStatus.cancelledAt`.
- Update `isExpired` to ensure it doesn't overlap with cancellation.
- Add a visual badge for the **"Cancelled"** status (Neutral Gray).
- Ensure the "Renew Contract" button appears for both **Cancelled** and **Expired** contracts.

### **2. Update `UserContractsTab.tsx`**
I will modify the admin contract view to render the correct PDF template based on the user's role.

**Changes:**
- Import `TeacherContractPDF`.
- In the "View Contract" modal, check `user.role`:
  - If **Teacher**: Render `TeacherContractPDF` with teacher-specific data (CNPJ mapped from CPF field, etc.).
  - If **Student**: Render `ContratoPDF` (existing behavior).

**Verification:**
- **Teacher Dashboard:** Verify the status card shows "Cancelled" when appropriate and allows renewal.
- **Admin Panel:** Verify that opening a teacher's contract shows the "Service Provider/MEI" contract, while a student's contract shows the "Educational Services" contract.