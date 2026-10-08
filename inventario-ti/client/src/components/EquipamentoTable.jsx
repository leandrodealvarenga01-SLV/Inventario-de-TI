import StatusBadge from './StatusBadge.jsx';

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function EquipamentoTable({ items, onEdit, onDelete }) {
  if (!items.length) {
    return (
      <div className="empty">
        Nenhum equipamento cadastrado ainda. Use o formulário para adicionar o primeiro — os
        dados são gravados diretamente na planilha.
      </div>
    );
  }

  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Modelo</th>
            <th>Categoria</th>
            <th>Nº de Série</th>
            <th>Inclusão</th>
            <th>Exclusão</th>
            <th>Status</th>
            <th>Local</th>
            <th>Responsável</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>
                <strong>{it.equipamento}</strong>
              </td>
              <td>{it.modelo || <span className="muted">—</span>}</td>
              <td>{it.categoria || <span className="muted">—</span>}</td>
              <td>{it.serie || <span className="muted">—</span>}</td>
              <td>{fmtDate(it.dataInclusao)}</td>
              <td>{fmtDate(it.dataExclusao)}</td>
              <td>
                <StatusBadge status={it.status} />
              </td>
              <td>{it.localizacao || <span className="muted">—</span>}</td>
              <td>{it.responsavel || <span className="muted">—</span>}</td>
              <td>
                <div className="rowbtns">
                  <button className="btn-ghost" onClick={() => onEdit(it)}>
                    Editar
                  </button>
                  <button className="btn-ghost" onClick={() => onDelete(it)}>
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
