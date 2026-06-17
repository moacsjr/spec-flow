#!/usr/bin/env node

import { program } from 'commander';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dir, '..', 'package.json'), 'utf-8'));

program
  .name('spec-flow')
  .description('Setup spec-driven GitHub workflow with Projects v2')
  .version(pkg.version);

program
  .command('init')
  .description('Configura spec-flow em um repositório GitHub')
  .option('--dry-run', 'Simula a configuração sem fazer alterações')
  .option('--repo <owner/repo>', 'Repositório GitHub (ignora o wizard interativo)')
  .option('--project-title <title>', 'Nome do GitHub Project (padrão: "<repo> — Spec Flow")')
  .option('--skip-project', 'Pula a criação do GitHub Project (use se já foi criado)')
  .option('--skip-labels', 'Pula a criação das labels')
  .option('--skip-files', 'Pula a criação dos arquivos de workflow')
  .action(async (options) => {
    const { init } = await import('../src/commands/init.mjs');
    await init(options);
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
