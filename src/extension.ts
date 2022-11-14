// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MainViewPanel } from './windowPanel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "code-visualization" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('code-visualization.visualize', () => {
			MainViewPanel.createOrShow(context);
		})
	)

	context.subscriptions.push(vscode.commands.registerCommand('code-visualization.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from code_visualization!');
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}
