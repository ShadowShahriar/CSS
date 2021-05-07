// head function
class CameraController{
	constructor(root = 'div.uniform'){
		this.rootSelector = root
		this.root = document.querySelector(root)
		this.shouldChangePointers = this.isMobile() && this.hasTouch()
		this.pointerEvents = null

		this.mousePointerEvents = {
			press: 'mousedown',
			drag: 'mousemove',
			drop: 'mouseup'
		}
		this.touchPointerEvents = {
			press: 'touchstart',
			drag: 'touchmove',
			drop: 'touchend'
		}

		this.changePointers()
		this.bindDefaultEvents()
		console.log(this)
	}

	distance(x, y){
		return Math.sqrt( ((x[0] - x[1]) ** 2) + ((y[0] - y[1]) ** 2) )
	}

	/* determine if the browser is viewed in a mobile device */
	isMobile(){
		return !!`${navigator.userAgent}`.match(/mobile/ig)
	}

	/* determine if the device supports touch events */
	hasTouch(){
		return !!window.matchMedia("(hover: none)").matches
	}

	changePointers(){
		this.pointerEvents = this.shouldChangePointers ? this.touchPointerEvents : this.mousePointerEvents
	}

	/* returns the current mouse coordinates */
	retrieveCoords(e){
		let coords = { x: e.pageX, y: e.pageY }
		if(this.shouldChangePointers)
			coords = { x: e.touches[0].pageX, y: e.touches[0].pageY }

		return coords
	}

	/* retrieve CSS properties from the root element and get variable values */
	retrieveCSSData(){
		let CSSD = getComputedStyle(this.root)
		let pull = property => Number(CSSD.getPropertyValue(property))
	
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

	bindDefaultEvents(){
		let that = this
		window.addEventListener(this.pointerEvents.press, e => that.setEvents(e))
		window.addEventListener(this.pointerEvents.drop, e => that.removeEvents(e))
		document.documentElement.addEventListener('touchmove', e => e.preventDefault(), { passive: false })
		window.addEventListener('wheel', e => that.setWheel(e))
	}

	setWheel(e){
		e.preventDefault()

		let cameraScale = this.retrieveCSSData().scale
		cameraScale += e.deltaY * -0.1
		cameraScale = Math.min(Math.max(0.1, cameraScale), 10)
		;(this.root).style.setProperty("--camera-scale", `${cameraScale}`)
	}

	setEvents(e){
		e.preventDefault()

		let startingPoint = this.retrieveCoords(e)
		let currentData = this.retrieveCSSData()
		let currentPoint = {x: 0, y: 0}
		let that = this
		let root = that.root
		let rootStyles = root.style
		let differenceX, differenceY, distance, currentPerspective

		// 1366 * 768 is the workspace dimensions and 
		// 6 is the ideal divider to produce smoother 
		// drag experience
		let force = ((1366 * 768) / 6)

		// since we've got the force value, we map it 
		// to window's dimensions
		let multiplier = Math.max(1, (window.innerWidth * window.innerHeight) / force)

		// add an attribute that disables CSS transitions
		this.root.setAttribute("data-no-transition", "1")

		// add the drag event
		window[`on${this.pointerEvents.drag}`] = e => {
			e.preventDefault()

			currentPoint = that.retrieveCoords(e)
			differenceX = (startingPoint.x - currentPoint.x) / multiplier
			differenceY = (startingPoint.y - currentPoint.y) / multiplier
			distance = (startingPoint.x - currentPoint.x) + (startingPoint.y - currentPoint.y)

			if(!that.shouldChangePointers && e.shiftKey){
				currentPerspective = currentData.perspective + distance
				currentPerspective = Math.min(Math.max(100, currentPerspective), 10000)
				rootStyles.setProperty("--camera-perspective", `${currentPerspective}`)
			}
			else if(!that.shouldChangePointers && e.ctrlKey){
				rootStyles.setProperty("--translate-X", `${currentData.translateX - differenceX}`)
				rootStyles.setProperty("--translate-Z", `${currentData.translateZ + differenceY}`)
			}
			else if(!that.shouldChangePointers && e.altKey){
				rootStyles.setProperty("--translate-Y", `${currentData.translateY + differenceX}`)
			}
			else{
				rootStyles.setProperty("--camera-Z", `${currentData.rotateX + differenceX}`)
				rootStyles.setProperty("--camera-Y", `${currentData.rotateY + differenceY}`)
			}
		}

		console.log("All events are set, good to go!")
	}

	removeEvents(e){
		window[`on${this.pointerEvents.drag}`] = null
		this.root.setAttribute("data-no-transition", "0")
		console.log("Events released")
	}
}

window.addEventListener('load', () => {
	new CameraController()
})