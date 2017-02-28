import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as HMR from 'hackmyresume';
import * as os from 'os';


export async function prepareForCommand(): Promise<string> {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }

  let doc = editor.document;
  let fileName = doc.fileName;
  if (vscode.workspace.getConfiguration('JSONResume').get('autoSave')) {
    if (doc.isDirty && !(await doc.save())) {
      return null;
    }
  }

  return path.join(os.tmpdir(), path.basename(fileName) + '.html');

}

export async function build(srcArray, destFile) {
  let options = {
    theme: vscode.workspace.getConfiguration('JSONResume').get('theme'),
    css: 'embed'
  };

  if (fs.existsSync(destFile)) {
    fs.unlinkSync(destFile);
  }
  let v = new HMR.verbs.build();

  return v.invoke.call(v, srcArray, [destFile], options, function () { });
}

