import * as vscode from 'vscode';
import * as parseJsonAST from 'json-to-ast';
const HMR = require('hackmyresume');


function findNode(start:any, p:any):any {
    let el = p[0];
    let rest = p.slice(1);
    if (start.type === "object") {
        for (let i = 0; i < start.properties.length; i++) {
            let prop = start.properties[i];
            if (prop.key.value === el) {
                if (rest.length === 0) {
                    return prop.key.position;
                }
                return findNode(prop.value, rest);
            }
        }
    } else if (start.type === "array") {
        var prop = start.items[el];
        if (rest.length === 0) {
            return prop.position;
        }
        return findNode(prop, rest);
    }
    return {};
}



export async function validate(diagnosticCollection: vscode.DiagnosticCollection, doc: vscode.TextDocument, srcArray:any) {
    diagnosticCollection.delete(doc.uri);
    var root = parseJsonAST(doc.getText());


    let v = new HMR.verbs.validate();
    v.on('hmr:status', function (params:any) {
        if (params.violations) {
            let diagnostics: vscode.Diagnostic[] = [];
            params.violations.forEach((violation:any) => {
                var pathArr = violation.field.replace("data.", "").split(".");
                var node = findNode(root, pathArr);
                let range = new vscode.Range(node.start.line - 1, node.start.column, node.end.line - 1, node.end.column);
                let diagnostic = new vscode.Diagnostic(
                    range, violation.message, vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diagnostic);
            });
            diagnosticCollection.set(doc.uri, diagnostics);
        }
    });
    return v.invoke.call(v, srcArray, {}, function () { });

}
