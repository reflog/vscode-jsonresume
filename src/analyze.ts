import * as fs from 'fs';
import * as path from 'path';
const HMR = require('hackmyresume');
import * as chalk from 'chalk';
import * as handlebars from 'handlebars';
import * as vscode from 'vscode';

let helpers = require('hackmyresume/dist/helpers/console-helpers');

let rawTpl =
    fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'hackmyresume', 'dist', 'cli', 'analyze.hbs'), 'utf8')
handlebars.registerHelper(helpers);
let template = handlebars.compile(rawTpl, { strict: false, assumeObjects: false });

export async function analyze(analysisOutputChannel: vscode.OutputChannel, srcArray: string[]) {
    analysisOutputChannel.show(true);
    let v = new HMR.verbs.analyze();
    v.on('hmr:status', function (params:any) {
        if (params.info) {
            let tot = 0
            params.info.keywords.forEach((g:any) => tot += g.count);
            params.info.keywords.totalKeywords = tot;
            let output = template(params.info);
            analysisOutputChannel.append(chalk.cyan(output));
        }
    });
    return v.invoke.call(v, srcArray, {}, function () { });
}