# Inventário de Equipamentos de TI

Aplicação para cadastro de equipamentos de TI cujos dados são lidos e gravados
**diretamente na planilha** `data/inventario_equipamentos_ti.xlsx` — ela é a
fonte única dos dados, não um espelho.

## Estrutura do projeto

```
inventario-ti/
├── data/
│   └── inventario_equipamentos_ti.xlsx   # planilha (fonte de dados real)
├── server/                               # API Node/Express
│   └── src/
│       ├── config.js                     # variáveis de ambiente
│       ├── index.js                      # entrypoint do servidor
│       ├── routes/                       # definição das rotas HTTP
│       ├── controllers/                  # validação e formatação de request/response
│       ├── services/                     # regra de negócio: leitura/escrita no .xlsx
│       └── middleware/                   # tratamento de erros
└── client/                               # SPA em React + Vite
    └── src/
        ├── api/                          # chamadas HTTP ao backend
        ├── hooks/                        # estado da tela (useEquipamentos)
        ├── components/                   # formulário, tabela, badge de status
        └── App.jsx
```

Client e servidor são pacotes npm independentes (cada um com seu próprio
`package.json`), como é comum em projetos full-stack: o front não carrega
dependências de backend e vice-versa, e cada um pode ser implantado
separadamente no futuro, se necessário.

## Como rodar

Pré-requisito: Node.js 18+.

```bash
# na raiz do projeto
npm run install:all   # instala as dependências do server e do client
npm run dev            # sobe a API (porta 3001) e o front (porta 5173) juntos
```

Acesse **http://localhost:5173**. O Vite já está configurado para
redirecionar chamadas `/api/*` para a API em `http://localhost:3001`
(veja `client/vite.config.js`), então não é preciso configurar CORS
manualmente em produção local.

Se preferir rodar cada parte separadamente:

```bash
npm run dev --prefix server   # apenas a API
npm run dev --prefix client   # apenas o front
```

## Como a sincronização com a planilha funciona

- Toda leitura (`GET /api/equipamentos`) abre o arquivo `.xlsx` e devolve as
  linhas da tabela como JSON.
- Toda escrita (`POST`, `PUT`, `DELETE`) abre o arquivo, altera a planilha em
  memória com a biblioteca [`exceljs`](https://github.com/exceljs/exceljs) e
  salva de volta no mesmo arquivo (gravação atômica via arquivo temporário +
  rename).
- As escritas são serializadas em uma fila interna (`server/src/services/spreadsheet.service.js`)
  para evitar que duas requisições simultâneas corrompam o arquivo.
- Na primeira escrita, o servidor migra automaticamente o layout "para
  preenchimento manual" da planilha original (linha de exemplo + legenda
  dentro da tabela) para um layout controlado pela API: remove a linha de
  exemplo e move a legenda para uma aba separada ("Instruções"). Isso é
  idempotente — só acontece uma vez.
- Cada novo equipamento recebe um ID numérico sequencial (coluna `ID`),
  calculado a partir do maior ID já existente na planilha.

Você pode abrir `data/inventario_equipamentos_ti.xlsx` no Excel/LibreOffice
a qualquer momento para ver os dados; **evite editá-la enquanto a API está
rodando** (recarregue a página do app depois de editar manualmente).

## Variáveis de ambiente (opcional)

Copie `server/.env.example` para `server/.env` para customizar porta,
origem do client liberada no CORS, ou o caminho do arquivo `.xlsx`:

```bash
cp server/.env.example server/.env
```

## Endpoints da API

| Método | Rota                     | Descrição                          |
|--------|---------------------------|-------------------------------------|
| GET    | `/api/equipamentos`       | Lista todos os equipamentos         |
| POST   | `/api/equipamentos`       | Cria um novo equipamento            |
| PUT    | `/api/equipamentos/:id`   | Atualiza um equipamento existente   |
| DELETE | `/api/equipamentos/:id`   | Remove um equipamento               |
| GET    | `/api/health`             | Healthcheck + caminho do arquivo    |

## Build de produção do front

```bash
npm run build   # gera client/dist, pronto para servir estaticamente
```

O `server` continua sendo executado com `npm start --prefix server`; em
produção, sirva os arquivos de `client/dist` por um servidor estático (ou
configure o Express para servi-los) e aponte-o para a mesma API.
