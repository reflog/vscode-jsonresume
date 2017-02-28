'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { analyze } from "./analyze";
import { validate } from "./validate";
import { prepareForCommand, build } from "./build";
import { generateJsonResumePDF } from "./generatePDF";


let analysisOutputChannel: vscode.OutputChannel;
let diagnosticCollection: vscode.DiagnosticCollection;



function display(doc: vscode.TextDocument, uri: vscode.Uri) {
  return vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two, 'JsonResume Preview').then(
    success =>
      vscode.window.showTextDocument(doc), // return back to editing the resume
    reason =>
      vscode.window.showErrorMessage(reason)
  );
}


async function processJsonResume() {
  let outFile = await prepareForCommand();
  if (!outFile) {
    return;
  }


  try {
    let doc = vscode.window.activeTextEditor.document;
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
      display(doc, vscode.Uri.file(outFile));
    } else {
      throw new Error();
    }
  } catch (ex) {
    console.error(ex);
    vscode.window.showErrorMessage('Cannot generate preview!');
  }

}

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection();
  analysisOutputChannel = vscode.window.createOutputChannel('JSONResume Analysis');

  context.subscriptions.push(vscode.commands.registerCommand('JSONResume.previewJsonResume', processJsonResume));
  context.subscriptions.push(vscode.commands.registerCommand('JSONResume.generateJsonResumePDF', generateJsonResumePDF));
}

export function deactivate() {
  analysisOutputChannel.hide();
  analysisOutputChannel.dispose();
  diagnosticCollection.clear();
  diagnosticCollection.dispose();
}