export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "same-origin",
  });
  const body = await response.json().catch(()=>({error:'L’API est indisponible. Vérifiez que le serveur a démarré.'}));
  if (!response.ok) throw new Error(body.error || "Une erreur est survenue.");
  return body as T;
}
export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  active: boolean;
};
export type Me = {
  user: { name: string; email: string };
  institute: { name: string; slug: string };
  role: string;
};
