export interface PendingEvent<Result, Data = unknown> {
    pending?: Promise<Result>;
    data?: Data,
}