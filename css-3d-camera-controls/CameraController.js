class CameraController{
	constructor(root = 'div.uniform'){
		this.root = document.querySelector(root)
		this.rootSelector = root
		this.triggerChanges = () => {}

		this.defaults = {
			allowIsolation: true,

			rotate: {
				axisX: true,
				rangeX: [0, 360],
				axisY: true,
				rangeY: [0, 360],
				speed: 1,
			},

			pan: {
				axisX: true,
				rangeX: [-9216, 9216],
				axisY: true,
				rangeY: [-9216, 9216],
				axisZ: true,
				rangeZ: [-9216, 9216],
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

		if(this.defaults.zoom.wheel && method === 'wheel'){
			let currentScale = this.retrieveCSSData().scale

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
		let force = ((1366 * 768) / 6) / this.defaults.rotate.speed

		// since we've got the force value, we map it 
		// to window's dimensions
		let multiplier = Math.max(1, (window.innerWidth * window.innerHeight) / force)

		// add an attribute that disables CSS transitions
		this.root.setAttribute("data-no-transition", "1")

		this.triggerChanges = e => {
			e.target.setPointerCapture(e.pointerId)

			console.log('A')
		}

		// add event to respond to drag
		window.addEventListener('pointermove', this.triggerChanges)
		console.log("All events are set, good to go!")
	}

	removeEvents(e){
		// remove the attribute that disables CSS transitions
		this.root.setAttribute("data-no-transition", "0")

		// remove the event that responds to drag
		window.removeEventListener('pointermove', this.triggerChanges)
		console.log("Events released")
	}
}

window.addEventListener('load', () => {
	new CameraController()
		.handles({
			rotate: {
				axisX: false,
				speed: 40
			},

			zoom: {
				wheel: true
			}
		})
		.start()
})