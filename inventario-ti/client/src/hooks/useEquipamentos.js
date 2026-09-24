import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/equipamentosApi';

export function useEquipamentos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listEquipamentos();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (data) => {
    const created = await api.createEquipamento(data);
    setItems((prev) => [created, ...prev]);
  }, []);

  const update = useCallback(async (id, data) => {
    const updated = await api.updateEquipamento(id, data);
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }, []);

  const remove = useCallback(async (id) => {
    await api.deleteEquipamento(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, loading, error, refresh, create, update, remove };
}
