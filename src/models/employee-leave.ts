export interface IEmployeeLeave {
    leaveId: string,
    employeeId: string,
    startDate: string,
    endDate: string,
    createdOn: string,
    updatedOn: string,
    updatedBy: string,
    dateRange: [Date, Date]
}
