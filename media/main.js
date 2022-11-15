import { Node } from "./node.js";

const vscode = acquireVsCodeApi();
const menu_area = $(".menu_area")
const refresh = $(".refresh")

$('.toggle').toggleClass('active');
menu_area.toggleClass('active');
// ================= default setting ================= //

window.addEventListener('message', event => {

	const message = event.data; // The JSON data our extension sent

	switch (message.command) {
		case 'get_files':
			$('.function_list').empty();

			message.functions.forEach(file => {
				add_function_list(file);
			});
			
			refresh.toggleClass("active");
			refresh.find('i').attr('class', 'bx bx-refresh');
			break;
		case 'get_node_info':
			draw_nodes(message.node_info);
			break;
	}
});

menu_area.draggable({
	start: function(event, ui){
		$(this).data('dragging', true);
	},
	stop: function(event, ui){
		setTimeout(function(){
			$(event.target).data('dragging', false);
		}, 1);
	}
});

$(".fold").on('click', function(){
	if(menu_area.data('dragging')) 
        return;

	$('.toggle').toggleClass('active');
	menu_area.toggleClass('active');
});

refresh.on('click', update_list);

function update_list(){
	if(refresh.hasClass('active'))
		return;

	refresh.toggleClass("active");
	refresh.find('i').attr('class', 'bx bx-loader-alt');
    find_functions();
}

// ================= function list setting ================= // 

$('.search').change(()=>{
	var target_t = $('.search').val();
	var children = $('.function_list').children();

	children.each((idx, val) => {
		
		$(val).removeClass('display_none');
		
		if (target_t.length >= 1){
			var function_name = $(val).find('.function_name').text();
			var file_name = $(val).find('.file_name').text();
			
			if (!function_name.includes(target_t) && 
				!file_name.includes(target_t))
			{
				$(val).attr('class', 'display_none ' + $(val).attr('class'));
			}
		}
	});

});

function add_function_list(function_info){
	var function_name = function_info[0]

	// Create new list content
	const newListContent = $(`
		<li class='function_item'>
			<text class='function_name'>${function_name}</text>
			<div class='divider'></div>
			<div class='regions'></div>
			
		</li>`);

	// Add click event
	newListContent.on('click', function(){
		var function_name = $(this).find('.function_name').text();
		var regions = $(this).find('.file_name').get();
		
		var key = function_name;
		for(var _s of regions){
			var region = _s.innerHTML;
			var tmpIdx = region.indexOf('(');
			
			if (tmpIdx > 0)
				region = region.substring(0, tmpIdx).trim();
			
			key += "-" + region;
		}

		vscode.postMessage({
			command: 'get_node_info',
			key: key
		})
	});

	// Add infomation about where the function is
	for(var i = 1; i < function_info.length; i++){
		newListContent.children('.regions').append(
			`<text class='file_name'>${function_info[i]}</text>`
		)
	}
	
	// Add list content to list
	$('.function_list').append(newListContent);
}


function find_functions(){
	vscode.postMessage({
		command: 'get_files'
	})
}

function draw_nodes(node_infos){
	console.log("Draw Node");
	console.log(node_infos);

	var x = 10, y = 10;

	// Create main node
	var mainNode = draw_node(node_infos[0], x, y);
	var prevNode = mainNode;

	for(var i = 1; i < node_infos.length; i++){
		y += 30;
		var curNode = draw_node(node_infos[i], x, y);
		
		prevNode = curNode;
	}
}

function draw_node(info, x, y){
	var info = info.split(",");
	var node = new Node(info[0])
	
	node.moveTo({x: x, y: y});
	node.initUI();
	return node;
}