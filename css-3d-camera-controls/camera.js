let root = document.querySelector(".uniform")

function bindCamera(){
	let cameraScale

	window.addEventListener('mousedown', e => setupEvents(e))
	window.addEventListener('mouseup', e => removeEvents(e))
	window.addEventListener('wheel', e => {
		e.preventDefault()
		cameraScale = grabCSSData().scale
		cameraScale += e.deltaY * -0.1
		cameraScale = Math.min(Math.max(0.1, cameraScale), 10)
		root.style.setProperty("--camera-scale", `${cameraScale}`)
	})
}

function setupEvents(e){
	let startingPoint = retrieveCoords(e)
	let currentData = grabCSSData()
	let currentPoint = {x: 0, y: 0}
	let differenceX, differenceY, scaleX

	// 1366 * 768 is the workspace dimensions and 
	// 6 is the ideal divider to produce smoother 
	// drag experience
	let force = ((1366 * 768) / 6)

	// since we've got the force value, we map it 
	// to window's dimensions
	let multiplier = Math.max(1, (window.innerWidth * window.innerHeight) / force)

	root.setAttribute("data-no-transition", "1")

	window.onmousemove = e => {
		e.preventDefault()

		currentPoint = retrieveCoords(e)
		differenceX = (startingPoint.x - currentPoint.x) / multiplier
		differenceY = (startingPoint.y - currentPoint.y) / multiplier
		scalarDifference = ((startingPoint.x - currentPoint.x) + (startingPoint.y - currentPoint.y))
		if(e.ctrlKey){
			root.style.setProperty("--translate-X", `${currentData.translateX - differenceX}`)
			root.style.setProperty("--translate-Z", `${currentData.translateZ + differenceY}`)
		}
		else if(e.altKey){
			root.style.setProperty("--translate-Y", `${currentData.translateY + differenceX}`)
		}
		else if(e.shiftKey){
			currentPerspective = currentData.perspective + scalarDifference
			currentPerspective = Math.min(Math.max(100, currentPerspective), 10000)
			root.style.setProperty("--camera-perspective", `${currentPerspective}`)
		}
		else{
			root.style.setProperty("--camera-Z", `${currentData.rotateX + differenceX}`)
			root.style.setProperty("--camera-Y", `${currentData.rotateY + differenceY}`)
		}
	}
}

function removeEvents(){
	window.onmousemove = null
	root.setAttribute("data-no-transition", "0")
}

function retrieveCoords(e){
	return {x: e.pageX, y: e.pageY}
}

function grabCSSData(){
	let CSSD = getComputedStyle(root)
	let pull = (property) => Number(CSSD.getPropertyValue(property))

	return {
		rotateX: pull('--camera-Z'),
		rotateY: pull('--camera-Y'),
		translateX: pull('--translate-X'),
		translateY: pull('--translate-Y'),
		translateZ: pull('--translate-Z'),
		scale: pull('--camera-scale'),
		perspective: pull('--camera-perspective')
	}
}

window.addEventListener('load', () => bindCamera())