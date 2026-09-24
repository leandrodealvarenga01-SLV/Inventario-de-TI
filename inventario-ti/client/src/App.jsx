import { useState } from 'react';
import { useEquipamentos } from './hooks/useEquipamentos.js';
import EquipamentoForm from './components/EquipamentoForm.jsx';
import EquipamentoTable from './components/EquipamentoTable.jsx';

export default function App() {
  const { items, loading, error, create, update, remove } = useEquipamentos();
  const [editingItem, setEditingItem] = useState(null);

  async function handleSubmit(data) {
    if (editingItem) {
      await update(editingItem.id, data);
      setEditingItem(null);
    } else {
      await create(data);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Excluir "${item.equipamento}" da planilha?`)) return;
    await remove(item.id);
    if (editingItem?.id === item.id) setEditingItem(null);
  }

  return (
    <>
      <header>
        <h1>Inventário de Equipamentos de TI</h1>
        <span className="muted">
          {loading ? 'Carregando planilha…' : `${items.length} equipamento(s) cadastrado(s)`}
        </span>
      </header>

      <main>
        <EquipamentoForm
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => setEditingItem(null)}
        />

        <section>
          {error && <p className="form-msg form-msg--erro">{error}</p>}
          <EquipamentoTable items={items} onEdit={setEditingItem} onDelete={handleDelete} />
        </section>
      </main>
    </>
  );
}
