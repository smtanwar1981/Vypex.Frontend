import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { IEmployeeLeave } from "../../../models/employee-leave";
import { CommonModule } from '@angular/common';
import { IEmployee } from "../../../models/employee";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzDatePickerModule } from "ng-zorro-antd/date-picker";
import { FormsModule } from "@angular/forms";

@Component({
    selector: 'app-leave',
    imports: [
        NzTableModule, NzButtonModule, NzPopconfirmModule, NzDatePickerModule, FormsModule, CommonModule
    ],
    templateUrl: './leave.component.html',
    styleUrl: './leave.component.scss'
})
export class LeaveComponent {
    @Input() employee!: IEmployee;
    @Input() editCache: { [key: string]: { edit: boolean; data: IEmployeeLeave } } = {};
    @Input() size: 'large' | 'default' | 'small' = 'default';

    @Output() startEdit = new EventEmitter<string>();
    @Output() deleteLeave = new EventEmitter<{ leaveId: string; employeeId: string }>();
    @Output() cancelEdit = new EventEmitter<{ leaveId: string; employeeId: string }>();
    @Output() saveEdit = new EventEmitter<{ leaveId: string; employeeId: string }>();
    @Output() dateChange = new EventEmitter<{ leaveId: string, dateRange: [Date | null, Date | null] }>();

    isDateRangeValid(leaveId: string): boolean {
        const dateRange = this.editCache[leaveId]?.data.dateRange;
        return dateRange && dateRange[0] instanceof Date && dateRange[1] instanceof Date;
    }

    trackByLeaveId(index: number, leave: IEmployeeLeave): string {
        return leave.leaveId;
    }
}