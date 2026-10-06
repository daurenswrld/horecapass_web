import { ApiError, BASE_URL, http, refreshTokens, tokens } from './client';

export interface CandidateMaterial {
  id: number;
  kind: 'portfolio' | 'cover_letter';
  name: string;
  content_type: string;
  size: number;
  created_at: string;
}
const BASE = '/api/web/materials/';
export const materialsApi = {
  list: () => http.get<CandidateMaterial[]>(BASE),
  upload: (kind: CandidateMaterial['kind'], file: File) => {
    const data = new FormData(); data.set('kind', kind); data.set('file', file);
    return http.post<CandidateMaterial>(BASE, data);
  },
  remove: (id: number) => http.delete<void>(`${BASE}${id}/`),
  async download(item: CandidateMaterial) {
    const send = () => fetch(`${BASE_URL}${BASE}${item.id}/`, { headers: { Authorization: `Bearer ${tokens.access ?? ''}` } });
    let response = await send();
    if (response.status === 401 && await refreshTokens()) response = await send();
    if (!response.ok) throw new ApiError(response.status, null);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = item.name;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  },
};
