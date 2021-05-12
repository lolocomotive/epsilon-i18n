import * as vscode from 'vscode';
import * as path from 'path';
let channel: vscode.OutputChannel;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    channel = vscode.window.createOutputChannel('Epsilon I18n');
    diagnosticCollection =
        vscode.languages.createDiagnosticCollection('epsilon-i18n');

    context.subscriptions.push(diagnosticCollection);

    const collection = vscode.languages.createDiagnosticCollection('test');
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((editor) => {
            if (editor) {
                updateDiagnostics(editor.document, collection);
            }
        })
    );
}

function updateDiagnostics(
    document: vscode.TextDocument,
    collection: vscode.DiagnosticCollection
): void {
    if (document.languageId !== 'epsilon-i18n') {
        return;
    }
    var diagnostics: vscode.Diagnostic[] = [];
    for (var lineNr = 0; lineNr < document.lineCount; lineNr++) {
        var line = document.lineAt(lineNr).text;
        var regexCorrect = /^(\w+)\s*=\s*\"((?:\\\"|(?:(?!\").))*)\"$/g;
        var regexWordsAfter = /^(\w+)\s*=\s*\"((?:\\\"|(?:(?!\").))*)\"/g;
        var regexCorrect = /^(\w+)\s*=\s*\"((?:\\\"|(?:(?!\").))*)\"$/g;
        var diagnostic = {
            code: '',
            message: 'Invalid line',
            range: new vscode.Range(
                new vscode.Position(lineNr, 0),
                new vscode.Position(lineNr, line.length)
            ),
            severity: vscode.DiagnosticSeverity.Error,
            source: '',
        };
        if (line.startsWith('#') || regexCorrect.test(line)) {
            continue;
        }
        if (regexWordsAfter.test(line)) {
            diagnostic.message += ': Unexpected characters after end of string';
            var end = line.match(
                /(?<=^.*\s*=\s*\"((?:\\\"|(?:(?!\").))*)\").*$/g
            );
            if (end === null) {
                break;
            }
            diagnostic.range = new vscode.Range(
                new vscode.Position(lineNr, line.length - end[0].length),
                new vscode.Position(lineNr, line.length)
            );
        }
        if (!/=/g.test(line)) {
            diagnostic.message += ': No equals sign';
        }
        quotTest: if (!/"/g.test(line)) {
            diagnostic.message = 'Invalid value: No quotation marks';
            var valueArr = line.match(/(?<==).*/g);
            if (valueArr === null) {
                break quotTest;
            }
            diagnostic.range = new vscode.Range(
                new vscode.Position(lineNr, line.length - valueArr[0].length),
                new vscode.Position(lineNr, line.length)
            );
        } else {
            var keyArr = line.match(/.*(?==)/g);
            if (keyArr === null) {
                break;
            }
            var key: string = '';
            for (var t of keyArr) {
                key += t;
            }
            channel.appendLine(key);
            if (key !== null) {
                if (key.length > 0) {
                    if (!/^[ -~]+$/.test(key)) {
                        diagnostic.message =
                            'Invalid key: Non-ASCII character in key';
                        diagnostic.range = new vscode.Range(
                            new vscode.Position(lineNr, 0),
                            new vscode.Position(lineNr, key.length)
                        );
                    } else if (/\s(\w+)/g.test(key)) {
                        diagnostic.message =
                            'Invalid key: Spaces are not allowed in keys';
                        diagnostic.range = new vscode.Range(
                            new vscode.Position(lineNr, 0),
                            new vscode.Position(lineNr, key.length)
                        );
                    }
                }
            }
        }
        if (
            line.replace(/\s*/g, '').length === 0 &&
            lineNr !== document.lineCount - 1
        ) {
            diagnostic.message = 'Empty Line';
        } else {
            continue;
        }

        diagnostics.push(diagnostic);
    }
    collection.set(document.uri, diagnostics);
}
// this method is called when your extension is deactivated
export function deactivate() {}
