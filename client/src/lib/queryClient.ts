import { QueryClient } from "@tanstack/react-query";

async function throwResponseError(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const body = await res.json();
    throw new Error(body.message || `Request failed with status ${res.status}`);
  } else {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
}

async function handleRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  const res = await fetch(url, options);

  if (!res.ok) {
    await throwResponseError(res);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await res.json();
  }

  return await res.text();
}

export async function apiRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  return handleRequest(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return handleRequest(url);
      },
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
