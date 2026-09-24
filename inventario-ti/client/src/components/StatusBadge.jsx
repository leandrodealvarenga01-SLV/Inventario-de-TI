const CLASS_BY_STATUS = {
  Ativo: 'status status--ativo',
  'Baixado/Excluído': 'status status--baixado',
};

export default function StatusBadge({ status }) {
  const className = CLASS_BY_STATUS[status] || 'status status--outro';
  return <span className={className}>{status}</span>;
}
