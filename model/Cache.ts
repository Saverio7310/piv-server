export interface Cache {
    getItem(key: string): Promise<any | null>;
    getItems(pattern: string): Promise<string[] | null>;
    setItem(key: string, value: any, expiration?: number): Promise<void>;
    deleteItem(key: string): Promise<void>;
    clearItems(): Promise<void>;
    closeConnection(): Promise<string>;
}