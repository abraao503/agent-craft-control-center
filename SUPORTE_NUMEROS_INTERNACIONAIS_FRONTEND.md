# Suporte a Números Internacionais — Guia de Alterações Frontend

## Resumo

A API foi atualizada para suportar números de telefone internacionais em todo o fluxo: validação, normalização, armazenamento e exibição. Este documento descreve as alterações que o frontend deve realizar para se adequar ao novo suporte.

---

## 1. Formato de Armazenamento (Backend)

### Antes (somente Brasil)
- Formato armazenado: `55XXYYYYYYYY` (12 dígitos, DDI 55 + DDD + número sem o 9)
- Exemplo: `5511988776655` → era normalizado para `551198877665`

### Agora (Internacional)
- Formato armazenado: **E.164 sem o `+`** (dígitos puros com DDI)
- Exemplos:
  - Brasil: `5511999887766` (DDI 55 + DDD 11 + 9 dígitos)
  - EUA: `16505551234` (DDI 1 + área 650 + número)
  - UK: `447911123456` (DDI 44 + número)
  - Portugal: `351912345678` (DDI 351 + número)
  - Argentina: `5491123456789` (DDI 54 + número)

> **IMPORTANTE**: Para números brasileiros, o 9° dígito agora é **preservado** no armazenamento (antes era removido). Isso é necessário porque o WhatsApp utiliza o número completo.

---

## 2. Alterações nos Endpoints da API

### 2.1 `POST /deal` — Criar Deal

**Antes:**
```json
{
  "customerPhone": "11999887766"
}
```
- Aceitava apenas 11 dígitos no formato brasileiro `XX9NNNNNNNN`

**Agora:**
```json
{
  "customerPhone": "11999887766"
}
// ou
{
  "customerPhone": "+5511999887766"
}
// ou
{
  "customerPhone": "+16505551234"
}
```
- Aceita qualquer número de telefone válido internacionalmente
- Números sem DDI são assumidos como brasileiros (fallback `BR`)
- Aceita com ou sem `+`
- Aceita com espaços, parênteses e hífens (são removidos no backend)

### 2.2 `POST /webhooks/deals/:token` — Trigger Deal Webhook

Mesma alteração do endpoint de criação de deal. O campo `customerPhone` agora aceita formatos internacionais.

### 2.3 Dados retornados (Customer, Deal, etc.)

O campo `phone` nos responses agora pode conter números com DDIs diferentes de `55`. Exemplos:
```json
{
  "phone": "5511999887766",
  "phone": "16505551234",
  "phone": "447911123456"
}
```

---

## 3. Alterações Necessárias no Frontend

### 3.1 📋 Input de Telefone

**Mudança obrigatória**: Substituir inputs de telefone com máscara brasileira fixa por um componente que suporte números internacionais.

#### Recomendação: usar `libphonenumber-js` ou `react-phone-number-input`

**Opção A — `react-phone-number-input`** (recomendado):
```bash
npm install react-phone-number-input
```

```tsx
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

<PhoneInput
  defaultCountry="BR"
  value={phone}
  onChange={setPhone}
  international
  countryCallingCodeEditable={false}
/>
```

**Opção B — `libphonenumber-js`** (para validação manual):
```bash
npm install libphonenumber-js
```

```tsx
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

// Validar
const isValid = isValidPhoneNumber(phoneInput, 'BR'); // fallback BR

// Normalizar antes de enviar
const parsed = parsePhoneNumber(phoneInput, 'BR');
const normalized = parsed?.format('E.164').replace('+', ''); // "5511999887766"
```

### 3.2 🎭 Máscara de Telefone

**Remover** máscaras fixas brasileiras como:
- `(XX) 9XXXX-XXXX`
- `(XX) XXXX-XXXX`

**Substituir** por:
- Input com seletor de país (bandeirinha) + formatação automática
- Ou input livre que aceita `+DDI` seguido do número

### 3.3 📱 Exibição de Telefone

**Antes**: Todos os telefones eram exibidos em formato nacional BR: `(11) 99988-7766`

**Agora**: A formatação deve considerar o país do número:
- Números BR → formato nacional: `(11) 99988-7766`
- Números internacionais → formato internacional: `+1 650 555 1234`

```tsx
import { parsePhoneNumber } from 'libphonenumber-js';

function formatPhoneForDisplay(phone: string): string {
  try {
    const parsed = parsePhoneNumber(`+${phone}`);
    if (!parsed) return phone;

    // Brasileiro: formato nacional
    if (parsed.country === 'BR') {
      return parsed.formatNational();
    }

    // Internacional: formato com DDI
    return parsed.formatInternational();
  } catch {
    return phone;
  }
}
```

### 3.4 ✅ Validação de Formulários

**Remover** validações fixas como:
```tsx
// ❌ REMOVER
const phoneRegex = /^\d{11}$/;
const isValid = phoneRegex.test(phone);
```

**Substituir** por validação via `libphonenumber-js`:
```tsx
// ✅ CORRETO
import { isValidPhoneNumber } from 'libphonenumber-js';

const isValid = isValidPhoneNumber(phone, 'BR'); // fallback BR
```

### 3.5 🔍 Filtro e Busca por Telefone

Se houver filtros de busca por telefone no frontend, garantir que aceitem:
- Números com DDI (`+5511...`, `+1650...`)
- Números sem DDI (assumir BR como padrão)
- Busca parcial (os últimos dígitos)

### 3.6 📥 Importação de Customers (XLSX)

O template de importação foi atualizado com exemplos internacionais. O frontend deve:
- Atualizar qualquer texto de ajuda/instrução que mencione formatos brasileiros
- Informar aos usuários que números internacionais são aceitos no formato `+DDI...`
- Manter que números sem `+` são assumidos como brasileiros

### 3.7 🤖 Campos de Formulário do Pipeline (Stage Form Fields)

Campos do tipo `phone` em formulários do pipeline agora aceitam números internacionais. O hint atualizado é:
```
digits with country code, e.g. +5511999999999 or +16505551234
```

---

## 4. Tabela Resumo de Mudanças

| Componente/Tela | Mudança Necessária | Prioridade |
|---|---|---|
| Input de telefone (criação de Deal) | Aceitar formato internacional, remover máscara BR fixa | 🔴 Alta |
| Input de telefone (Deal Webhook config) | Aceitar formato internacional | 🔴 Alta |
| Exibição de telefone (listagem de customers) | Formatar conforme país (BR nacional, outros internacional) | 🟡 Média |
| Exibição de telefone (detalhes do customer) | Formatar conforme país | 🟡 Média |
| Exibição de telefone (detalhes do deal) | Formatar conforme país | 🟡 Média |
| Exibição de telefone (chat/conversa) | Formatar conforme país | 🟡 Média |
| Validação de formulários (Zod/Yup/custom) | Trocar regex BR por `libphonenumber-js` | 🔴 Alta |
| Template de importação (instrução ao usuário) | Informar que aceita internacional | 🟢 Baixa |
| Campos de formulário do pipeline (type: phone) | Validação internacional | 🟡 Média |
| Disparo em massa (mass broadcast) | Exibição do telefone do destinatário | 🟢 Baixa |

---

## 5. Dependências Sugeridas

```bash
# Validação e formatação de números
npm install libphonenumber-js

# Componente de input com seletor de país (opcional, mas recomendado)
npm install react-phone-number-input
```

---

## 6. Compatibilidade com Dados Existentes

- **Números brasileiros existentes** no banco continuam funcionando normalmente
- O backend agora armazena o 9° dígito para novos números brasileiros (formato `5511999887766`)
- Números antigos sem o 9° dígito (`551198877665`) continuam válidos para busca
- A função `formatPhoneForDisplay` do backend trata ambos os formatos corretamente

---

## 7. Exemplos de Fluxo Completo

### Criar Deal com número brasileiro:
```
Input: "11999887766" → Backend normaliza para "5511999887766" → Armazenado como "5511999887766"
```

### Criar Deal com número americano:
```
Input: "+16505551234" → Backend normaliza para "16505551234" → Armazenado como "16505551234"
```

### Criar Deal via Webhook com número inglês:
```
Input: "+447911123456" → Backend normaliza para "447911123456" → Armazenado como "447911123456"
```

### Exibição:
```
"5511999887766" → "(11) 99988-7766" (nacional BR)
"16505551234"   → "+1 650 555 1234" (internacional)
"447911123456"  → "+44 7911 123456" (internacional)
```
