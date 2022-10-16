/*
 * FlexSlider Plus v0.0.1
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith, Erik
 */
import { defaults } from './defaults';
import { hasTouch } from './utils/compat';

import ControlNav from './components/controlNav';
import AsNav from './components/asNav';
import { PausePlay, PauseInvisible } from './components/pausePlay';
import DirectionNav from './components/directionNav';

import touchHandler from './components/touchHandler';

export let focused = true;

/** @typedef {string} eventType events that triggers changes (space separated) */
export const eventType = 'click touchend keyup';

export function throwError( message ) {
	throw new Error( 'Flexslider: ' + message );
}

window.customElements.define( 'pause-play', PausePlay );
window.customElements.define( 'direction-nav', DirectionNav );

/**
 * @typedef {Object|throwError} slider
 * @property {boolean}        animating          the animations is running
 * @property {number}         currentSlide       the current slide
 * @property {number}         animatingTo        the animation target slide
 * @property {boolean}        atEnd              the slider has reach the end
 * @property {string}         containerSelector  the slider container class
 * @property {HTMLElement}    container          the slider container element
 * @property {HTMLCollection} slides             the slider sliders elements
 * @property {number}         count              the number of slides
 * @property {number}         itemsPerRow        the number of items per row
 * @property {boolean}        syncExists         thumbnail sync requested
 * @property {string}         animation          the animation type
 * @property {string}         prop               the slider properties to decide what kind of vendor-prefixed version to use... this needs to be removed since not useful
 * @property {Object}         args               the slider arguments
 * @property {boolean}        manualPause        the slider has been paused
 * @property {boolean}        stopped            the slider has been stopped
 * @property {boolean}        started            the slider is running
 * @property {number}         startTimeout       the time before enable the slider
 * @property {boolean}        isFirefox          the current browser is firefox
 * @property {boolean}        ensureAnimationEnd the animation has ended
 *
 */

/**
 * setStyle
 * "Set the style of an element to the given style."
 *
 * The function takes two arguments: an element and a style. The style is an object that contains CSS properties and values. The function uses the Object.assign() method to copy the properties and values from the style object to the element's
 * style object
 *
 * @param {HTMLElement} element - The element to set the style on.
 * @param {Object}      style   - An object containing the styles to be applied to the element.
 */
export const setStyle = function ( element, style ) {
	Object.assign( element.style, style );
};

/**
 * @class flexslider
 */
class flexslider {
	/**
	 * @typedef {import('./defaults.js').defaults} FlexsliderDefaults
	 */

	/**
	 *
	 * @param    {HTMLElement}              el             - the slider
	 * @param    {FlexsliderDefaults|false} options        - the slider options
	 *
	 * @property {slider}                   slider         - the slider html element
	 * @property {FlexsliderDefaults|false} options        - the slider options
	 * @property {string}                   namespace      - the name
	 *
	 * @property {Object|false}             touch          - touch events enabled/disabled
	 * @property {string}                   eventType      - the events that fires changes
	 * @property {boolean}                  vertical       - the slide direction is vertical instead of horizontal (to not be confused with navigation bar that is always horizontal at the moment)
	 * @property {boolean}                  reverse        - the slider direction
	 *
	 * @property {Object|false}             carousel       - the carousel (allows multiple slides at once)
	 *
	 * @property {Object}                   AsNav          - if is the navigation bar
	 *
	 * @property {HTMLElement}              controlNavEl   - the controlNav Element
	 * @property {Object}                   controlNav     - the object that contain the controlNav
	 *
	 * @property {Object}                   pausePlay      - the pause play button element that controls the slider playback
	 * @property {Object}                   pauseInvisible - pause when invisible
	 *
	 * @property {Object}                   directionNav   - the object that contain the directionNav
	 *
	 * @property {string}                   watchedEvent   - in the name of the event we are waiting for
	 */
	constructor( el, options = false ) {
		this.slider = el || throwError( 'cannot find ' + options.selector );

		this.options = this.initOptions( options || {} );
		this.namespace = this.options.namespace;

		this.touch =
			hasTouch && this.options.touch ? new touchHandler() : false;

		this.reverse = this.options.reverse;
		this.carousel = this.options.itemWidth > 0;

		this.asNav =
			this.options.asNavFor !== '' &&
			new AsNav( this.namespace, this.slider );

		// 👇 Since this could be used selected we can create it with the class construtor
		this.controlNavEl = '';
		this.controlNav = this.options.controlNav
			? new ControlNav( this.namespace, this.slider, this.options )
			: null;

		this.pausePlay = new PausePlay( this.namespace, this.slider );
		this.pauseInvisible = new PauseInvisible();
		this.directionNav = new DirectionNav();

		this.watchedEvent = '';

		console.log( this.options );

		//FlexSlider: Initialize on load
		this.init();
	}

	initOptions( options ) {
		// if rtl value was not passed and html is in rtl... enable it by default.
		if ( typeof options.rtl === 'undefined' && document.dir === 'rtl' ) {
			options.rtl = true;
		}
		return { ...defaults, ...options };
	}

	init() {
		//this.slider.src = this.slider.getAttribute( 'data-src' );
		//this.slider.srcset = this.slider.getAttribute( 'data-srcset' );
		//this.slider.removeAttribute( 'dataset' );
		//this.slider.removeAttribute( 'data-src' );
		//this.slider.removeAttribute( 'data-srcset' );

		// Get current slide and make sure it is a number, for convenience since it's used more than once
		const startAt = parseInt( this.options.startAt, 10 ) || 0;

		/** @type {slider} slideOpt */
		const slideOpt = {
			animating: false,
			currentSlide: startAt,
			animatingTo: startAt,
			atEnd: startAt || startAt === this.slider.last,
			containerSelector: this.options.selector.split( '>' ),
			container: this.slider.querySelector(
				this.options.selector.split( '>' )[ 0 ]
			),
			slides: this.slider.querySelectorAll( this.options.selector ),
			count: this.slider.querySelectorAll( this.options.selector ).length,
			itemsPerRow: parseInt( this.slider.dataset.columns ),
			// SYNC:
			syncExists: !! this.options.sync,
			animation: this.options.animation === 'slide' ? 'swing' : '',
			// TODO: simplify here
			// eslint-disable-next-line no-nested-ternary
			prop: this.options.vertical
				? 'top'
				: this.options.rtl
				? 'marginRight'
				: 'marginLeft',
			args: {},
			// SLIDESHOW:
			manualPause: false,
			stopped: false,
			//PAUSE WHEN INVISIBLE
			started: false,
			startTimeout: null,
			isFirefox:
				window.navigator.userAgent.toLowerCase().indexOf( 'firefox' ) >
				-1,
			ensureAnimationEnd: '',
		};

		Object.assign( this.slider, slideOpt );

		if ( ! Number.isFinite( this.slider.currentSlide ) ) {
			this.slider.currentSlide = 0;
		}

		// SLIDE:
		if ( this.options.animation === 'slide' ) {
			this.options.animation = 'swing';
		}

		// TOUCH/USECSS:
		this.slider.transitions =
			! this.options.video &&
			! this.options.animation === 'fade' &&
			this.options.useCSS &&
			( function ( slider ) {
				const obj = document.createElement( 'div' ),
					props = [
						'perspectiveProperty',
						'WebkitPerspective',
						'MozPerspective',
						'OPerspective',
						'msPerspective',
					];
				for ( const i in props ) {
					if ( obj.style[ props[ i ] ] !== undefined ) {
						slider.pfx = props[ i ]
							.replace( 'Perspective', '' )
							.toLowerCase();
						slider.prop = '-' + slider.pfx + '-transform';
						return true;
					}
				}
				return false;
			} )( this.slider );

		// CONTROLSCONTAINER:
		if ( this.options.controlsContainer !== '' )
			this.slider.controlsContainer =
				this.options.controlsContainer &&
				document.querySelector( this.options.controlsContainer );

		// MANUAL:
		if ( this.options.manualControls !== '' )
			this.slider.manualControls =
				this.options.manualControls &&
				document.querySelector( this.options.manualControls );

		// CUSTOM DIRECTION NAV:
		// TODO: this needs to be fixed, I doubt that it works
		if ( this.options.customDirectionNav !== '' )
			this.slider.customDirectionNav =
				this.options.customDirectionNav.length === 2 &&
				document.querySelectorAll( this.options.customDirectionNav );

		// RANDOMIZE:
		if ( this.options.randomize ) {
			this.slider.slides.sort( function () {
				return Math.round( Math.random() ) - 0.5;
			} );
			this.slider.container.empty().append( this.slider.slides );
		}

		this.doMath();

		// INIT
		this.setup( 'init' );

		// CONTROL-NAV:
		if ( this.options.controlNav ) {
			this.controlNav.setup();
		}

		// DIRECTION-NAV:
		if ( this.options.directionNav ) {
			this.directionNav.setup();
		}

		// KEYBOARD:
		if (
			this.options.keyboard &&
			// TODO: 👇 fix because it's a huge loss of time that isn't necessary
			( this.slider.querySelector( this.slider.containerSelector )
				.length > 0 ||
				this.options.multipleKeyboard )
		) {
			document.onkeyup = ( event ) => {
				const keycode = event.key;
				const reversed = this.options.rtl;
				let target;

				if ( ! this.slider.animating && keycode ) {
					switch ( event.key ) {
						case 'Right': // IE/Edge specific value
						case 'ArrowRight':
							target = this.slider.getTarget(
								reversed ? 'next' : 'prev'
							);
							break;
						case 'Left': // IE/Edge specific value
						case 'ArrowLeft':
							target = this.slider.getTarget(
								reversed ? 'prev' : 'next'
							);
							break;
						default:
							target = function ( e, delta ) {
								e.preventDefault();
								if ( delta < 0 ) {
									target = this.slider.getTarget( 'next' );
								} else {
									target = this.slider.getTarget( 'prev' );
								}
							};
							break;
					}
				}
				this.flexAnimate( target, this.options.pauseOnAction );
			};

			// PAUSEPLAY
			if ( this.options.pausePlay ) {
				this.pausePlay.setup();
			}

			//PAUSE WHEN INVISIBLE
			if ( this.options.slideshow && this.options.pauseInvisible ) {
				this.pauseInvisible.init();
			}

			// SLIDSESHOW
			if ( this.options.slideshow ) {
				if ( this.options.pauseOnHover ) {
					this.slider
						.on( 'mouseenter', function () {
							if (
								! this.slider.manualPlay &&
								! this.slider.manualPause
							) {
								this.pause();
							}
						} )
						.on( 'mouseleave', function () {
							if (
								! this.slider.manualPause &&
								! this.slider.manualPlay &&
								! this.slider.stopped
							) {
								this.play();
							}
						} );
				}
				// initialize animation
				//If we're visible, or we don't use PageVisibility API
				if (
					! this.options.pauseInvisible ||
					! this.pauseInvisible.isHidden()
				) {
					this.options.initDelay > 0
						? ( this.slider.startTimeout = setTimeout(
								this.play,
								this.options.initDelay
						  ) )
						: this.play();
				}
			}

			// ASNAV:
			if ( AsNav ) {
				this.asNav.setup();
			}

			// TOUCH
			if ( this.touch && this.options.touch ) {
				this.touch.init();
			}

			// FADE&&SMOOTHHEIGHT || SLIDE:
			if (
				! this.options.animation === 'fade' ||
				( this.options.animation === 'fade' &&
					this.options.smoothHeight )
			) {
				$( window ).on( 'resize orientationchange focus', this.resize );
			}

			this.slider.find( 'img' ).attr( 'draggable', 'false' );

			setTimeout( function () {
				this.start();
			}, 200 );
		}
	}

	resize() {
		if ( ! this.slider.animating && this.slider.is( ':visible' ) ) {
			if ( ! this.carousel ) {
				this.slider.doMath();
			}

			if ( this.options.animation === 'fade' ) {
				// SMOOTH HEIGHT:
				this.smoothHeight();
			} else if ( this.carousel ) {
				//CAROUSEL:
				this.slider.slides.width( this.slider.computedW );
				this.update( this.slider.pagingCount );
				this.setProps();
			} else if ( this.options.direction === 'vertical' ) {
				//VERTICAL:
				this.slider.viewport.height( this.slider.computedW );
				this.slider.newSlides.css( {
					width: this.slider.computedW,
					height: this.slider.computedW,
				} );
				if ( this.options.smoothHeight ) {
					this.smoothHeight();
				}
				this.setProps( this.slider.computedW, 'setTotal' );
			} else {
				// SMOOTH HEIGHT:
				this.slider.newSlides.width( this.slider.computedW );
				if ( this.options.smoothHeight ) {
					this.smoothHeight();
				}
				this.setProps( this.slider.computedW, 'setTotal' );
			}
		}
	}

	smoothHeight( dur ) {
		if (
			! this.options.direction === 'vertical' ||
			this.options.animation === 'fade'
		) {
			const $obj =
				this.options.animation === 'fade'
					? this.slider.container
					: this.slider.viewport;
			if ( dur ) {
				$obj.animate(
					{
						height: this.slider.slides
							.eq( this.slider.animatingTo )
							.innerHeight(),
					},
					dur
				);
			} else {
				$obj.innerHeight(
					this.slider.slides
						.eq( this.slider.animatingTo )
						.innerHeight()
				);
			}
		}
	}

	sync( action ) {
		const $obj = $( this.options.sync ).data( 'flexslider' ),
			target = this.slider.animatingTo;

		switch ( action ) {
			case 'animate':
				$obj.flexAnimate(
					target,
					this.options.pauseOnAction,
					false,
					true
				);
				break;
			case 'play':
				if ( ! $obj.playing && ! $obj.asNav ) {
					$obj.play();
				}
				break;
			case 'pause':
				$obj.pause();
				break;
		}
	}

	uniqueID( $clone ) {
		// Append _clone to current level and children elements with id attributes
		$clone
			.filter( '[id]' )
			.add( $clone.find( '[id]' ) )
			.each( function () {
				const $this = $( this );
				$this.attr( 'id', $this.attr( 'id' ) + '_clone' );
			} );
		return $clone;
	}

	setToClearWatchedEvent = () => {
		clearTimeout( this.watchedEventClearTimer );
		this.watchedEventClearTimer = setTimeout( function () {
			this.watchedEvent = '';
		}, 3000 );
	};

	// public methods
	flexAnimate = function ( target, pause, override, withSync, fromNav ) {
		if (
			! this.options.animationLoop &&
			target !== this.slider.currentSlide
		) {
			this.slider.direction =
				target > this.slider.currentSlide ? 'next' : 'prev';
		}

		if ( this.asNav && this.slider.pagingCount === 1 )
			this.slider.direction =
				this.slider.currentItem < target ? 'next' : 'prev';

		if (
			! this.slider.animating &&
			( this.slider.canAdvance( target, fromNav ) || override ) &&
			this.slider.is( ':visible' )
		) {
			if ( this.asNav && withSync ) {
				const master = $( this.options.asNavFor ).data( 'flexslider' );
				this.slider.atEnd =
					target === 0 || target === this.slider.count - 1;
				master.flexAnimate( target, true, false, true, fromNav );
				this.slider.direction =
					this.slider.currentItem < target ? 'next' : 'prev';
				master.direction = this.slider.direction;

				if (
					Math.ceil( ( target + 1 ) / this.slider.visible ) - 1 !==
						this.slider.currentSlide &&
					target !== 0
				) {
					this.slider.currentItem = target;
					this.slider.slides
						.removeClass( this.namespace + 'active-slide' )
						.eq( target )
						.addClass( this.namespace + 'active-slide' );
					target = Math.floor( target / this.slider.visible );
				} else {
					this.slider.currentItem = target;
					this.slider.slides
						.removeClass( this.namespace + 'active-slide' )
						.eq( target )
						.addClass( this.namespace + 'active-slide' );
					return false;
				}
			}

			this.slider.animating = true;
			this.slider.animatingTo = target;

			// SLIDESHOW:
			if ( pause ) {
				this.slider.pause();
			}

			// API: before() animation Callback
			this.options.before( this.slider );

			// SYNC:
			if ( this.slider.syncExists && ! fromNav ) {
				this.sync( 'animate' );
			}

			// CONTROLNAV
			if ( this.options.controlNav ) {
				this.controlNav.active();
			}

			// !CAROUSEL:
			// CANDIDATE: slide active class (for add/remove slide)
			if ( ! this.carousel ) {
				this.slider.slides
					.removeClass( this.namespace + 'active-slide' )
					.eq( target )
					.addClass( this.namespace + 'active-slide' );
			}

			// INFINITE LOOP:
			// CANDIDATE: atEnd
			this.slider.atEnd = target === 0 || target === this.slider.last;

			// DIRECTIONNAV:
			this.directionNav.update();

			if ( target === this.slider.last ) {
				// API: end() of cycle Callback
				this.options.end( this.slider );
				// SLIDESHOW && !INFINITE LOOP:
				if ( ! this.options.animationLoop ) {
					this.slider.pause();
				}
			}

			// SLIDE:
			if ( ! this.options.animation === 'fade' ) {
				const dimension =
					this.options.direction === 'vertical'
						? this.slider.slides[ 0 ].getBoundingClientRect().height
						: this.slider.computedW;
				let margin;
				let slideString;
				let calcNext;

				// INFINITE LOOP / REVERSE:
				if ( this.carousel ) {
					margin = this.options.itemMargin;
					calcNext =
						( this.slider.itemW + margin ) *
						this.slider.move *
						this.slider.animatingTo;
					slideString =
						calcNext > this.slider.limit &&
						this.slider.visible !== 1
							? this.slider.limit
							: calcNext;
				} else if (
					this.slider.currentSlide === 0 &&
					target === this.slider.count - 1 &&
					this.options.animationLoop &&
					this.slider.direction !== 'next'
				) {
					slideString = this.reverse
						? ( this.slider.count + this.slider.cloneOffset ) *
						  dimension
						: 0;
				} else if (
					this.slider.currentSlide === this.slider.last &&
					target === 0 &&
					this.options.animationLoop &&
					this.slider.direction !== 'prev'
				) {
					slideString = this.reverse
						? 0
						: ( this.slider.count + 1 ) * dimension;
				} else {
					slideString = this.reverse
						? ( this.slider.count -
								1 -
								target +
								this.slider.cloneOffset ) *
						  dimension
						: ( target + this.slider.cloneOffset ) * dimension;
				}
				this.slider.setProps(
					slideString,
					'',
					this.options.animationSpeed
				);
				if ( this.slider.transitions ) {
					if ( ! this.options.animationLoop || ! this.slider.atEnd ) {
						this.slider.animating = false;
						this.slider.currentSlide = this.slider.animatingTo;
					}

					// Unbind previous transitionEnd events and re-bind new transitionEnd event
					this.slider.container.off(
						'webkitTransitionEnd transitionend'
					);
					this.slider.container.on(
						'webkitTransitionEnd transitionend',
						function () {
							clearTimeout( this.slider.ensureAnimationEnd );
							this.slider.wrapup( dimension );
						}
					);

					// Insurance for the ever-so-fickle transitionEnd event
					clearTimeout( this.slider.ensureAnimationEnd );
					this.slider.ensureAnimationEnd = setTimeout( function () {
						this.slider.wrapup( dimension );
					}, this.options.animationSpeed + 100 );
				} else {
					this.slider.container.animate(
						this.slider.args,
						this.options.animationSpeed,
						this.options.easing,
						function () {
							this.slider.wrapup( dimension );
						}
					);
				}
			} else {
				// FADE:
				if ( ! this.touch ) {
					this.slider.slides
						.eq( this.slider.currentSlide )
						.css( { zIndex: 1 } )
						.animate(
							{ opacity: 0 },
							this.options.animationSpeed,
							this.options.easing
						);
					this.slider.slides
						.eq( target )
						.css( { zIndex: 2 } )
						.animate(
							{ opacity: 1 },
							this.options.animationSpeed,
							this.options.easing,
							this.slider.wrapup
						);
				} else {
					this.slider.slides
						.eq( this.slider.currentSlide )
						.css( { opacity: 0, zIndex: 1 } );
					this.slider.slides
						.eq( target )
						.css( { opacity: 1, zIndex: 2 } );
					this.slider.wrapup( dimension );
				}
			}
			// SMOOTH HEIGHT:
			if ( this.options.smoothHeight ) {
				this.smoothHeight( this.options.animationSpeed );
			}
		}
	};

	wrapup = function ( dimension ) {
		// SLIDE:
		if ( ! this.options.animation === 'fade' && ! this.carousel ) {
			if (
				this.slider.currentSlide === 0 &&
				this.slider.animatingTo === this.slider.last &&
				this.options.animationLoop
			) {
				this.slider.setProps( dimension, 'jumpEnd' );
			} else if (
				this.slider.currentSlide === this.slider.last &&
				this.slider.animatingTo === 0 &&
				this.options.animationLoop
			) {
				this.slider.setProps( dimension, 'jumpStart' );
			}
		}
		this.slider.animating = false;
		this.slider.currentSlide = this.slider.animatingTo;
		// API: after() animation Callback
		this.options.after( this.slider );
	};

	// SLIDESHOW:
	animateSlides = function () {
		if ( ! this.slider.animating && focused ) {
			this.slider.flexAnimate( this.slider.getTarget( 'next' ) );
		}
	};

	// SLIDESHOW:
	pause = function () {
		clearInterval( this.slider.animatedSlides );
		this.slider.animatedSlides = null;
		this.slider.playing = false;
		// PAUSEPLAY:
		if ( this.options.pausePlay ) {
			this.pausePlay.update( 'play' );
		}
		// SYNC:
		if ( this.slider.syncExists ) {
			this.sync( 'pause' );
		}
	};
	// SLIDESHOW:
	play = function () {
		if ( this.slider.playing ) {
			clearInterval( this.slider.animatedSlides );
		}
		this.slider.animatedSlides =
			this.slider.animatedSlides ||
			setInterval(
				this.slider.animateSlides,
				this.options.slideshowSpeed
			);
		this.slider.started = this.slider.playing = true;
		// PAUSEPLAY:
		if ( this.options.pausePlay ) {
			this.pausePlay.update( 'pause' );
		}
		// SYNC:
		if ( this.slider.syncExists ) {
			this.sync( 'play' );
		}
	};
	// STOP:
	stop() {
		this.pause();
		this.slider.stopped = true;
	}

	canAdvance( target, fromNav ) {
		// ASNAV:
		const last = AsNav ? this.slider.pagingCount - 1 : this.slider.last;
		return fromNav
			? true
			: this.asNav &&
			  this.slider.currentItem === this.slider.count - 1 &&
			  target === 0 &&
			  this.slider.direction === 'prev'
			? true
			: this.asNav &&
			  this.slider.currentItem === 0 &&
			  target === this.slider.pagingCount - 1 &&
			  this.slider.direction !== 'next'
			? false
			: target === this.slider.currentSlide && ! AsNav
			? false
			: this.options.animationLoop
			? true
			: this.slider.atEnd &&
			  this.slider.currentSlide === 0 &&
			  target === last &&
			  this.slider.direction !== 'next'
			? false
			: this.slider.atEnd &&
			  this.slider.currentSlide === last &&
			  target === 0 &&
			  this.slider.direction === 'next'
			? false
			: true;
	}

	getTarget( dir ) {
		this.slider.direction = dir;
		if ( dir === 'next' ) {
			return this.slider.currentSlide === this.slider.last
				? 0
				: this.slider.currentSlide + 1;
		}
		return this.slider.currentSlide === 0
			? this.slider.last
			: this.slider.currentSlide - 1;
	}

	posCalc( pos, special, posCheck ) {
		if ( this.carousel ) {
			return special === 'setTouch'
				? pos
				: this.reverse && this.slider.animatingTo === this.slider.last
				? 0
				: this.reverse
				? this.slider.limit -
				  ( this.slider.itemW + this.options.itemMargin ) *
						this.slider.move *
						this.slider.animatingTo
				: this.slider.animatingTo === this.slider.last
				? this.slider.limit
				: posCheck;
		}
		switch ( special ) {
			case 'setTotal':
				return this.reverse
					? ( this.slider.count -
							1 -
							this.slider.currentSlide +
							this.slider.cloneOffset ) *
							pos
					: ( this.slider.currentSlide + this.slider.cloneOffset ) *
							pos;
			case 'setTouch':
				return this.reverse ? pos : pos;
			case 'jumpEnd':
				return this.reverse ? pos : this.slider.count * pos;
			case 'jumpStart':
				return this.reverse ? this.slider.count * pos : pos;
			default:
				return pos;
		}
	}

	// SLIDE:
	setProps( pos, special, dur ) {
		let target = () => {
			const posCheck = pos
				? pos
				: ( this.slider.itemW + this.options.itemMargin ) *
				  this.slider.move *
				  this.slider.animatingTo;

			console.log( posCheck );

			return (
				this.posCalc( pos, special, posCheck ) *
					( this.options.rtl ? 1 : -1 ) +
				'px'
			);
		};

		if ( this.slider.transitions ) {
			target =
				this.options.direction === 'vertical'
					? 'translate3d(0,' + target + ',0)'
					: 'translate3d(' + ( parseInt( target ) + 'px' ) + ',0,0)';
			dur = dur !== undefined ? dur / 1000 + 's' : '0s';
			this.slider.container.css(
				'-' + this.slider.pfx + '-transition-duration',
				dur
			);
			this.slider.container.css( 'transition-duration', dur );
		}

		this.slider.args[ this.slider.prop ] = target;
		if ( this.slider.transitions || dur === undefined ) {
			// TODO: changed but not sure - in this case can be simplified
			this.slider.container.style.transform = target;
		}

		this.slider.container.style.transform = target;
	}

	/**
	 * @param {string} type
	 */
	setup( type ) {
		// Object.values( this.slider.slides )
		// 	.slice( 1 )
		// 	.forEach( ( slide ) => {
		// 		if ( document.readyState !== 'complete' ) {
		// 			const img = slide.querySelector( 'img' );
		// 			img.dataset.src = img.attr( 'src' );
		// 			img.dataset.srcset = img.attr( 'srcset' );
		// 			img.removeAttribute( 'src' );
		// 			img.removeAttribute( 'srcset' );
		// 			img.classList.add( 'flexslider-deferred' );
		// 		}
		// 	} );
		// SLIDE:
		if ( this.options.animation !== 'fade' ) {
			let arr;

			if ( type === 'init' ) {
				this.slider.viewport = ! this.options.manualControls
					? document.createElement( 'div' )
					: document.querySelector( this.options.viewport );

				this.slider.viewport.classList.add(
					this.namespace + 'viewport'
				);

				this.slider.viewport.append( this.slider.container );
				this.slider.append( this.slider.viewport );

				setStyle( this.slider.viewport, {
					overflow: 'hidden',
					position: 'relative',
				} );

				// INFINITE LOOP:
				this.slider.cloneCount = 0;
				this.slider.cloneOffset = 0;

				// REVERSE:
				if ( this.reverse ) {
					arr = [].slice.call( this.slider.slides ).reverse();
					this.slider.slides = arr;
					this.slider.container.empty().append( this.slider.slides );
				}
			}

			// INFINITE LOOP && !CAROUSEL:
			if ( this.options.animationLoop && ! this.carousel ) {
				this.slider.cloneCount = 2;
				this.slider.cloneOffset = 1;
				// clear out old clones
				if ( type !== 'init' ) {
					this.slider.container.querySelector( '.clone' ).remove();
				}
				this.slider.container
					.append(
						this.uniqueID(
							this.slider.slides
								.first()
								.clone()
								.addClass( 'clone' )
						).attr( 'aria-hidden', 'true' )
					)
					.prepend(
						this.uniqueID(
							this.slider.slides
								.last()
								.clone()
								.addClass( 'clone' )
						).attr( 'aria-hidden', 'true' )
					);
			}

			this.slider.newSlides = this.slider.querySelector(
				this.options.selector
			);

			const sliderOffset = this.reverse
				? this.slider.count -
				  1 -
				  this.slider.currentSlide +
				  this.slider.cloneOffset
				: this.slider.currentSlide + this.slider.cloneOffset;

			this.doMath();

			// VERTICAL:
			if ( this.options.direction === 'vertical' && ! this.carousel ) {
				this.slider.viewport.style.height = this.slider.h;
				this.slider.newSlides.forEach( ( slide ) =>
					setStyle( slide, {
						display: 'block',
						width: this.slider.computedW,
						height: this.slider.computedW,
					} )
				);
				setStyle( this.slider.container, {
					height:
						( this.slider.count + this.slider.cloneCount ) * 200 +
						'%',
					position: 'absolute',
					width: '100%',
				} );
				this.setProps( sliderOffset * this.slider.h, 'init' );
			} else {
				if ( type === 'init' )
					setStyle( this.slider.viewport, {
						height: this.slider.h,
						overflowX: 'hidden',
					} );
				Object.values( this.slider.newSlides ).forEach( ( slide ) => {
					setStyle( slide, {
						width: this.slider.computedW,
						marginRight: this.slider.computedM,
						float: this.options.rtl ? 'right' : 'left',
						display: 'block',
					} );
				} );
				setStyle( this.slider.container, {
					height: '',
					width:
						( this.slider.count + this.slider.cloneCount ) * 200 +
						'%',
				} );
				this.setProps( sliderOffset * this.slider.computedW, 'init' );
				setTimeout(
					() => {
						// SMOOTH HEIGHT:
						if ( this.options.smoothHeight ) {
							this.smoothHeight();
						}
					},
					type === 'init' ? 100 : 0
				);
			}
		} else {
			// FADE:
			if ( this.options.rtl ) {
				setStyle( this.slider.slides, {
					width: '100%',
					float: 'right',
					marginLeft: '-100%',
					position: 'relative',
				} );
			} else {
				setStyle( this.slider.slides, {
					width: '100%',
					float: 'left',
					marginRight: '-100%',
					position: 'relative',
				} );
			}
			if ( type === 'init' ) {
				if ( ! this.touch ) {
					//this.slider.slides.eq(this.slider.currentSlide).fadeIn(this.options.animationSpeed, this.options.easing);
					if ( ! this.options.fadeFirstSlide ) {
						setStyle( this.slider.slides, {
							opacity: 1,
							display: 'block',
							zIndex: 1,
						} );
					} else {
						setStyle( this.slider.slides, {
							opacity: 0,
							display: 'block',
							zIndex: 1,
						} );
						this.slider.slides[ this.slider.currentSlide ].animate(
							{ opacity: 1 },
							this.options.animationSpeed,
							this.options.easing
						);
					}
				} else {
					Object.values( this.slider.slides ).forEach( ( slide ) => {
						setStyle( slide, {
							opacity: 0,
							display: 'block',
							webkitTransition:
								'opacity ' + this.options.fadeFirstSlide
									? 1
									: this.options.animationSpeed / 1000 +
									  's ease',
							zIndex: 1,
						} );
					} );
					this.slider.slides[
						this.slider.currentSlide
					].css.opacity = 1;
				}
			}
			// SMOOTH HEIGHT:
			if ( this.options.smoothHeight ) {
				this.smoothHeight();
			}
		}

		// !CAROUSEL:
		// CANDIDATE: active slide
		if ( ! this.carousel ) {
			this.slider.slides.forEach( ( slide ) => {
				slide.classList.remove( this.namespace + 'active-slide' );
			} );
			this.slider.slides[ this.slider.currentSlide ].classList.add(
				this.namespace + 'active-slide'
			);
		}

		//FlexSlider: init() Callback
		this.options.init( this.slider );
	}

	doMath() {
		const slide = [ ...this.slider.slides ].shift(),
			slideMargin = this.options.itemMargin,
			minItems = this.options.minItems,
			maxItems = this.options.maxItems;

		const sliderBBox = this.slider.getBoundingClientRect();
		const slideBBox = slide.getBoundingClientRect();

		this.slider.w =
			this.slider.viewport === undefined
				? sliderBBox.width
				: this.slider.viewport.getBoundingClientRect().width;
		// TODO: this is an handler for a firefox exception...but this is still needed in 2022?
		if ( this.slider.isFirefox ) {
			this.slider.w = sliderBBox.width;
		}
		this.slider.h = slideBBox.height;
		this.slider.boxPadding = slideBBox.outerWidth - slideBBox.width;
		this.slider.firstRowCount =
			this.slider.itemsPerRow > this.slider.count
				? this.slider.itemsPerRow
				: Math.min( this.slider.itemsPerRow, this.slider.count );
		this.slider.navItemSize = Math.round(
			this.slider.w / this.slider.firstRowCount
		);
		// CAROUSEL:
		if ( this.carousel ) {
			this.slider.itemT = this.options.itemWidth + slideMargin;
			this.slider.itemM = slideMargin;
			this.slider.minW = minItems
				? minItems * this.slider.itemT
				: this.slider.w;
			this.slider.maxW = maxItems
				? maxItems * this.slider.itemT - slideMargin
				: this.slider.w;
			this.slider.itemW =
				this.slider.minW > this.slider.w
					? ( this.slider.w - slideMargin * ( minItems - 1 ) ) /
					  minItems
					: this.slider.maxW < this.slider.w
					? ( this.slider.w - slideMargin * ( maxItems - 1 ) ) /
					  maxItems
					: this.options.itemWidth > this.slider.w
					? this.slider.w
					: this.options.itemWidth;

			this.slider.visible = Math.floor(
				this.slider.w / this.slider.itemW
			);
			this.slider.move =
				this.options.move > 0 && this.options.move < this.slider.visible
					? this.options.move
					: this.slider.visible;
			this.slider.pagingCount = Math.ceil(
				( this.slider.count - this.slider.visible ) / this.slider.move +
					1
			);
			this.slider.last = this.slider.pagingCount - 1;
			this.slider.limit =
				this.slider.pagingCount === 1
					? 0
					: this.options.itemWidth > this.slider.w
					? this.slider.itemW * ( this.slider.count - 1 ) +
					  slideMargin * ( this.slider.count - 1 )
					: ( this.slider.itemW + slideMargin ) * this.slider.count -
					  this.slider.w -
					  slideMargin;
		} else {
			this.slider.itemW = this.slider.w;
			this.slider.itemM = slideMargin;
			this.slider.pagingCount = this.slider.count;
			this.slider.last = this.slider.count - 1;
		}
		this.slider.computedW = this.slider.itemW - this.slider.boxPadding;
		this.slider.computedM = this.slider.itemM;
	}

	update = function ( pos, action ) {
		this.slider.doMath();

		// update currentSlide and this.slider.animatingTo if necessary
		if ( ! this.carousel ) {
			if ( pos < this.slider.currentSlide ) {
				this.slider.currentSlide += 1;
			} else if ( pos <= this.slider.currentSlide && pos !== 0 ) {
				this.slider.currentSlide -= 1;
			}
			this.slider.animatingTo = this.slider.currentSlide;
		}

		// update controlNav
		if ( this.options.controlNav && ! this.slider.manualControls ) {
			if (
				( action === 'add' && ! this.carousel ) ||
				this.slider.pagingCount > this.slider.controlNav.length
			) {
				this.controlNav.update( 'add' );
			} else if (
				( action === 'remove' && ! this.carousel ) ||
				this.slider.pagingCount < this.slider.controlNav.length
			) {
				if (
					this.carousel &&
					this.slider.currentSlide > this.slider.last
				) {
					this.slider.currentSlide -= 1;
					this.slider.animatingTo -= 1;
				}
				this.controlNav.update( 'remove', this.slider.last );
			}
		}

		// update directionNav
		// TODO: not sure this is needed anymore
		if ( this.options.directionNav.bind( this.options ) ) {
			// this.directionNav.bind( this ).update();
		}
	};

	addSlide = function ( obj, pos ) {
		const $obj = $( obj );

		this.slider.count += 1;
		this.slider.last = this.slider.count - 1;

		// append new slide
		if ( this.options.direction === 'vertical' && this.reverse ) {
			pos !== undefined
				? this.slider.slides.eq( this.slider.count - pos ).after( $obj )
				: this.slider.container.prepend( $obj );
		} else {
			pos !== undefined
				? this.slider.slides.eq( pos ).before( $obj )
				: this.slider.container.append( $obj );
		}

		// update currentSlide, animatingTo, controlNav, and directionNav
		this.slider.update( pos, 'add' );

		// update this.slider.slides
		this.slider.slides = $(
			this.options.selector + ':not(.clone)',
			this.slider
		);
		// re-setup the this.slider to accomdate new slide
		this.slider.setup();

		//FlexSlider: added() Callback
		this.options.added( this.slider );
	};

	removeSlide = function ( obj ) {
		const pos = isNaN( obj ) ? this.slider.slides.index( $( obj ) ) : obj;

		// update count
		this.slider.count -= 1;
		this.slider.last = this.slider.count - 1;

		// remove slide
		if ( isNaN( obj ) ) {
			this.slider.slides.querySelector( obj ).remove();
		} else {
			this.options.vertical && this.options.reverse
				? this.slider.slides[ this.slider.last ].remove()
				: this.slider.slides[ obj ].remove();
		}

		// update currentSlide, animatingTo, controlNav, and directionNav
		this.slider.doMath();
		this.slider.update( pos, 'remove' );

		// update this.slider.slides
		this.slider.slides = this.slider.querySelectorAll(
			this.options.selector + ':not(.clone)'
		);
		// re-setup the this.slider to accomdate new slide
		this.slider.setup();

		// FlexSlider: removed() Callback
		this.options.removed( this.slider );
	};
}

// Ensure the this.slider isn't focused if the window loses focus.
window.onblur = () => {
	focused = false;
};
window.onfocus = () => {
	focused = true;
};

// Compat with the old jquery initialization
( function ( $ ) {
	$.fn.flexslider = function ( args ) {
		return new flexslider( this[ 0 ], args );
	};
} )( jQuery );

window.onload = () => {
	const sliders = document.querySelectorAll( '.flexslider-plus' );

	return sliders.forEach( ( slider ) => {
		// get the slides
		const selector =
			slider.options && slider.options.selector
				? slider.options.selector
				: '.slides li';
		const slides = slider.querySelectorAll( selector );
		if (
			typeof slider.options === 'undefined' ||
			slider.options.allowOneSlide === true ||
			slides.length === 0
		) {
			// if the slider has no options set initialize it
			slider.flexslider = ( options = {} ) => {
				new flexslider( slider, options );
			};
		} else {
			// the slider has a single item
			// TODO: check the allowOneSlide option
			// slider.fadeIn( 0 );
			// TODO: show the images slides if not displayed or hidden
			// if ( slider.options.start ) {
			// 	slider.options.start( slider );
			// }
		}
	} );
};

//FlexSlider: Plugin Function
window.flexsliderApi = function ( options ) {
	// TODO: for each slider collected add to flexsliderApi the object. i guess in this way we don't even need to provide the shortcuts below

	if ( options.slider === undefined || typeof options !== 'object' ) {
		options = {};
	}

	// TODO: for the sake of the convenience i've temporary fixed in this way the api but needs to be reworked
	switch ( options.slider ) {
		case 'play':
			options.slider.play();
			break;
		case 'pause':
			options.slider.pause();
			break;
		case 'stop':
			options.slider.stop();
			break;
		case 'next':
			options.slider.flexAnimate(
				options.slider.getTarget( 'next' ),
				true
			);
			break;
		case 'prev':
		case 'previous':
			options.slider.flexAnimate(
				options.slider.getTarget( 'prev' ),
				true
			);
			break;
		default:
			if ( typeof options === 'number' ) {
				options.slider.flexAnimate( options, true );
			}
	}
};
