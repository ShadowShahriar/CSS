class CameraController{
	constructor(root = 'div.uniform'){
		this.root = document.querySelector(root)
		this.rootSelector = root
		this.triggerChanges = () => {}
		this.eventCache = []
		this.historyDifference = -1
		this.removeCacheEvent = e => {
			for(let i = 0; i < this.eventCache.length; i++){
				if (this.eventCache[i].pointerId == e.pointerId){
					this.eventCache.splice(i, 1)
					break
				}
			}
		}
		this.updateCacheEvents = e => {
			for(let i = 0; i < this.eventCache.length; i++){
				if(e.pointerId == this.eventCache[i].pointerId){
					this.eventCache[i] = e
					break
				}
			}
		}

		this.defaults = {
			allowIsolation: false,

			rotate: {
				axisX: true,
				rangeX: true, // [0, 360]
				axisY: true,
				rangeY: true,
				speed: 1,
			},

			pan: {
				axisX: true,
				rangeX: [-9216, 9216],
				axisY: true,
				rangeY: [-9216, 9216],
				axisZ: true,
				rangeZ: [-9216, 9216],
				speed: 4,
			},

			zoom: {
				wheel: true,
				pinch: true,
				min: 0.1,
				max: 16,
				pinchSpeed: 2,
				wheelSpeed: 0.5,
				wheelMaxSpeed: 1.5,
			},

			perspective: {
				min: 100,
				max: 10000,
				speed: 2,
			}
		}
	}

	/* calculates linear distance between two points */
	distance(x, y){
		return Math.sqrt( ((x[0] - x[1]) ** 2) + ((y[0] - y[1]) ** 2) )
	}

	clamp(min, preference, max){
		return Math.min(Math.max(min, preference), max)
	}

	/* returns the current mouse coordinates */
	retrieveCoords(e){
		return { x: e.pageX, y: e.pageY }
	}

	/* retrieve CSS properties from the root element and get the property values */
	retrieveCSSData(){
		let CSSData = getComputedStyle(this.root)
		let pull = property => Number(CSSData.getPropertyValue(property))
	
		return {
			rotateX: pull('--camera-Z'),
			rotateY: pull('--camera-Y'),
			translateX: pull('--translate-X'),
			translateY: pull('--translate-Y'),
			translateZ: pull('--translate-Z'),
			scale: pull('--camera-scale'),
			perspective: pull('--camera-perspective'),
		}
	}

	/* blends default values with user defined ones */
	handles(config){
		let blend = subproperty => {
			if(config[subproperty])
				this.defaults[subproperty] = {...this.defaults[subproperty], ...config[subproperty]}
		}

		blend('rotate')
		blend('pan')
		blend('zoom')
		blend('perspective')

		return this
	}

	start(){
		let that = this
		window.addEventListener('pointerdown', e => that.setEvents(e))
		window.addEventListener('pointerup', e => that.removeEvents(e))
		window.addEventListener('wheel', e => that.triggerScale(e, 'wheel'))
	}

	triggerScale(e, method){
		e.preventDefault()
		let currentScale = this.retrieveCSSData().scale

		if(this.defaults.zoom.wheel && method === 'wheel'){

			let scaleSpeed = this.defaults.zoom.wheelSpeed
			if(e.ctrlKey) scaleSpeed = this.defaults.zoom.wheelMaxSpeed

			currentScale += e.deltaY * (-0.1 * scaleSpeed)
			currentScale = Math.min(Math.max(this.defaults.zoom.min, currentScale), this.defaults.zoom.max)
			;(this.root).style.setProperty("--camera-scale", `${currentScale}`)
		}
	}

	setEvents(e){
		if(this.defaults.allowIsolation && e.target.dataset['isolated'] === '')
			return console.info("Isolated content, gestures won't work")

		this.eventCache.push(e)

		let startingPoint = this.retrieveCoords(e)
		let currentData = this.retrieveCSSData()
		let currentPoint = {x: 0, y: 0}
		let that = this
		let root = that.root
		let rootStyles = root.style
		let differenceX, differenceY

		// 1366 * 768 is the workspace dimensions and 
		// 6 is the ideal divider to produce smoother 
		// drag experience
		let force = ((1366 * 768) / 6)

		// since we've got the force value, we map it 
		// to window's dimensions
		let multiplier = Math.max(1, (window.innerWidth * window.innerHeight) / force)

		// add an attribute that disables CSS transitions
		this.root.setAttribute("data-no-transition", "1")

		let distance, currentPerspective, currentRotateX, currentRotateY, currentTranslateX, currentTranslateY, currentTranslateZ

		this.triggerChanges = e => {
			e.target.setPointerCapture(e.pointerId)
			this.updateCacheEvents(e)

			// if(this.eventCache.length === 2){
			// 	let currentDifference = Math.abs(this.eventCache[0].clientX - this.eventCache[1].clientX);

			// 	if(this.historyDifference > 0){
			// 		if(currentDifference > this.historyDifference){
			// 			this.root.style.background = "pink"
			// 		}
			// 		if(currentDifference < this.historyDifference){
			// 			this.root.style.background = "lightblue"
			// 		}
			// 	}

			// 	this.historyDifference = currentDifference;
			// 	return console.log("pinch")
			// }

			currentPoint = that.retrieveCoords(e)
			differenceX = (startingPoint.x - currentPoint.x) / multiplier
			differenceY = (startingPoint.y - currentPoint.y) / multiplier
			distance = (startingPoint.x - currentPoint.x) + (startingPoint.y - currentPoint.y)

			let updateRotateX = () => {
				currentRotateX = currentData.rotateX + (differenceX * this.defaults.rotate.speed)
				if(this.defaults.rotate.rangeX !== true)
					currentRotateX = this.clamp(this.defaults.rotate.rangeX[0], currentRotateX, this.defaults.rotate.rangeX[1])
				rootStyles.setProperty("--camera-Z", `${currentRotateX}`)
			}

			let updateRotateY = () => {
				currentRotateY = currentData.rotateY + (differenceY * this.defaults.rotate.speed)
				if(this.defaults.rotate.rangeY !== true)
					currentRotateY = this.clamp(this.defaults.rotate.rangeY[0], currentRotateY, this.defaults.rotate.rangeY[1])
				rootStyles.setProperty("--camera-Y", `${currentRotateY}`)
			}

			let updatePerspective = () => {
				currentPerspective = currentData.perspective + (distance * this.defaults.perspective.speed)
				currentPerspective = this.clamp(this.defaults.perspective.min, currentPerspective, this.defaults.perspective.max)
				rootStyles.setProperty("--camera-perspective", `${currentPerspective}`)
			}

			let updateTranslateX = () => {
				currentTranslateX = currentData.translateX - (differenceX * this.defaults.pan.speed)
				currentTranslateX = this.clamp(this.defaults.pan.rangeX[0], currentTranslateX, this.defaults.pan.rangeX[1])
				rootStyles.setProperty("--translate-X", `${currentTranslateX}`)
			}

			let updateTranslateY = () => {
				currentTranslateY = currentData.translateY + (differenceX * this.defaults.pan.speed)
				currentTranslateY = this.clamp(this.defaults.pan.rangeY[0], currentTranslateY, this.defaults.pan.rangeY[1])
				rootStyles.setProperty("--translate-Y", `${currentTranslateY}`)
			}

			let updateTranslateZ = () => {
				currentTranslateZ = currentData.translateZ + (differenceY * this.defaults.pan.speed)
				currentTranslateZ = this.clamp(this.defaults.pan.rangeZ[0], currentTranslateZ, this.defaults.pan.rangeZ[1])
				rootStyles.setProperty("--translate-Z", `${currentTranslateZ}`)
			}

			if(e.shiftKey){
				updatePerspective()
			}
			else if(e.ctrlKey){
				if(this.defaults.pan.axisX) updateTranslateX()
				if(this.defaults.pan.axisZ) updateTranslateZ()
			}
			else if(e.altKey){
				if(this.defaults.pan.axisY) updateTranslateY()
			}
			else{
				if(this.defaults.rotate.axisX) updateRotateX()
				if(this.defaults.rotate.axisY) updateRotateY()
			}
		}

		// add event to respond to drag
		window.addEventListener('pointermove', this.triggerChanges)
		console.log("All events are set, good to go!")
	}

	removeEvents(e){
		this.removeCacheEvent(e)
		this.eventCache = []

		// remove the attribute that disables CSS transitions
		this.root.setAttribute("data-no-transition", "0")

		// remove the event that responds to drag
		window.removeEventListener('pointermove', this.triggerChanges)
		console.log("Events released")

		if(this.eventCache.length < 2)
			this.historyDifference = -1
	}
}

window.addEventListener('load', () => {
	new CameraController()
		.handles({
			rotate: {
				axisX: false,
				speed: 1
			},

			zoom: {
				wheel: true
			}
		})
		.start()
})