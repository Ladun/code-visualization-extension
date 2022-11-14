import { privateEncrypt } from 'crypto';
import * as vscode from 'vscode';

const glob = require('glob');
const path = require('path');
const fs = require('fs');

class SimpleData{
    public idx: number;
    public pos: number;
    public name: string;
    public isFunc: boolean;

    public constructor(idx: number, pos: number, name: string, isFunc: boolean){
        this.idx = idx;
        this.pos = pos;
        this.name = name;
        this.isFunc = isFunc;
    }
}

class Node {

    public file_name: string;
    public func_name: string;

    public regions : Array<SimpleData>;
    public ref_funcs : Array<string>;

    public constructor(file_name: string, func_name: string, regions: Array<SimpleData>, ref_funcs : Array<string>){
        this.file_name = file_name;
        this.func_name = func_name;

        this.regions = [];

        for(var r of regions)
        {
            this.regions.push(r)
        }

        this.ref_funcs = ref_funcs
    }
}

export class Graph {

    private nodes: Map<string, Node> = new Map();

    public update_nodes(target_dir: string, panel: vscode.WebviewPanel) {

        this.nodes.clear();

        glob(target_dir + "/**/*.py", (err: Error, files: Array<string>) => {
            if (err) {
                return console.error(err);
            }

            const def_reg = /def[\s]+[\w]*\(/g;
            const cls_reg = /class[\s]+[\w]*[\(|:]/g;
            const inner_func = /[\w]*\(/g;

            for (var file of files) {
                var filename = path.parse(file).base.trim();

                // get text data from files
                const data = fs.readFileSync(file, 'utf8');
                var lines = data.split(/\r\n|\n/);

                // useful variables
                var stck: Array<SimpleData> = [];
                var funcs: Array<string> = [];
                var idx = 0;
                while (idx < lines.length) {
                    var line = lines[idx];
                                        
                    // Checking is class or function
                    var def_ret = line.match(def_reg);
                    var cls_ret = line.match(cls_reg);
                    if (cls_ret) {
                        var pos = line.indexOf('class');
                        var st = pos + 5;
                        var ed = line.search(/\(|:/);
                        
                        this.add_node(pos, filename, stck, funcs);
                        
                        stck.push(new SimpleData(idx,
                                                 pos, 
                                                 line.substring(st, ed).trim(),
                                                 false));
                    }
                    else if (def_ret) {                      
                        var pos = line.indexOf('def');
                        var st = pos + 3;
                        var ed = line.search(/\(/);

                        this.add_node(pos, filename, stck, funcs);

                        stck.push(new SimpleData(idx,
                                                 pos,
                                                 line.substring(st, ed).trim(),
                                                 true));
                    }
                    else{
                        var inner_ret = line.match(inner_func)
                        if(inner_ret)
                        {
                            for(var ir of inner_ret){
                                funcs.push(ir.substring(ir.length - 1))
                            }
                        }
                    }
                    // function_and_file.push([cur_func_name, filename])
                    idx += 1;
                }
                
                this.add_node(0, filename, stck, funcs);
            }

            this.send_info(panel);
        });
    }

    private add_node(pos: number, filename: string, stck: Array<SimpleData>, funcs: Array<string>){
        while (stck.length > 0 && pos <= stck[stck.length - 1].pos)
        {
            var ret = stck.pop();
            if (ret != null && ret.isFunc){
                var key = ret.name + "-" + filename;
                for(var ref_func of funcs)
                {
                    key += "-" + ref_func
                }
                this.nodes.set(key, new Node(filename, ret.name, stck, funcs));
                funcs = [];
            }
        }
    }

    private send_info(panel: vscode.WebviewPanel) {
        
        var functions : Array<Array<string>> = [];
            
        for(var node of this.nodes)
        {
            var tmp: Array<string> = [];
            
            tmp.push(node[1].func_name)
            tmp.push(node[1].file_name)

            for(var sd of node[1].regions){
                tmp.push(sd.name + " (" + (sd.isFunc? "func" : "class")+ ")")
            }

            functions.push(tmp);
        }

        panel.webview.postMessage({
            command: 'get_files',
            functions: functions
        })
    }
}