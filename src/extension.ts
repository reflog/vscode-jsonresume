'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { analyze } from "./analyze";
import { validate } from "./validate";
import { prepareForCommand, build } from "./build";
import { generateJsonResumePDF } from "./generatePDF";


let analysisOutputChannel: vscode.OutputChannel;
let diagnosticCollection: vscode.DiagnosticCollection;

async function updateWebview(panel: vscode.WebviewPanel) {
  try {
    let outFile = await prepareForCommand();
    const editor = vscode.window.activeTextEditor;
    if (!outFile || !editor) {
      return;
    }

    let doc = editor.document;
    let promises = [];
    if (vscode.workspace.getConfiguration('JSONResume').get('analysis')) {
      promises.push(analyze(analysisOutputChannel, [doc.fileName]));
    }
    if (vscode.workspace.getConfiguration('JSONResume').get('validation')) {
      promises.push(validate(diagnosticCollection, doc, [doc.fileName]));
    }

    promises.push(build([doc.fileName], outFile));
    await Promise.all(promises);
    if (fs.existsSync(outFile)) {
      const data = await fs.promises.readFile(outFile);
      // And set its HTML content
      panel.webview.html = data.toString();
    } else {
      throw new Error();
    }
  } catch (ex) {
    console.error(ex);
    vscode.window.showErrorMessage('Cannot generate preview!');
  }
}

function createOpenPreviewPanel(context : vscode.ExtensionContext) {
  let panel : vscode.WebviewPanel | undefined = undefined;

  return async function() {
    if (!panel) {
      // Create and show panel
      panel = vscode.window.createWebviewPanel(
        'jsonResumePreview',
        'JsonResume Preview',
        vscode.ViewColumn.Two,
        {}
      );

      var listener = vscode.workspace.onDidSaveTextDocument(_ => updateWebview(panel!));

      panel.onDidDispose(
        () => {
          listener.dispose();
          panel = undefined;
        },
        undefined,
        context.subscriptions
      );
    }

    await updateWebview(panel);
  };
}

export function activate(context : vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection();
  analysisOutputChannel = vscode.window.createOutputChannel('JSONResume Analysis');

  const openPreviewPanel = createOpenPreviewPanel(context);
  context.subscriptions.push(vscode.commands.registerCommand('JSONResume.previewJsonResume', openPreviewPanel));
  context.subscriptions.push(vscode.commands.registerCommand('JSONResume.generateJsonResumePDF', generateJsonResumePDF));
}

export function deactivate() {
  analysisOutputChannel.hide();
  analysisOutputChannel.dispose();
  diagnosticCollection.clear();
  diagnosticCollection.dispose();
}