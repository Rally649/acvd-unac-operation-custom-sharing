window.onload = function(){
	function setChipsOnAllLayer(areas, chips){
		function create(name, options = {}){
			let element = document.createElement(name);
			Object.keys(options).forEach(key => element[key] = options[key]);
			return element;
		}
		
		function setChips(area, chips, actionAreas = null){
			function createChipAreaElements(){
				let createOption = (value, innerText) => create('option', {value, innerText});
				let createOptgroup = label => create('optgroup', {label});
				let elements = [];
				elements.push(createOption(99, '-'));
				chips.forEach((chip, index) => {
					if (index == 0 || chip.group != chips[index - 1].group){
						elements.push(createOptgroup(chip.group));
					}
					elements.push(createOption(index, chip.name));
				});
				return elements;
			}
			
			function createInput(parameter){
				function createNumberInput(){
					let min = parameter.values[0];
					let max = parameter.values[1];
					let value = parameter.default;
					let isInteger = parameter.default.indexOf('.') == -1;
					let step = isInteger ? 1 : 0.1;
					let range = create('input', {type: 'range', min, max, value, step});
					let input = create('input', {type: 'number', min, max, value, step});
					
					let fix = v => Number.parseFloat(v).toFixed(isInteger ? 0 : 1);
					
					range.onchange = event => {
						input.value = fix(range.value);
						if (event.isTrusted){
							updateURL();
						}
					};
					input.onchange = event => {
						input.value = fix(Math.min(max, Math.max(min, input.value)));
						range.value = input.value
						if (event.isTrusted){
							updateURL();
						}
					};
					
					let div = create('div');
					div.appendChild(range);
					div.appendChild(input);
					return div;
				}
				
				function createStringInput(){
					let select = create('select');
					parameter.values.forEach((value, index) => {
						select.appendChild(create('option', {innerText: value, value: index, selected: value == parameter.default}));
					});
					select.onchange = event => {
						if (event.isTrusted){
							updateURL();
						}
					};
					
					return select;
				}
				
				let isUsedNumberInput = isNumber(parameter.default) && parameter.values.length == 2 && isNumber(parameter.values[0]) && isNumber(parameter.values[1]);
				let input = isUsedNumberInput ? createNumberInput() : createStringInput();
				return input;
			}
			
			function createParameterAreaElement(chip){
				let ul = create('ul');
				chip.parameters.forEach(parameter => {
					let li = create('li');
					let name = create('div', {innerText: parameter.name});
					let input = createInput(parameter);
					li.appendChild(name);
					li.appendChild(input);
					ul.appendChild(li);
				});
				return ul;
			}
			
			let name = area.name;
			let elements = createChipAreaElements();
			elements.forEach(element => name.appendChild(element));
			
			name.onchange = () => {
				area.group.innerText = '';
				area.message.innerText = '';
				Array.from(area.parameter.children).forEach(child => child.remove());
				
				let chip = chips[name.value];
				if (chip){
					area.group.innerText = chip.group;
					area.message.innerText = chip.message;
					let element = createParameterAreaElement(chip);
					area.parameter.appendChild(element);
				}
				if (actionAreas){
					actionAreas.forEach((area, index) => {
						let numberOfChips = chip && chip.numberOfChips || 1;
						area.chip.style.display = index < numberOfChips ? 'block' : 'none';
						if (index >= numberOfChips){
							area.name.value = 99;
							area.name.dispatchEvent(new Event('change'));
						}
					});
				}
				if (event.isTrusted){
					updateURL();
				}
			};
		}
		
		if (areas.operation.chip){
			setChips(areas.operation, chips.operation);
		}
		
		let categories = Object.keys(chips.category);
		categories.forEach(category => {
			setChips(areas.category[category], chips.category[category], areas.action[category]);
			areas.action[category].forEach(area => {
				setChips(area, chips.action[category]);
			});
		});
	}
	
	function updateURL(){
		let getElements = query => Array.from(document.querySelectorAll(query));
		
		let url = new URL(location.origin + location.pathname);
		
		let append = (key, value) => {
			if (value != '' && value != '99'){
				url.searchParams.append(key, value);
			}
		};
		
		let unacComment = document.getElementById('unac-comment').value;
		append('unac-comment', unacComment);
		
		let costs = getElements('#cost1, #cost2, #cost3');
		costs.forEach((cost, i) => append('c' + i, cost.value));
		
		let chipNames = getElements('.name-area');
		chipNames.forEach((name, index) => append('n' + index, name.value));
		
		let parameters = getElements('.parameter-area input[type=number], .parameter-area select');
		append('parameters', parameters.map(p => p.value).join('_'));
		
		append('ver', '1.2');
		
		document.getElementById('url').value = url.href;
	}
	
	function loadJSON(chips){
		function createArea(wholeArea){
			let area = {
				chip      : wholeArea,
				name      : wholeArea && wholeArea.getElementsByClassName('name-area')[0],
				group     : wholeArea && wholeArea.getElementsByClassName('group-area')[0],
				message   : wholeArea && wholeArea.getElementsByClassName('message-area')[0],
				parameter : wholeArea && wholeArea.getElementsByClassName('parameter-area')[0]
			}
			return area;
		}
		
		let patterns = ['pattern1', 'pattern2', 'pattern3'];
		patterns.forEach(pattern => {
			let areas = {category: {}, action: {}};
			
			let operationWholeArea = document.querySelector('#' + pattern + ' .operation .chip-area');
			areas.operation = createArea(operationWholeArea);
			
			let categories = Object.keys(chips.category);
			categories.forEach(category => {
				let categoryWholeArea = document.querySelector('#' + pattern + ' .' + category +' .category .chip-area');
				areas.category[category] = createArea(categoryWholeArea);
				
				let actionWholeAreas = document.querySelectorAll('#' + pattern + ' .' + category +' .action .chip-area');
				areas.action[category] = Array.from(actionWholeAreas).map(area => createArea(area));
			});
			setChipsOnAllLayer(areas, chips);
		});
	}
	
	function loadURL(){
		let setValue = (id, value) => document.getElementById(id).value = value;
		
		let url = new URL(location.href);
		setValue('url', url.href);
		
		let unacComment = url.searchParams.get('unac-comment');
		setValue('unac-comment', unacComment);
		
		let costs = ['c0', 'c1', 'c2'].map(key => url.searchParams.get(key));
		['cost1', 'cost2', 'cost3'].forEach((id, index) => {
			setValue(id, costs[index]);
		});
		document.getElementById('cost1').dispatchEvent(new Event('change'));
		
		let names = Array.from(document.querySelectorAll('.name-area'));
		names.forEach((name, index) => {
			let key = 'n' + index;
			if (url.searchParams.has(key)){
				name.value = url.searchParams.get(key);
				name.dispatchEvent(new Event('change'));
			}
		});
		
		let ver = url.searchParams.get('ver');
		if (ver == '1.2'){
			let parameters = Array.from(document.querySelectorAll('.parameter-area input[type=number], .parameter-area select'));
			if (url.searchParams.has('parameters')){
				url.searchParams.get('parameters').split('_').forEach((value, index) => {
					parameters[index].value = value;
					parameters[index].dispatchEvent(new Event('change'));
				});
			}
		}else if (ver == '1.1'){
			let parameters = Array.from(document.querySelectorAll('.parameter-area input[type=range], .parameter-area input[type=number], .parameter-area select'));
			if (url.searchParams.has('parameters')){
				url.searchParams.get('parameters').split('_').forEach((value, index) => {
					parameters[index].value = value;
					parameters[index].dispatchEvent(new Event('change'));
				});
			}
		}else{
			let parameters = Array.from(document.querySelectorAll('.parameter-area input[type=range], .parameter-area input[type=number], .parameter-area select'));
			parameters.forEach((parameter, index) => {
				let key = 'p' + index;
				parameter.value = url.searchParams.get(key);
			});
		}
		
		updateURL();
	}
	
	var regexp = new RegExp(/^[-]?([1-9]\d*|0)(\.\d+)?$/);
	let isNumber = v => regexp.test(v);
	
	fetch('https://rally649.github.io/acvd-unac-operation-custom-sharing/chips.json').then(response => response.json()).then(chips => {
		loadJSON(chips);
		loadURL();
	});
	
	let unacComment = document.getElementById('unac-comment');
	unacComment.onchange = event => {
		if (event.isTrusted){
			updateURL();
		}
	};
	
	let totalCost = document.getElementById('total-cost');
	let costs = ['cost1', 'cost2', 'cost3'].map(id => document.getElementById(id));
	costs.forEach(cost => {
		cost.onchange = event => {
			let values = costs.filter(cost => isNumber(cost.value)).map(cost => Number.parseInt(cost.value));
			totalCost.value = values.length > 0 ? values.reduce((total, value) => total + value) : 0;
			if (event.isTrusted){
				updateURL();
			}
		};
	});
	
	let copyButton = document.getElementById('copy-button');
	copyButton.onclick = () => {
		let url = document.getElementById('url');
		navigator.clipboard.writeText(url.value).then(() => {
			let message = document.getElementById('copy-button-message');
			message.style.display = 'inline';
			setTimeout(() => {
				message.style.display = 'none';
			}, 2000);
		});
	};
	
	let allDeleteButton = document.getElementById('all-delete-button');
	allDeleteButton.onclick = () => {
		function deleteValues(query, value){
			let elements = Array.from(document.querySelectorAll(query));
			elements.filter(element => element.value != value).forEach(element => {
				element.value = value;
				element.dispatchEvent(new Event('change'));
			});
		}
		
		if (window.confirm('すべての入力を削除しますか？')){
			deleteValues('#unac-comment, #cost1, #cost2, #cost3', '');
			deleteValues('.name-area', '99');
		}
		updateURL();
	};
}
