export function getFormDataString(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);

  if(value === null || typeof value !== 'string') {
    return undefined;
  }

  return value.trim();
}
