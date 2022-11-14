

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
    find_files();
}

// ================= function list setting ================= // 

$('.function_item').on('click', function(){
    var function_name = $(this).find('.function_name').val();
    var file_name = $(this).find('.file_name').val();
    
    console.log(function_name + "|" + file_name)
});

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
	var file_name = function_info[1]

	for(var i = 2; i < function_info.length; i++){
		file_name += '<br/>' + function_info[i];
	}

    $('.function_list').append(`
	<li class='function_item'>
		<text class='function_name'>${function_name}</text>
		<div class='divider'></div>
		<text class='file_name'>${file_name}</text>
	</li>`);
}


function find_files(){
	vscode.postMessage({
		command: 'get_files'
	})
}

function find_functions(file_name){

}