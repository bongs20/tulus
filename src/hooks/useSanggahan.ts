import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSanggahan(status?: string) {
  const url = `/api/sanggahan${status ? `?status=${status}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}
