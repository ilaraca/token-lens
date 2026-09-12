# TokenLens

Sistema de inteligência verificável que audita sustentabilidade, tokenomics e governança de ativos cripto, separando extração forense de texto de validação matemática determinística.

## Language

### Audit core

**Audit Pair**:
A combinação imutável, em um instante, de Token (On-Chain Id + Market Alias informados pelo usuário), Document legível e Market Snapshot; se qualquer perna faltar, não há Audit Pair.
_Avoid_: Report parcial sem mercado; resolver Alias/On-Chain por mágica; audit sem as três fontes

**Audit Report**:
Artefato do Pair: Claims com Evidence, Caveats informativos e Findings — sem score, sem limiar de “saúde”, sem resumo narrativo no v1.
_Avoid_: Rating, narrativeSummary, SAUDAVEL/ALERTA por limiar arbitrário

**Auditor**:
O pipeline completo do produto (extração + contratos + motor determinístico) que produz o Audit Report.
_Avoid_: Chamar o LLM de Auditor

**Extractor**:
O papel exclusivo do LLM: ler texto hostil e devolver Claims com Evidence; nunca calcula e nunca resume para o motor.
_Avoid_: Analisador, Analysis, Analise*, juiz, “auditor forense” como nome do LLM

### Identity & sources

**Token**:
Ativo sob auditoria. No v1 o usuário declara On-Chain Id e Market Alias juntos, com mapeamento explícito (sem lookup automático).
_Avoid_: Asset, coin, símbolo sozinho; inferência de um id a partir do outro

**On-Chain Id**:
Identidade estável `chainId` + `contractAddress` (EVM-first no v1).
_Avoid_: Ticker, nome do projeto

**Market Alias**:
Identificador no provedor de mercado (ex.: CoinGecko id) usado só para obter o Market Snapshot.
_Avoid_: Alias como única chave do domínio

**Document**:
Texto-fonte versionado: conteúdo normalizado persistido + content hash; URL opcional. Ingestão falha abaixo do limiar de legibilidade (mínimo de caracteres alfanuméricos — configurável, default 500); nesse caso não há Pair nem Extractor.
_Avoid_: Fetch efêmero sem cópia; rodar LLM em PDF vazio/OCR lixo; tratar o limiar como dogma de domínio imutável

**Citation Normalization**:
Antes do substring check: colapsar whitespace e NFC unicode; case-sensitive; sem strip de pontuação e sem match fuzzy.
_Avoid_: Lower-case, Levenshtein, comparar no PDF binário

**Market Snapshot**:
Leituras no instante do Pair em **human token units** (mesma unidade do Claim de oferta), via porta de mercado — default CoinGecko; adapter in-memory/DB depois, sem mudar o domínio.
_Avoid_: Unidades atômicas sem decimals no v1; live price sem carimbo

### Claims & proof (v1)

**Claim**:
Afirmação atômica com no máximo uma Evidence. No v1 o único Claim de tokenomics é `maxSupplyAmount` (número em human units). Ausência ⇒ Missing Max Supply. Número só por extenso no Document, sem dígitos ⇒ Absent (proibido inferir).
_Avoid_: hasMaxSupply separado; team allocation; governança textual; narrativeSummary; converter “one billion” sem dígitos

**Evidence**:
`found`, citação literal e Caveats; citação deve ser substring do Document após Citation Normalization.
_Avoid_: Evidence de bloco; confiar no LLM sem verify

**Found Claim**:
`found: true` ⇒ valor presente + citação não vazia verificada.
_Avoid_: found true com valor null

**Absent Claim**:
`found: false` ⇒ valor `null` + citação `null`.
_Avoid_: Meio-termo “mencionado sem número” no mesmo Claim

**Caveat**:
Letra miúda literal com substring verificável; no v1 só informativa no Report — não altera o motor.
_Avoid_: NLP de caveat para bloquear diluição

### Findings

**Finding**:
Saída do Deterministic Engine a partir de Claims verificados e Market Snapshot.
_Avoid_: Conclusão do LLM; score

**Pending Dilution**:
`(maxSupplyAmount - circulating) / maxSupplyAmount` quando há Found `maxSupplyAmount` e Snapshot válido — só percentual, sem label de severidade.
_Avoid_: Limiar 20%; clamp se circulating > max

**Source Conflict**:
Document vs Snapshot incoerentes (ex.: circulating > maxSupplyAmount) ou maxSupplyAmount ≤ 0.
_Avoid_: Suavizar o conflito

**Missing Max Supply**:
`maxSupplyAmount` Absent no Document.
_Avoid_: Inferir teto pela API

**Deterministic Engine**:
Emite Findings só de Claims verificados + Market Snapshot.
_Avoid_: Cálculo no LLM

### Persistence (domain intent)

**Audit Record**:
O que o domínio exige poder reproduzir: Document (texto+hash), inputs do Pair, Claims verificados, Findings. Implementação v1 pode ser in-memory atrás de porta de repositório.
_Avoid_: Guardar Findings e apagar o texto do Document; persistência como desculpa para mudar o glossário
