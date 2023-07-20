export interface PendingEvent<T> {
    pending?: Promise<T>;
}