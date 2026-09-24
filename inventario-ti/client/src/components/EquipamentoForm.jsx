import { useEffect, useState } from 'react';

const EMPTY = {
  categoria: 'Notebook',
  equipamento: '',
  modelo: '',
  serie: '',
  dataInclusao: '',
  dataExclusao: '',
  status: 'Ativo',
  localizacao: '',
  responsavel: '',
  observacoes: '',
};

const CATEGORIAS = [
  'Notebook',
  'Desktop',
  'Monitor',
  'Servidor',
  'Impressora',
  'No-break',
  'Switch/Roteador',
  'Periférico',
  'Celular/Tablet',
  'Outro',
];

const STATUSES = ['Ativo', 'Em manutenção', 'Emprestado', 'Baixado/Excluído', 'Extraviado'];

export default function EquipamentoForm({ editingItem, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editingItem ? { ...EMPTY, ...editingItem } : EMPTY);
    setMessage(null);
  }, [editingItem]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.equipamento.trim() || !form.modelo.trim() || !form.dataInclusao) {
      setMessage({ type: 'erro', text: 'Preencha equipamento, modelo e data de inclusão.' });
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
      setMessage({ type: 'ok', text: 'Salvo na planilha.' });
      if (!editingItem) setForm(EMPTY);
    } catch (err) {
      setMessage({ type: 'erro', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2>{editingItem ? 'EDITAR EQUIPAMENTO' : 'NOVO EQUIPAMENTO'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Categoria
          <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Equipamento
          <input
            value={form.equipamento}
            onChange={(e) => set('equipamento', e.target.value)}
            placeholder="Ex.: Notebook Dell Latitude 5440"
            required
          />
        </label>

        <label>
          Modelo
          <input
            value={form.modelo}
            onChange={(e) => set('modelo', e.target.value)}
            placeholder="Ex.: BR-LAT5440-0001"
            required
          />
        </label>

        <label>
          Número de série (se possuir)
          <input
            value={form.serie}
            onChange={(e) => set('serie', e.target.value)}
            placeholder="Deixe em branco se não houver"
          />
        </label>

        <div className="row2">
          <label>
            Data de inclusão
            <input
              type="date"
              value={form.dataInclusao}
              onChange={(e) => set('dataInclusao', e.target.value)}
              required
            />
          </label>
          <label>
            Data de exclusão
            <input
              type="date"
              value={form.dataExclusao}
              onChange={(e) => set('dataExclusao', e.target.value)}
            />
          </label>
        </div>

        <label>
          Status
          <select value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <div className="row2">
          <label>
            Localização
            <input
              value={form.localizacao}
              onChange={(e) => set('localizacao', e.target.value)}
              placeholder="Ex.: TI - Matriz"
            />
          </label>
          <label>
            Responsável
            <input
              value={form.responsavel}
              onChange={(e) => set('responsavel', e.target.value)}
              placeholder="Ex.: João Silva"
            />
          </label>
        </div>

        <label>
          Observações
          <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} />
        </label>

        {message && <p className={`form-msg form-msg--${message.type}`}>{message.text}</p>}

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : editingItem ? 'Salvar alterações' : 'Adicionar'}
          </button>
          {editingItem && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
