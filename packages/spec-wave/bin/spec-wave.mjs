#!/usr/bin/env node

import { program } from 'commander';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dir, '..', 'package.json'), 'utf-8'));

program
  .name('spec-wave')
  .description('Setup spec-driven GitHub workflow with Projects v2')
  .version(pkg.version);

program
  .command('init')
  .description('Configura spec-wave em um repositório GitHub')
  .option('--dry-run', 'Simula a configuração sem fazer alterações')
  .option('--repo <owner/repo>', 'Repositório GitHub (ignora o wizard interativo)')
  .option('--project-title <title>', 'Nome do GitHub Project (padrão: "<repo> — Spec Wave")')
  .option('--skip-project', 'Pula a criação do GitHub Project (use se já foi criado)')
  .option('--skip-labels', 'Pula a criação das labels')
  .option('--skip-files', 'Pula a criação dos arquivos de workflow')
  .action(async (options) => {
    const { init } = await import('../src/commands/init.mjs');
    await init(options);
  });

program
  .command('info')
  .description('Mostra se o repositório atual foi inicializado e os dados do .spec-wave.json')
  .option('--json', 'Saída em JSON (para uso programático)')
  .action(async (options) => {
    const { info } = await import('../src/commands/info.mjs');
    await info(options);
  });

program
  .command('refresh')
  .description('Atualiza o .spec-wave.json local com os dados atuais do GitHub Project')
  .option('--config', 'Re-consulta o Project e reescreve o .spec-wave.json')
  .action(async (options) => {
    const { refresh } = await import('../src/commands/refresh.mjs');
    await refresh(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program
  .command('issue')
  .description('Cria um work item (epic/feature/story/task...), opcionalmente como sub-issue, e adiciona ao board')
  .requiredOption('--title <title>', 'Título (sem o prefixo de tipo, ex.: [FEATURE])')
  .option('--type <type>', 'Tipo: epic, feature, story, task, bug, spike ou rfc', 'feature')
  .option('--parent <n>', 'Número da issue pai (cria como sub-issue dela)')
  .option('--body <text>', 'Descrição')
  .option('--priority <p>', 'Prioridade: P0, P1, P2 ou P3')
  .option('--area <area>', 'Área: Frontend, Backend, Mobile, Infra, DevOps ou Data')
  .action(async (options) => {
    const { issue } = await import('../src/commands/issue.mjs');
    await issue(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program
  .command('feature')
  .description('Atalho de `issue --type feature`')
  .requiredOption('--title <title>', 'Título da feature (sem o prefixo [FEATURE])')
  .option('--parent <n>', 'Número da Epic pai (cria como sub-issue dela)')
  .option('--body <text>', 'Descrição da feature')
  .option('--priority <p>', 'Prioridade: P0, P1, P2 ou P3 (adiciona label)')
  .option('--area <area>', 'Área: Frontend, Backend, Mobile, Infra, DevOps ou Data')
  .action(async (options) => {
    const { feature } = await import('../src/commands/feature.mjs');
    await feature(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program
  .command('uninstall')
  .description('Remove labels, arquivos .github e o .spec-wave.json (mantém o GitHub Project)')
  .option('--repo <owner/repo>', 'Repositório (padrão: lê do .spec-wave.json)')
  .option('--skip-labels', 'Não remove as labels')
  .option('--skip-files', 'Não remove os arquivos .github')
  .option('--keep-config', 'Mantém o .spec-wave.json local')
  .option('--dry-run', 'Mostra o que seria removido sem alterar nada')
  .option('--yes', 'Não pede confirmação')
  .action(async (options) => {
    const { uninstall } = await import('../src/commands/uninstall.mjs');
    await uninstall(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program
  .command('generate-plan')
  .description('Gera plan.md para uma Feature (usado pelo GitHub Action)')
  .requiredOption('--issue-number <n>', 'Número da issue no GitHub')
  .action(async (options) => {
    const { generatePlan } = await import('../src/commands/generate-plan.mjs');
    await generatePlan(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program
  .command('generate-spec')
  .description('Gera spec.md para uma Feature (usado pelo GitHub Action)')
  .requiredOption('--issue-number <n>', 'Número da issue no GitHub')
  .action(async (options) => {
    const { generateSpec } = await import('../src/commands/generate-spec.mjs');
    await generateSpec(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program
  .command('validate')
  .description('Valida spec.md e plan.md de uma Feature (usado pelo GitHub Action)')
  .requiredOption('--issue-number <n>', 'Número da issue no GitHub')
  .action(async (options) => {
    const { validate } = await import('../src/commands/validate.mjs');
    await validate(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program
  .command('decompose')
  .description('Decompõe uma Feature em Stories e Tasks (usado pelo GitHub Action)')
  .requiredOption('--issue-number <n>', 'Número da issue no GitHub')
  .action(async (options) => {
    const { decompose } = await import('../src/commands/decompose.mjs');
    await decompose(options).catch(err => { console.error(err.message); process.exit(1); });
  });

program.parse();
