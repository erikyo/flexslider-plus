import { eventType } from '../index';

export class PausePlay extends HTMLElement {
	constructor( namespace, slider ) {
		super();
		this.namespace = namespace;
		this.slider = slider;
		this.innerHTML = `<div class="${ this.namespace }pauseplay"><a href="#"></a></div>`;
	}

	setup() {
		// Add this and it will start working

		// CONTROLSCONTAINER:
		if ( this.slider.controlsContainer ) {
			this.slider.controlsContainer.append( this );
			( this.slider.pausePlay = '.' + this.namespace + 'pauseplay a' ),
				this.slider.controlsContainer;
		} else {
			this.slider.append( this );
			( this.slider.pausePlay = '.' + this.namespace + 'pauseplay a' ),
				this.slider;
		}

		this.update(
			this.options.slideshow
				? this.namespace + 'pause'
				: this.namespace + 'play'
		);

		eventType.split( ' ' ).forEach( function ( ev ) {
			this.addEventListener( ev, function ( event ) {
				event.preventDefault();

				if (
					this.watchedEvent === '' ||
					this.watchedEvent === event.type
				) {
					if ( this.classList.contains( this.namespace + 'pause' ) ) {
						this.slider.manualPause = true;
						this.slider.manualPlay = false;
						this.pause();
					} else {
						this.slider.manualPause = false;
						this.slider.manualPlay = true;
						this.slider.play();
					}
				}

				// setup flags to prevent event duplication
				if ( this.watchedEvent === '' ) {
					this.watchedEvent = event.type;
				}
				this.setToClearWatchedEvent();
			} );
		} );
	}

	update( state ) {
		state === 'play'
			? this.slider.PausePlay.removeClass( this.namespace + 'pause' )
					.addClass( this.namespace + 'play' )
					.html( this.options.playText )
			: this.slider.PausePlay.removeClass( this.namespace + 'play' )
					.addClass( this.namespace + 'pause' )
					.html( this.options.pauseText );
	}
}

export class PauseInvisible {
	constructor() {
		this.visProp = null;
	}

	init() {
		this.visProp = this.getHiddenProp();
		if ( this.visProp ) {
			const evtname =
				this.visProp.replace( /[H|h]idden/, '' ) + 'visibilitychange';
			document.addEventListener( evtname, function () {
				if ( this.isHidden() ) {
					if ( this.slider.startTimeout ) {
						clearTimeout( this.slider.startTimeout ); //If clock is ticking, stop timer and prevent from starting while invisible
					} else {
						this.pause(); //Or just pause
					}
				} else if ( this.slider.started ) {
					this.play(); //Initiated before, just play
				} else if ( this.options.initDelay > 0 ) {
					setTimeout( this.slider.play, this.options.initDelay );
				} else {
					this.play(); //Didn't init before: simply init or wait for it
				}
			} );
		}
	}

	isHidden() {
		const prop = this.getHiddenProp();
		if ( ! prop ) {
			return false;
		}
		return document[ prop ];
	}

	getHiddenProp() {
		const prefixes = [ 'webkit', 'moz', 'ms', 'o' ];
		// if 'hidden' is natively supported just return it
		if ( 'hidden' in document ) {
			return 'hidden';
		}
		// otherwise loop over all the known prefixes until we find one
		for ( let i = 0; i < prefixes.length; i++ ) {
			if ( prefixes[ i ] + 'Hidden' in document ) {
				return prefixes[ i ] + 'Hidden';
			}
		}
		// otherwise it's not supported
		return null;
	}
}
