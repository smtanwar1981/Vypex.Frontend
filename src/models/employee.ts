import { IEmployeeLeave } from './employee-leave';


export interface IEmployee {
    employeeId: string,
    employeeName: string,
    employeeLeaves: IEmployeeLeave[],
    numberOfDays: number,
    leavesCount: number
}
