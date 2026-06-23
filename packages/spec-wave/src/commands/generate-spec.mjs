import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolveToken } from '../api/auth.mjs';
import { getIssue, removeLabel, commentOnIssue } from '../api/github-rest.mjs';
import { generateDocument } from '../lib/claude.mjs';
import { slugify } from '../lib/slugify.mjs';

const SYSTEM_PROMPT = `Você é um Product Manager experiente. Gere uma especificação funcional (spec.md) completa para a Feature descrita pelo usuário.

O spec deve conter exatamente estas seções em português:
# Objetivo
# Regras de Negócio
# Fluxos
# Critérios de Aceite
# Casos de Erro
# Dependências

Para cada seção, seja específico e detalhado. Os Critérios de Aceite devem estar no formato de checklist markdown (- [ ] item).
Responda APENAS com o conteúdo do spec.md, sem texto adicional.`;

export async function generateSpec({ issueNumber }) {
  const token = await resolveToken();
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');

  if (!owner || !repo) {
    throw new Error(
      'GITHUB_REPOSITORY env var não definida.\n' +
      'Este comando roda no GitHub Actions. Para testar localmente:\n' +
      '  GITHUB_REPOSITORY=owner/repo spec-wave generate-spec --issue-number 1'
    );
  }

  console.log(`Buscando issue #${issueNumber}...`);
  const issue = await getIssue(token, owner, repo, parseInt(issueNumber, 10));
  const slug = slugify(issue.title);
  const featureDir = `docs/features/${slug}`;
  const filePath = `${featureDir}/spec.md`;

  const userContent = `Feature: ${issue.title}\n\nDescrição:\n${issue.body || '(sem descrição)'}`;

  console.log(`Gerando spec.md para: ${issue.title}`);
  const content = await generateDocument(SYSTEM_PROMPT, userContent);

  mkdirSync(featureDir, { recursive: true });
  writeFileSync(filePath, content, 'utf-8');

  // Commit and push
  const git = (cmd) => execSync(cmd, { stdio: 'inherit' });
  git(`git config user.email "spec-wave[bot]@github.com"`);
  git(`git config user.name "spec-wave[bot]"`);
  git(`git add "${filePath}"`);
  git(`git commit -m "docs: generate spec.md for ${slug} [spec-wave]"`);
  git('git push');

  // Remove trigger label
  await removeLabel(token, owner, repo, parseInt(issueNumber, 10), 'spec-wave:spec');

  // Comment on issue
  await commentOnIssue(
    token, owner, repo, parseInt(issueNumber, 10),
    `📋 **spec.md gerado automaticamente!**\n\n` +
    `📄 Arquivo: [\`${filePath}\`](${filePath})\n\n` +
    `Revise a especificação e, quando estiver pronto, gere o plano técnico: mova o card para **📋 Plan** ou use:\n` +
    `\`\`\`\ngh issue edit ${issueNumber} --add-label "spec-wave:plan"\n\`\`\``
  );

  console.log(`spec.md criado em: ${filePath}`);
}
