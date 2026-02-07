export function activeTasksTag(userId: string): string {
    return `tasks:active:${userId}`;
}

export function pendingVoucherRequestsTag(voucherId: string): string {
    return `voucher:pending:${voucherId}`;
}
