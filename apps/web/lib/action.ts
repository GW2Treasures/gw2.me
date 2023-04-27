type ServerAction<T> = ((data: FormData) => Promise<unknown>) & { $$id: string };

export function action<T>(callback: (data: FormData) => Promise<T>): ServerAction<T> {
  return callback as any;
}
