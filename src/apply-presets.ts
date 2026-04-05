/**
 * Apply domain presets to existing experiments.
 * This tool allows retroactively assigning preset_id to experiments.
 * Usage: 
 *   - List experiments: node dist/apply-presets.js --list
 *   - Apply preset: node dist/apply-presets.js --apply <experiment-id> <preset-id>
 *   - Auto-apply by name matching: node dist/apply-presets.js --auto
 */
import { initDatabase, getDatabase } from './db.js';
import {
  initExperimentsDb,
  listExperiments,
  updateExperiment,
} from './experiments.js';
import { listDomainPresets } from './domain-presets.js';
import { logger } from './logger.js';

function main() {
  try {
    // Initialize databases
    initDatabase();
    const db = getDatabase();
    initExperimentsDb(db);

    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === '--list') {
      // List all experiments
      listExperimentsCmd();
    } else if (command === '--apply' && args.length >= 3) {
      // Apply preset to specific experiment
      applyPresetCmd(args[1], args[2]);
    } else if (command === '--auto') {
      // Auto-apply presets based on name matching
      autoApplyCmd();
    } else {
      console.error(`
Usage:
  node dist/apply-presets.js --list              (list all experiments)
  node dist/apply-presets.js --apply <exp-id> <preset-id>  (apply preset to experiment)
  node dist/apply-presets.js --auto              (auto-apply by name matching)
      `);
      process.exit(1);
    }
  } catch (error) {
    logger.error(error, 'Apply presets failed');
    process.exit(1);
  }
}

function listExperimentsCmd() {
  const experiments = listExperiments();
  const presets = listDomainPresets();

  console.log('\n=== Experiments ===');
  for (const exp of experiments) {
    const preset = exp.preset_id
      ? presets.find((p) => p.id === exp.preset_id)
      : null;
    console.log(
      `[${exp.id}] ${exp.name}`,
      exp.preset_id ? `(preset: ${exp.preset_id})` : '(no preset)',
    );
  }

  console.log('\n=== Available Presets ===');
  for (const preset of presets) {
    console.log(`[${preset.id}] ${preset.name}`);
  }
}

function applyPresetCmd(experimentId: string, presetId: string) {
  const experiments = listExperiments();
  const presets = listDomainPresets();

  const exp = experiments.find((e) => e.id === experimentId);
  if (!exp) {
    console.error(`Experiment not found: ${experimentId}`);
    process.exit(1);
  }

  const preset = presets.find((p) => p.id === presetId);
  if (!preset) {
    console.error(`Preset not found: ${presetId}`);
    process.exit(1);
  }

  const updated = updateExperiment(experimentId, {
    preset_id: presetId,
    skill: preset.defaultSkill,
    mcp_servers: JSON.stringify(preset.mcpServers),
  });

  if (!updated) {
    console.error('Failed to update experiment');
    process.exit(1);
  }

  console.log(`✓ Applied preset "${preset.name}" to experiment "${exp.name}"`);
  console.log(`  Skill: ${updated.skill}`);
  console.log(`  MCP Servers: ${updated.mcp_servers}`);
}

function autoApplyCmd() {
  const experiments = listExperiments();
  const presets = listDomainPresets();

  let applied = 0;
  for (const exp of experiments) {
    // Skip if already has preset
    if (exp.preset_id) {
      logger.info({ experimentId: exp.id }, 'Already has preset');
      continue;
    }

    // Try to match by name keywords
    for (const preset of presets) {
      const keywords = preset.id.split('-');
      if (keywords.some((kw) => exp.name.includes(kw) || exp.name.includes(preset.name))) {
        const updated = updateExperiment(exp.id, {
          preset_id: preset.id,
          skill: preset.defaultSkill,
          mcp_servers: JSON.stringify(preset.mcpServers),
        });
        if (updated) {
          logger.info(
            { experimentId: exp.id, presetId: preset.id },
            'Auto-applied preset',
          );
          applied++;
          break;
        }
      }
    }
  }

  logger.info({ applied, total: experiments.length }, 'Auto-apply complete');
}

main();
