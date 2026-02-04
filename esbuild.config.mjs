import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

// GAS用のビルド設定
// - 全モジュールを1ファイルにバンドル
// - グローバル関数として公開するためのポストプロセス

const outfile = 'dist/main.js';

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: outfile,
  format: 'iife',
  globalName: 'GasTicketPlanner',
  target: 'es2019',
  platform: 'neutral',
  // GAS環境にはprocess等がないため
  define: {
    'process.env.NODE_ENV': '"production"'
  },
});

// GAS用にグローバル関数を公開するためのポストプロセス
let code = fs.readFileSync(outfile, 'utf8');

// GASが認識できる関数宣言形式でグローバル関数を定義
// function宣言を使用することで、GASエディタの関数選択ドロップダウンに表示される
const globalExports = `
// GAS グローバル関数の公開（function宣言形式）
function onOpen() { return GasTicketPlanner.onOpen(); }
function initializeSheets() { return GasTicketPlanner.initializeSheets(); }
function showCreateTicketDialog() { return GasTicketPlanner.showCreateTicketDialog(); }
function showGanttDialog() { return GasTicketPlanner.showGanttDialog(); }
function resetSettings() { return GasTicketPlanner.resetSettings(); }
function showHelp() { return GasTicketPlanner.showHelp(); }
function getAssigneeList() { return GasTicketPlanner.getAssigneeList(); }
function createTicket(formData) { return GasTicketPlanner.createTicket(formData); }
function generateGantt(params) { return GasTicketPlanner.generateGantt(params); }
`;

code = code + globalExports;
fs.writeFileSync(outfile, code);

console.log('✅ Build completed: ' + outfile);
