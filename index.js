window.onload = function(){
	fetch('chips.json').then(
		response => console.log(response.json())
	);
}
