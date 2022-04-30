import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pdf from 'html-pdf';
import * as open from 'open';
import { prepareForCommand, build } from "./build";

const pdfMap = new Map<string, string>();

function pathValidation(pathStr: string): string {
  if (fs.existsSync(path.dirname(pathStr)))
    return "";
  return "Target folder doesn't exist!";
}


export async function generateJsonResumePDF() {
  let fileName = await prepareForCommand();
  if (!fileName || !vscode.window.activeTextEditor) {
    return;
  }
  try {
    await build([vscode.window.activeTextEditor.document.fileName], fileName);
    var html = fs.readFileSync(fileName, 'utf8');
    if (fs.existsSync(fileName)) {
      const defValue = pdfMap.has(fileName) ? pdfMap.get(fileName) : "";
      vscode.window.showInputBox({
        prompt: "Please enter full filename of PDF to generated",
        value: defValue,
        validateInput: pathValidation
      }).then(result => {
        if (!result) return;
        if (path.extname(result).toLowerCase() !== "pdf") {
          const parsedPath = path.parse(result);
          result = path.join(parsedPath.dir, parsedPath.name + ".pdf");
        }
        pdfMap.set(fileName, result);
        pdf.create(html, {}).toFile(result, function (err) {
          if (!err && result) {
            vscode.window.showInformationMessage(`PDF save to ${result} successfully!`);
            if (vscode.workspace.getConfiguration('JSONResume').get('openPDF')) {
              open(result);
            }
          }
        });
      });
    } else {
      throw new Error();
    }

  } catch (ex) {
    vscode.window.showErrorMessage('Cannot generate PDF!');
  }
}
