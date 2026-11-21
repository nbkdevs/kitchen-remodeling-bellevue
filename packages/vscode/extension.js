'use strict';
const vscode = require('vscode');
const crypto = require('crypto');
const core = require('./lib/core');
const report = require('./lib/report');
const panelHtml = require('./lib/panel');

const SECTION = 'kitchenRemodelingCostPlanner';

function settings() {
  const c = vscode.workspace.getConfiguration(SECTION);
  return {
    taxRate: c.get('taxRate', core.DEFAULT_TAX_RATE * 100) / 100,
    contingencyRate: c.get('contingencyRate', core.DEFAULT_CONTINGENCY_RATE * 100) / 100,
    defaultPermit: c.get('defaultPermit', 1500),
  };
}

async function insertMarkdown(md) {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: '' });
    editor = await vscode.window.showTextDocument(doc);
  }
  await editor.edit((e) => {
    for (const sel of editor.selections) e.replace(sel, md);
  });
}

async function promptBreakdown(mode) {
  const s = settings();
  const label = mode === 'split' ? 'All-in remodel budget (tax, reserve and permits included)' : 'Construction cost before tax and reserve';
  const amountText = await vscode.window.showInputBox({
    title: 'Kitchen Remodeling Cost Planner',
    prompt: `${label}, e.g. 60000 or 60k`,
    value: '60000',
    validateInput: (t) => (report.parseMoney(t) > 0 ? null : 'Enter a dollar amount such as 60000, $60,000 or 60k'),
  });
  if (amountText === undefined) return undefined;
  const permitText = await vscode.window.showInputBox({
    title: 'Kitchen Remodeling Cost Planner',
    prompt: 'Permit allowance in dollars (0 for none)',
    value: String(s.defaultPermit),
    validateInput: (t) => (report.parseMoney(t) >= 0 ? null : 'Enter a dollar amount, e.g. 1500'),
  });
  if (permitText === undefined) return undefined;
  return report.build({ mode, amount: report.parseMoney(amountText), permit: report.parseMoney(permitText), taxRate: s.taxRate, contingencyRate: s.contingencyRate });
}

async function runInsert() {
  const pick = await vscode.window.showQuickPick(
    [
      { label: 'Split an all-in budget', description: 'Budget already includes tax, reserve and permits', mode: 'split' },
      { label: 'Estimate from construction cost', description: 'Adds reserve, sales tax and permits on top', mode: 'estimate' },
      ...Object.entries(core.PRESETS).map(([key, p]) => ({ label: `Preset: ${p.label}`, description: `${core.money(p.construction)} construction`, preset: key })),
    ],
    { title: 'Insert kitchen remodel cost breakdown', placeHolder: 'How do you want to build the breakdown?' }
  );
  if (!pick) return;
  try {
    const s = settings();
    const r = pick.preset
      ? report.build({ preset: pick.preset, taxRate: s.taxRate, contingencyRate: s.contingencyRate })
      : await promptBreakdown(pick.mode);
    if (r) await insertMarkdown(report.toMarkdown(r));
  } catch (err) {
    vscode.window.showErrorMessage(`Kitchen Remodeling Cost Planner: ${err.message}`);
  }
}

let current;
function openPlanner(context) {
  if (current) { current.reveal(); return; }
  const media = vscode.Uri.joinPath(context.extensionUri, 'media');
  const panel = vscode.window.createWebviewPanel('kitchenRemodelingPlanner', 'Kitchen Remodeling Cost Planner', vscode.ViewColumn.Active, {
    enableScripts: true,
    localResourceRoots: [media],
    retainContextWhenHidden: false,
  });
  current = panel;
  panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
  const w = panel.webview;
  w.html = panelHtml.html({
    cspSource: w.cspSource,
    nonce: crypto.randomBytes(16).toString('hex'),
    coreUri: w.asWebviewUri(vscode.Uri.joinPath(media, 'core.js')),
    scriptUri: w.asWebviewUri(vscode.Uri.joinPath(media, 'panel.js')),
    styleUri: w.asWebviewUri(vscode.Uri.joinPath(media, 'panel.css')),
    settings: settings(),
  });
  w.onDidReceiveMessage(async (msg) => {
    if (!msg || !msg.inputs) return;
    try {
      const md = report.toMarkdown(report.build(msg.inputs));
      if (msg.type === 'copy') {
        await vscode.env.clipboard.writeText(md);
        vscode.window.showInformationMessage('Cost breakdown copied as Markdown.');
      } else if (msg.type === 'insert') {
        const target = vscode.window.visibleTextEditors[0];
        if (target) await vscode.window.showTextDocument(target.document, target.viewColumn);
        await insertMarkdown(md);
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Kitchen Remodeling Cost Planner: ${err.message}`);
    }
  }, undefined, context.subscriptions);
  panel.onDidDispose(() => { current = undefined; }, undefined, context.subscriptions);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('kitchenRemodelingCostPlanner.openPlanner', () => openPlanner(context)),
    vscode.commands.registerCommand('kitchenRemodelingCostPlanner.insertBreakdown', runInsert)
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
