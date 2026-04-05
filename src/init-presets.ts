/**
 * Initialize preset experiments — runs once during setup.
 * This script creates initial experiments for each domain preset if they don't exist.
 * Usage: node dist/init-presets.js
 */
import { initDatabase, getDatabase } from './db.js';
import { initExperimentsDb, createExperiment, listExperiments } from './experiments.js';
import { listDomainPresets } from './domain-presets.js';
import { logger } from './logger.js';

function main() {
  try {
    // Initialize databases
    initDatabase();
    const db = getDatabase();
    initExperimentsDb(db);

    // Check existing experiments
    const existing = listExperiments();
    const existingPresetIds = new Set(existing.map((e) => e.preset_id).filter(Boolean));

    logger.info(
      { existingCount: existing.length, existingPresetIds: Array.from(existingPresetIds) },
      'Scanning existing experiments',
    );

    // Create experiments for presets that don't have one yet
    const presets = listDomainPresets();
    let created = 0;
    for (const preset of presets) {
      if (existingPresetIds.has(preset.id)) {
        logger.info({ presetId: preset.id }, 'Experiment already exists for preset');
        continue;
      }

      const exp = createExperiment(
        preset.name,
        preset.description,
        '', // created_by
        '', // sync_repo
        preset.defaultSkill,
        JSON.stringify(preset.mcpServers),
        preset.id, // presetId
      );

      logger.info(
        { presetId: preset.id, experimentId: exp.id, name: exp.name },
        'Created preset experiment',
      );
      created++;
    }

    logger.info({ created, total: presets.length }, 'Preset initialization complete');
  } catch (error) {
    logger.error(error, 'Preset initialization failed');
    process.exit(1);
  }
}

main();
