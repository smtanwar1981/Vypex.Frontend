import { BehaviorSubject, Observable, Subject } from "rxjs";
import { IEmployeeLeave } from "../../models/employee-leave";
import { Injectable } from "@angular/core";
import { IEmployee } from "../../models/employee";

@Injectable({ providedIn: 'root' })
export class AppStateService {
    public editCache$ = new BehaviorSubject<{ [key: string]: { edit: boolean; data: IEmployeeLeave } }>({});
    public disableButtonIds$ = new BehaviorSubject<string[]>([]);
    public expandChange$ = new BehaviorSubject<{ employeeId: string, checked: boolean }>({ employeeId: '', checked: false });


    public employeesWithLeaves$: BehaviorSubject<IEmployee[]> = new BehaviorSubject<IEmployee[]>([]);

    public setEmployeesWithLeaves(employeesWithLeaves: IEmployee[]) {
        this.employeesWithLeaves$.next(employeesWithLeaves);
    }

    public getEmployeesWithLeavesSub(): Observable<IEmployee[]> {
        return this.employeesWithLeaves$.asObservable();
    }

    public setExpandChange(employeeId: string, checked: boolean) {
        this.expandChange$.next({ employeeId, checked });
    }

    public getExpandChangeSub(): Observable<{ employeeId: string, checked: boolean }> {
        return this.expandChange$.asObservable();
    }

    public setEditCache(item: { [key: string]: { edit: boolean; data: IEmployeeLeave } }) {
        this.editCache$.next(item);
    }

    public getEditCache() {
        return this.editCache$.asObservable();
    }

    public editRow(leaveId: string) {
        let editCache = this.editCache$.getValue();
        editCache[leaveId].edit = true;
        this.setEditCache(editCache);
    }

    public cancelEditRow(leaveId: string) {
        let editCache = this.editCache$.getValue();
        editCache[leaveId].edit = false;
        this.setEditCache(editCache);
    }

    public setDisableButtonIds(employeeId: string) {
        let ids = this.disableButtonIds$.getValue();
        if (!ids.includes(employeeId)) {
            this.disableButtonIds$.next([...ids, employeeId])
        }
    }

    public resetDisableButtonsIds(employeeId: string) {
        let ids = this.disableButtonIds$.getValue();
        let filterIds = ids.filter(x => x != employeeId);
        this.disableButtonIds$.next(filterIds);
    }

    public getDisableButtonIdsSub(): Observable<string[]> {
        return this.disableButtonIds$.asObservable();
    }

    public adjustEmployeeLeavesOnDelete(leaveId: string, employeeId: string): void {
        const updatedEmployeesWithLeaves = this.employeesWithLeaves$.value.map(employee => {
            if (employee.employeeId == employeeId) {
                const updatedLeaves = employee.employeeLeaves.filter(leave => leave.leaveId != leaveId);
                return {
                    ...employee,
                    employeeLeaves: updatedLeaves,
                    leavesCount: updatedLeaves.length,
                    numberOfDays: this.calculateNumberOfDays(updatedLeaves),
                };
            }
            return employee;
        });
        if (updatedEmployeesWithLeaves) {
            this.setEmployeesWithLeaves(updatedEmployeesWithLeaves);
        }
    }

    private calculateNumberOfDays(leaves: IEmployeeLeave[]): number {
        return leaves.reduce((acc, leave) => {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return acc + diffInDays;
        }, 0);
    }
}