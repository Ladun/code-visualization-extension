import { privateEncrypt } from "crypto";
import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { Graph } from "./node";

const glob = require("glob")
const path = require('path')
const fs = require('fs')

export class MainViewPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: MainViewPanel | undefined;

	public static readonly viewType = "main_view";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _graph: Graph;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(context: vscode.ExtensionContext) {
		const extensionUri = context.extensionUri;
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (MainViewPanel.currentPanel) {
			MainViewPanel.currentPanel._panel.reveal(column);
			MainViewPanel.currentPanel._update();
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			MainViewPanel.viewType,
			"Code Flow",
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [
					vscode.Uri.joinPath(extensionUri, "media")
				],
			}
		);

		MainViewPanel.currentPanel = new MainViewPanel(panel, extensionUri);
	}

	public static kill() {
		MainViewPanel.currentPanel?.dispose();
		MainViewPanel.currentPanel = undefined;
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		MainViewPanel.currentPanel = new MainViewPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._graph = new Graph();

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'get_files':
						this._graph.update_nodes("e:/Dev/Project/BigBlobEye/AI/src/algo/ag_classifier", this._panel);
						return;
				}
			},
			null,
			this._disposables
		)
	}

	public dispose() {
		MainViewPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async _update() {
		const webview = this._panel.webview;

		this._panel.webview.html = this._getHtmlForWebview(webview);
		webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "onInfo": {
					if (!data.value) {
						return;
					}
					vscode.window.showInformationMessage(data.value);
					break;
				}
				case "onError": {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// // And the uri we use to load this script in the webview
		const scriptNodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "node.js")
		);
		const scriptMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
		);

		// Uri to load styles into webview
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
		);
		const styleNodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "node.css")
		);
		const styleMenuUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "menu.css")
		);
		// // Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->

        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleNodeUri}" rel="stylesheet">
        <link href="${styleMenuUri}" rel="stylesheet">
        <link href='https://unpkg.com/boxicons@2.1.2/css/boxicons.min.css' rel='stylesheet'>  
        <script nonce="${nonce}">
        </script>
		</head>
		<body>   
			<div class="menu_area">
				<div class="toggle">
				<div class="refresh">
					<i class='bx bx-refresh'></i>
				</div>
				<input type='text' class='search'>
				<div class="fold">
					<i class='bx bx-cross'></i>
				</div>
				</div>                    
				
				<div class="view">
				<div class="scroll_area">
					<ul class='function_list'></ul>
				</div>
				</div>
			</div>
			<div class="draw_area">
				<svg id="svg">
				</svg>
			</div>
		</body>

		<script src="http://code.jquery.com/jquery-latest.js"></script>         
		<script
			src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"
			integrity="sha512-uto9mlQzrs59VwILcLiRYeLKPPbS/bT71da/OEBYEwcdNUk8jYIy+D176RYoop1Da+f9mvkYrmj5MCLZWEtQuA=="
			crossorigin="anonymous"
			referrerpolicy="no-referrer"
		></script>
		<script src="${scriptNodeUri}" nonce="${nonce}"></script>
		<script src="${scriptMainUri}" nonce="${nonce}"></script>
		</html>`;
	}
}