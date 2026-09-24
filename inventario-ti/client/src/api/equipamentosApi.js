const BASE_URL = '/api/equipamentos';

async function handle(response) {
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Erro na requisição (${response.status})`);
  }
  return body;
}

export function listEquipamentos() {
  return fetch(BASE_URL).then(handle);
}

export function createEquipamento(data) {
  return fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handle);
}

export function updateEquipamento(id, data) {
  return fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handle);
}

export function deleteEquipamento(id) {
  return fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then(handle);
}
