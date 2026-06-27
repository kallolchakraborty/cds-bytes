import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const SRC_DIR = join(PROJECT_ROOT, 'sources');
const CONTENT_DIR = join(PROJECT_ROOT, 'content');
const JS_DIR = join(PROJECT_ROOT, 'js');

if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

const PHASE_RE = /^Phase\s+(\d+)\s*-\s*(.+)$/;

const PHASE_NAMES = {
  1: 'Fundamentals',
  2: 'Parameters & Filtering',
  3: 'Joins & Associations',
  4: 'Aggregation & Subqueries',
  5: 'Built-in Functions',
  6: 'Virtual Data Model (VDM)',
  7: 'Fiori & OData',
  8: 'RAP & Extensibility',
  9: 'Advanced Data Modeling',
  10: 'Analytics & Security',
  11: 'Table Functions & AMDP',
  12: 'Quality, Performance & Enterprise',
};

function scanPhaseDirs() {
  const entries = [];
  const dirs = readdirSync(SRC_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('Phase'))
    .sort();

  for (const dir of dirs) {
    const m = dir.name.match(PHASE_RE);
    if (!m) continue;
    const phaseNum = parseInt(m[1], 10);
    const phaseName = PHASE_NAMES[phaseNum] || m[2].trim();

    const phaseDir = join(SRC_DIR, dir.name);
    const files = readdirSync(phaseDir)
      .filter(f => f.endsWith('.txt'))
      .sort();

    for (const file of files) {
      entries.push({
        file: file.replace('.txt', ''),
        filePath: join(phaseDir, file),
        phase: phaseNum,
        phaseName: phaseName,
        phaseDir: dir.name,
      });
    }
  }
  return entries;
}

function extractContent(filePath, fileName) {
  const text = readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');

  let headerEnd = -1;
  let headerLines = [];
  let sourceStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '*/') {
      headerEnd = i;
      sourceStart = i + 1;
      break;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      headerLines.push(lines[i]);
    }
  }

  let cdsViewName = '';
  let sqlViewName = '';
  let purpose = '';
  let topic = '';
  let learningPoints = [];
  let detailsNotes = [];
  let inLearningPoints = false;
  let inDetails = false;

  for (const line of headerLines) {
    const clean = line.replace(/^\s*\*\s*/, '').trim();

    const cdsMatch = clean.match(/CDS\s+VIEW:\s*(\S+)/i);
    if (cdsMatch) cdsViewName = cdsMatch[1];

    const sqlMatch = clean.match(/SQL\s+VIEW:\s*(\S+)/i);
    if (sqlMatch) sqlViewName = sqlMatch[1];

    const amdpMatch = clean.match(/AMDP\s+CLASS:\s*(\S+)/i);
    if (amdpMatch && !cdsViewName) cdsViewName = amdpMatch[1];

    const purposeMatch = clean.match(/PURPOSE\s*:\s*(.+)/i);
    if (purposeMatch) purpose = purposeMatch[1];

    const topicMatch = clean.match(/TOPIC\s*:\s*(.+)/i);
    if (topicMatch) topic = topicMatch[1];

    if (clean.startsWith('KEY LEARNING POINTS:') || clean.startsWith('KEY CONCEPTS:') || clean.startsWith('KEY RULES:')) {
      inLearningPoints = true;
      inDetails = false;
      continue;
    }

    if (inLearningPoints) {
      const lpMatch = clean.match(/^\d+\.\s*(.+)/);
      if (lpMatch) {
        learningPoints.push(lpMatch[1]);
      } else if (clean.startsWith('=') || clean.startsWith('JOIN TYPES') || clean.startsWith('PERFORMANCE') || clean.startsWith('NOTE:') || clean.startsWith('DEPENDENCY') || clean.startsWith('TABLE FUNCTIONS') || clean.startsWith('WHAT IS')) {
        inLearningPoints = false;
        inDetails = true;
        if (!clean.startsWith('=')) detailsNotes.push(clean);
      } else if (clean) {
        detailsNotes.push(clean);
      }
    } else if (clean.startsWith('JOIN TYPES') || clean.startsWith('PERFORMANCE') || clean.startsWith('NOTE:') || clean.startsWith('DEPENDENCY') || clean.startsWith('TABLE FUNCTIONS') || clean.startsWith('USAGE') || clean.startsWith('WHAT IS') || clean.startsWith('AMDP TYPES') || clean.startsWith('DCL SYNTAX') || clean.startsWith('COMMON DCL')) {
      inDetails = true;
      if (clean) detailsNotes.push(clean);
    } else if (inDetails && clean && !clean.startsWith('=')) {
      detailsNotes.push(clean);
    }
  }

  let sourceCode = '';
  if (sourceStart > 0 && sourceStart < lines.length) {
    sourceCode = lines.slice(sourceStart).join('\n').trim();
  }

  // Detect DIAGRAM: markers in header
  const diagramRefs = [];
  for (const line of headerLines) {
    const clean = line.replace(/^\s*\*\s*/, '').trim();
    const dMatch = clean.match(/^DIAGRAM:\s*(.+)$/i);
    if (dMatch) {
      diagramRefs.push(dMatch[1].trim());
    }
  }

  // Read and inline diagram SVGs
  let diagramHtml = '';
  for (const ref of diagramRefs) {
    const diagramPath = join(PROJECT_ROOT, ref);
    if (existsSync(diagramPath)) {
      try {
        const svgContent = readFileSync(diagramPath, 'utf-8');
        diagramHtml += svgContent.replace(/^<\?xml[^>]*\?>/, '').trim();
      } catch (e) {
        console.warn(`  ⚠ Could not read diagram: ${ref}`);
      }
    }
  }

  const hashId = cdsViewName || fileName.replace('.txt', '');

  return {
    cdsViewName,
    sqlViewName,
    purpose,
    topic,
    learningPoints,
    detailsNotes,
    sourceCode,
    hashId,
    diagramHtml
  };
}

function buildTags(entry, data, phase) {
  const tags = [];
  const topic = (data.topic || '').toLowerCase();
  const name = entry.file.toLowerCase();

  const tagMap = [
    ['cds-view', 'basic', 'foundation', 'simple', 'view-on-view', 'data-manipulation', 'cast', 'cds-intro'],
    ['parameters', 'param'],
    ['joins', 'inner-join', 'left-join', 'right-join', 'cross-join'],
    ['associations', 'path-expressions', 'association'],
    ['aggregation', 'group-by', 'having'],
    ['functions', 'string-functions', 'date-functions', 'coalesce', 'currency-conversion'],
    ['subqueries', 'exists', 'union'],
    ['vdm', 'private', 'basic', 'composite', 'consumption'],
    ['rap', 'composition', 'object-model', 'behavior', 'extensibility', 'view-extension', 'rap-behavior'],
    ['fiori', 'ui-annotations', 'value-help', 'search', 'mdx-ext', 'service-expose'],
    ['odata', 'draft'],
    ['client-handling'],
    ['session', 'session-variables'],
    ['hierarchy'],
    ['table-functions', 'table-function', 'amdp', 'tf-simple', 'tf-param', 'tf-currency'],
    ['dcl', 'access-control', 'advanced-dcl'],
    ['text-association', 'text-assoc'],
    ['virtual-element', 'virtual-elem'],
    ['custom-entity', 'custom-entities'],
    ['abstract-entity', 'abstract-entities'],
    ['view-entity', 'view-entity-syntax'],
    ['projection-views', 'provider-contract'],
    ['table-entities', 'cds-table-entity'],
    ['analytical', 'analytical-cds'],
    ['analytical-v3', 'analytical-projection'],
    ['release-contracts', 'api-contracts', 'c0-c3'],
    ['unit-test', 'cds-test-double'],
    ['rap-eventing', 'business-events', 'eventing'],
    ['cloud-core', 'abap-cloud', 'clean-core'],
    ['performance', 'cds-performance'],
  ];

  for (const [cat, ...keywords] of tagMap) {
    for (const kw of keywords) {
      if (name.includes(kw) || topic.includes(kw)) {
        tags.push(cat);
        break;
      }
    }
  }

  if (tags.length === 0) tags.push('cds-views');
  return [...new Set(tags)];
}

function generateDescription(data, entry) {
  let desc = '';
  if (data.purpose) {
    desc = data.purpose;
  } else {
    desc = `CDS View: ${data.cdsViewName}`;
  }
  if (data.learningPoints.length > 0) {
    const top = data.learningPoints.slice(0, 3).join('. ');
    desc += `. Key topics: ${top}.`;
  }
  return desc.substring(0, 300);
}

function generateSections(data) {
  const sections = [];

  if (data.learningPoints.length > 0) {
    sections.push({
      title: 'Key Learning Points',
      description: `<div class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${data.learningPoints.map(p => `<div class="flex items-start gap-2 mb-1.5"><span class="text-brand-500 mt-0.5 shrink-0">◆</span><span>${p}</span></div>`).join('')}</div>`
    });
  }

  if (data.diagramHtml) {
    sections.push({
      title: 'Concept Diagram',
      description: `<div class="docs-diagram">${data.diagramHtml}</div>`
    });
  }

  if (data.sourceCode) {
    sections.push({
      title: 'CDS Source Code',
      language: 'abap',
      codeBlock: data.sourceCode
    });
  }

  return sections;
}

function getSubcategory(phase, file) {
  const name = file.toLowerCase();
  const phaseSubcats = {
    1: { intro: 'Getting Started', simple: 'Getting Started', view_entity: 'Getting Started', view_on_view: 'Core Concepts', data_manip: 'Core Concepts', cast: 'Core Concepts' },
    2: { param: 'Input Parameters', default_param: 'Input Parameters', param_const: 'Parameter Forwarding', param_var: 'Parameter Forwarding' },
    3: { inner_join: 'Joins', left_join: 'Joins', right_join: 'Joins', cross_join: 'Joins', association: 'Associations', path_expr: 'Associations' },
    4: { group_by: 'Aggregation', having: 'Aggregation', exists: 'Subqueries', union: 'Set Operations' },
    5: { string_func: 'String', date_func: 'Date/Time', coalesce: 'NULL Handling', curr_conv: 'Currency' },
    6: { vdm_private: 'VDM Layers', vdm_basic: 'VDM Layers', vdm_composite: 'VDM Layers', vdm_consume: 'VDM Layers' },
    7: { mdx_ext: 'Modeling', ui_annot: 'UI Annotations', value_help: 'Consumption', search: 'Search & Discovery', odata_draft: 'OData Services', service_expose: 'OData Services' },
    8: { composition: 'Composition & RAP', object_model: 'Composition & RAP', rap_behavior: 'RAP Behavior', extensibility: 'Extensibility', view_ext: 'Extensibility' },
    9: { client_handling: 'Client & Session', session_var: 'Client & Session', hierarchy: 'Hierarchy', text_assoc: 'Text & Virtual', virtual_elem: 'Text & Virtual', custom_entity: 'Custom & Abstract', abstract_entity: 'Custom & Abstract', table_entities: 'Tables & Projections', projection_views: 'Tables & Projections' },
    10: { dcl: 'Authorization', analytical: 'Analytical CDS', analytical_v3: 'Analytical CDS', release_contracts: 'Governance' },
    11: { tf_simple: 'Table Functions', tf_param: 'Table Functions', tf_currency: 'Table Functions', tf_dummy: 'Table Functions', amdp_simple: 'AMDP', amdp_dynamic: 'AMDP' },
    12: { performance: 'Performance & Quality', unit_test: 'Performance & Quality', rap_eventing: 'Integration', cloud_core: 'Integration' },
  };
  const map = phaseSubcats[phase];
  if (map) {
    for (const [key, val] of Object.entries(map)) {
      if (name.includes(key)) return val;
    }
  }
  return phase;
}

const fileEntries = scanPhaseDirs();

const routeMap = {};
const routeList = [];
const searchIndex = [];
const contentFiles = [];

for (const entry of fileEntries) {
  const data = extractContent(entry.filePath, entry.file + '.txt');
  const hash = '#' + data.hashId;
  const subcategory = getSubcategory(entry.phase, entry.file);

  const tags = buildTags(entry, data, entry.phase);
  const description = generateDescription(data, entry);
  const sections = generateSections(data);

  let detailsHtml = '';
  if (data.detailsNotes.length > 0) {
    detailsHtml = data.detailsNotes.map(n => `<p class="mb-2">${n}</p>`).join('');
  }

  const title = data.purpose
    ? data.purpose.replace(/^.*?-\s*/, '')
    : data.cdsViewName;

  const contentHtml = sections.map(s => {
    if (s.codeBlock) {
      return `<h2 id="section-${data.hashId}-${s.title.toLowerCase().replace(/\s+/g, '-')}">${s.title}</h2>\n<pre><code class="language-abap">${s.codeBlock}</code></pre>`;
    }
    if (s.description) {
      return `<h2 id="section-${data.hashId}-${s.title.toLowerCase().replace(/\s+/g, '-')}">${s.title}</h2>\n${s.description}`;
    }
    return '';
  }).join('\n');

  const contentItem = {
    id: data.hashId,
    title: title,
    phase: entry.phase,
    phaseName: entry.phaseName,
    category: entry.phaseName,
    subcategory: subcategory,
    language: 'abap',
    description: description,
    sections: sections,
    content: contentHtml,
    tags: tags,
    details: detailsHtml,
    cdsViewName: data.cdsViewName,
    sqlViewName: data.sqlViewName,
    topic: data.topic
  };

  const contentPath = `content/${data.hashId}.json`;
  writeFileSync(join(PROJECT_ROOT, contentPath), JSON.stringify(contentItem));
  contentFiles.push(data.hashId);

  routeMap[hash] = contentPath;

  routeList.push({
    hash: hash,
    key: data.hashId,
    title: title,
    phase: entry.phase,
    phaseName: entry.phaseName,
    sections: sections.map(s => ({ id: s.title.toLowerCase().replace(/\s+/g, '-'), title: s.title }))
  });

  const firstSections = sections.slice(0, 5).map(s => s.title);

  // Build plain text for full-text Fuse.js search
  const sectionsText = sections.map(s => {
    const desc = (s.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return s.title + ' ' + desc;
  }).join(' | ');
  const detailsText = (detailsHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  searchIndex.push({
    title: title,
    phase: entry.phase,
    phaseName: entry.phaseName,
    category: entry.phaseName,
    url: 'docs.html' + hash,
    tags: tags,
    description: description.substring(0, 160),
    sections: firstSections,
    sectionsText: sectionsText,
    detailsText: detailsText
  });

  console.log(`✓ [Phase ${entry.phase}] ${data.hashId}`);
}

// Inject study plan into route map and search index
const studyPlanPath = 'content/ZPRAC_STUDY_PLAN.json';
if (existsSync(join(PROJECT_ROOT, studyPlanPath))) {
  try {
    const studyPlanData = JSON.parse(readFileSync(join(PROJECT_ROOT, studyPlanPath), 'utf-8'));
    const studyHash = '#ZPRAC_STUDY_PLAN';
    routeMap[studyHash] = studyPlanPath;
    routeList.push({
      hash: studyHash,
      key: 'ZPRAC_STUDY_PLAN',
      title: studyPlanData.title,
      phase: 0,
      phaseName: 'Study Plan',
      sections: (studyPlanData.sections || []).map(s => ({ id: s.title.toLowerCase().replace(/\s+/g, '-'), title: s.title }))
    });
    const studySections = (studyPlanData.sections || []).map(s => s.title);
    const studySectionsText = (studyPlanData.sections || []).map(s => {
      return s.title + ' ' + (s.description || '');
    }).join(' | ');

    searchIndex.push({
      title: studyPlanData.title,
      phase: 0,
      phaseName: 'Study Plan',
      category: 'Study Plan',
      url: 'docs.html' + studyHash,
      tags: ['study-plan'],
      description: studyPlanData.description || '',
      sections: studySections,
      sectionsText: studySectionsText,
      detailsText: ''
    });
    console.log(`\n✓ Injected study plan into route map and search index`);
  } catch (e) {
    console.warn(`\n⚠ Could not inject study plan: ${e.message}`);
  }
}

const generatedJs = `// Auto-generated by scripts/build.mjs
window.__BUILD_TIMESTAMP = "${new Date().toISOString()}";

window.__ROUTE_MAP = ${JSON.stringify(routeMap)};

window.__ROUTES = ${JSON.stringify(routeList)};

window.__SEARCH_INDEX = ${JSON.stringify(searchIndex)};
`;

writeFileSync(join(JS_DIR, 'generated.js'), generatedJs);
console.log(`\n✓ Generated route map with ${Object.keys(routeMap).length} entries`);
console.log(`✓ Generated search index with ${searchIndex.length} entries`);
console.log(`\nDone! Content files created: ${contentFiles.length}`);
