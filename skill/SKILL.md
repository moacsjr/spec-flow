---
name: spec-flow
description: "Use when the user wants to set up a spec-driven GitHub workflow, create a Feature issue, generate plan.md or spec.md, decompose a Feature into Stories/Tasks, or write RFC documentation. Implements the RFC-001 workflow with GitHub Projects v2, labels, and AI-powered GitHub Actions."
argument-hint: "[setup|feature|plan|spec|ready|decompose|rfc] [target]"
user-invocable: true
allowed-tools:
  - Bash(npx spec-flow *)
  - Bash(gh issue *)
  - Bash(gh project *)
  - Read
  - Write
---

# spec-flow Skill

Este skill guia o usuário pelo fluxo spec-driven definido no RFC-001.

> **Antes de responder a qualquer sub-comando**, leia o arquivo `rfc/rfc-integrate-spec-kit-into-kanban.md` se ele existir no diretório atual, para embasar suas respostas no processo real da equipe.

---

## Regra fundamental

**Nunca gere `spec.md` ou `plan.md` diretamente.** Sempre acione a label correspondente e deixe o GitHub Action gerar o arquivo. Isso garante que o arquivo seja commitado no repositório e referenciado na issue.

Exceção: se o usuário pedir explicitamente para revisar ou melhorar um documento já gerado, use o Write tool para editar o arquivo local.

---

## Fluxo Kanban

```
📥 Backlog → 🎯 Priorizado → 📋 Plan → 📋 Spec → ✅ Ready
→ 📋 Backlog Técnico → 🚧 Desenvolvimento → 👀 Code Review
→ 🧪 QA → 📋 Homologação → 🚀 Deploy → 🎉 Done
```

Labels de gatilho:
- `spec-flow:plan` → dispara `generate-plan.yml` → gera `plan.md`
- `spec-flow:spec` → dispara `generate-spec.yml` → gera `spec.md`
- `spec-flow:ready` → dispara `validate.yml` → valida ambos os arquivos
- `spec-flow:decompose` → dispara `decompose.yml` → gera Stories e Tasks

---

## Sub-comandos

### `/spec-flow setup`

Configure o spec-flow em um repositório GitHub.

**Passos:**
1. Verifique se `GITHUB_TOKEN` está definido: `echo $GITHUB_TOKEN`
2. Se necessário, oriente: `gh auth login` e `gh auth refresh --scopes project`
3. Execute: `npx spec-flow init`
4. Após a conclusão, instrua o usuário a adicionar `ANTHROPIC_API_KEY` como secret no repositório GitHub Settings → Secrets → Actions.

---

### `/spec-flow feature <descrição>`

Crie uma nova Feature no backlog.

**Passos:**
1. Pergunte ao usuário: título completo da feature, área (Frontend/Backend/Mobile/Infra/DevOps/Data), prioridade (P0/P1/P2/P3)
2. Crie a issue:
   ```bash
   gh issue create \
     --title "[FEATURE] <título>" \
     --body "<descrição fornecida pelo usuário>" \
     --label "[FEATURE]" \
     --label "<prioridade>"
   ```
3. Informe o número da issue criada
4. Oriente: "Quando quiser iniciar o planejamento técnico, mova o card para **📋 Plan** e use `/spec-flow plan <número>`"

---

### `/spec-flow plan <número-da-issue>`

Inicia a geração do plano técnico para uma Feature.

**Passos:**
1. Adicione a label de gatilho:
   ```bash
   gh issue edit <número> --add-label "spec-flow:plan"
   ```
2. Informe: "Label `spec-flow:plan` adicionada. O GitHub Action `generate-plan.yml` irá gerar o `plan.md` automaticamente. Acompanhe em: Actions → Generate Plan."
3. Após a conclusão (cheque comentários na issue ou aguarde confirmação do usuário), ofereça revisar o plan.md gerado em `docs/features/<slug>/plan.md`.

---

### `/spec-flow spec <número-da-issue>`

Inicia a geração da especificação funcional para uma Feature.

**Passos:**
1. Verifique se plan.md já existe (o spec usa o plano como contexto)
2. Adicione a label de gatilho:
   ```bash
   gh issue edit <número> --add-label "spec-flow:spec"
   ```
3. Informe: "Label `spec-flow:spec` adicionada. O GitHub Action `generate-spec.yml` irá gerar o `spec.md` automaticamente."
4. Após a conclusão, ofereça revisar o spec.md gerado em `docs/features/<slug>/spec.md`.

---

### `/spec-flow ready <número-da-issue>`

Valida que spec.md e plan.md estão completos e a Feature pode avançar.

**Passos:**
1. Adicione a label de validação:
   ```bash
   gh issue edit <número> --add-label "spec-flow:ready"
   ```
2. Informe: "Validação iniciada. O workflow verificará se spec.md e plan.md contêm todas as seções obrigatórias."
3. Se a validação falhar, o workflow comentará os problemas na issue e adicionará automaticamente `spec-flow:spec`. Informe o usuário para corrigir e tentar novamente.
4. Se passar, oriente: "Feature validada! Mova o card para **✅ Ready** e depois para **📋 Backlog Técnico** para iniciar a decomposição."

---

### `/spec-flow decompose <número-da-issue>`

Decompõe uma Feature em Stories e Tasks automaticamente.

**Passos:**
1. Confirme que a Feature está em **✅ Ready** (spec.md e plan.md validados)
2. Adicione a label de decomposição:
   ```bash
   gh issue edit <número> --add-label "spec-flow:decompose"
   ```
3. Informe: "Decomposição iniciada. O workflow gerará Stories e Tasks baseados em spec.md e plan.md."
4. Após a conclusão, as issues filhas aparecerão como comentário na Feature pai.

---

### `/spec-flow rfc <tópico>`

Crie um documento RFC seguindo a estrutura do RFC-001.

**Passos:**
1. Entreviste o usuário sobre: objetivo, problema atual, solução proposta, princípios, stakeholders afetados
2. Escreva o RFC em português com as seções:
   - 1. Objetivo
   - 2. Princípios
   - 3. Papéis e Responsabilidades
   - 4. Estrutura de Trabalho
   - 5. Fluxo de Trabalho
   - 6. Automação
   - 7. Métricas
   - 8. Riscos e Mitigações
3. Salve em `rfc/rfc-<slug-do-tópico>.md` usando o Write tool
4. Crie uma issue de RFC:
   ```bash
   gh issue create --title "[RFC] <título>" --label "[RFC]"
   ```

---

## Estrutura de arquivos gerados

```
docs/
  features/
    <slug-da-feature>/
      plan.md    ← gerado pelo GitHub Action quando spec-flow:plan é adicionado
      spec.md    ← gerado pelo GitHub Action quando spec-flow:spec é adicionado
```

O slug é gerado a partir do título da issue: `[FEATURE] Cadastro de Pedidos com PIX` → `cadastro-de-pedidos-com-pix`
