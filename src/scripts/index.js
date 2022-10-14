/*
 * FlexSlider Plus v0.0.1
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith, Erik
 */
import { defaults } from './defaults';

let focused = true;

class flexslider {
	constructor( el, options ) {
		this.options = this.initOptions( options );

		// the slider element
		this.slider =
			document.querySelector( el ) || this.throwError( 'cannot find ' );

		this.namespace = this.options.namespace;
		this.touch = 'ontouchstart' in window && this.options.touch;
		this.eventType = 'click touchend keyup';
		this.watchedEvent = '';
		this.vertical = this.options.direction === 'vertical';
		this.reverse = this.options.reverse;
		this.carousel = this.options.itemWidth > 0;
		this.fade = this.options.animation === 'fade';
		this.asNav = this.options.asNavFor !== '';

		//FlexSlider: Initialize on load
		this.init();
	}

	throwError( message ) {
		throw new Error( message );
	}

	initOptions( options ) {
		// if rtl value was not passed and html is in rtl... enable it by default.
		if ( typeof options.rtl === 'undefined' && document.dir === 'rtl' ) {
			options.rtl = true;
		}
		return { ...defaults, ...options };
	}

	init() {
		this.slider.src = this.slider.getAttribute( 'data-src' );
		this.slider.srcset = this.slider.getAttribute( 'data-srcset' );
		this.slider.removeAttribute( 'dataset' );
		this.slider.removeAttribute( 'data-src' );
		this.slider.removeAttribute( 'data-srcset' );

		this.slider = {
			animating: false,
			// Get current slide and make sure it is a number
			currentSlide: parseInt( this.options.startAt, 10 ) || 0,
			animatingTo: this.slider.currentSlide,
			atEnd:
				this.slider.currentSlide === 0 ||
				this.slider.currentSlide === this.slider.last,
			containerSelector: this.options.selector.substring(
				0,
				this.options.selector.search( ' ' )
			),
			slides: $( this.options.selector, this.slider ),
			container: $( this.slider.containerSelector, this.slider ),
			count: this.slider.slides.length,
			itemsPerRow: parseInt( el.dataset.columns ),
			// SYNC:
			syncExists: $( this.options.sync ).length > 0,
			animation: this.options.animation === 'slide' ? 'swing' : '',
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
		};

		if ( isNaN( this.slider.currentSlide ) ) {
			this.slider.currentSlide = 0;
		}

		// SLIDE:
		if ( this.options.animation === 'slide' ) {
			this.options.animation = 'swing';
		}

		// TOUCH/USECSS:
		this.slider.transitions =
			! this.options.video &&
			! fade &&
			this.options.useCSS &&
			( function () {
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
						this.slider.pfx = props[ i ]
							.replace( 'Perspective', '' )
							.toLowerCase();
						this.slider.prop = '-' + this.slider.pfx + '-transform';
						return true;
					}
				}
				return false;
			} )();
		this.slider.isFirefox =
			navigator.userAgent.toLowerCase().indexOf( 'firefox' ) > -1;
		this.slider.ensureAnimationEnd = '';
		// CONTROLSCONTAINER:
		if ( this.options.controlsContainer !== '' )
			this.slider.controlsContainer =
				$( this.options.controlsContainer ).length > 0 &&
				$( this.options.controlsContainer );
		// MANUAL:
		if ( this.options.manualControls !== '' )
			this.slider.manualControls =
				$( this.options.manualControls ).length > 0 &&
				$( this.options.manualControls );

		// CUSTOM DIRECTION NAV:
		if ( this.options.customDirectionNav !== '' )
			this.slider.customDirectionNav =
				$( this.options.customDirectionNav ).length === 2 &&
				$( this.options.customDirectionNav );

		// RANDOMIZE:
		if ( this.options.randomize ) {
			this.slider.slides.sort( function () {
				return Math.round( Math.random() ) - 0.5;
			} );
			this.slider.container.empty().append( this.slider.slides );
		}

		this.slider.doMath();

		// INIT
		this.slider.setup( 'init' );

		// CONTROLNAV:
		if ( this.slider.vars.controlNav ) {
			this.controlNav.setup();
		}

		// DIRECTIONNAV:
		if ( this.slider.vars.directionNav ) {
			this.directionNav.setup();
		}

		// KEYBOARD:
		if (
			this.slider.vars.keyboard &&
			( $( this.slider.containerSelector ).length === 1 ||
				this.slider.vars.multipleKeyboard )
		) {
			$( document ).on( 'keyup', function ( event ) {
				const keycode = event.keyCode;
				if (
					! this.slider.animating &&
					( keycode === 39 || keycode === 37 )
				) {
					const target = this.slider.vars.rtl
						? keycode === 37
							? this.slider.getTarget( 'next' )
							: keycode === 39
							? this.slider.getTarget( 'prev' )
							: false
						: keycode === 39
						? this.slider.getTarget( 'next' )
						: function ( event, delta, deltaX, deltaY ) {
								event.preventDefault();
								const target =
									delta < 0
										? this.getTarget( 'next' )
										: this.getTarget( 'prev' );
								this.flexAnimate(
									target,
									slider.vars.pauseOnAction
								);
						  };
				}
			} );

			// PAUSEPLAY
			if ( slider.vars.pausePlay ) {
				this.pausePlay.setup();
			}

			//PAUSE WHEN INVISIBLE
			if ( slider.vars.slideshow && slider.vars.pauseInvisible ) {
				this.pauseInvisible.init();
			}

			// SLIDSESHOW
			if ( this.slider.vars.slideshow ) {
				if ( this.slider.vars.pauseOnHover ) {
					this.slider
						.on( 'mouseenter', function () {
							if ( ! slider.manualPlay && ! slider.manualPause ) {
								slider.pause();
							}
						} )
						.on( 'mouseleave', function () {
							if (
								! this.slider.manualPause &&
								! this.slider.manualPlay &&
								! this.slider.stopped
							) {
								this.slider.play();
							}
						} );
				}
				// initialize animation
				//If we're visible, or we don't use PageVisibility API
				if (
					! this.options.pauseInvisible ||
					! this.pauseInvisible.isHidden()
				) {
					slider.vars.initDelay > 0
						? ( slider.startTimeout = setTimeout(
								slider.play,
								slider.vars.initDelay
						  ) )
						: slider.play();
				}
			}

			// ASNAV:
			if ( asNav ) {
				this.asNav.setup();
			}

			// TOUCH
			if ( touch && slider.vars.touch ) {
				this.touch();
			}

			// FADE&&SMOOTHHEIGHT || SLIDE:
			if ( ! fade || ( fade && slider.vars.smoothHeight ) ) {
				$( window ).on(
					'resize orientationchange focus',
					methods.resize
				);
			}

			this.slider.find( 'img' ).attr( 'draggable', 'false' );

			// API: start() Callback
			setTimeout( function () {
				this.slider.vars.start( slider );
			}, 200 );
		}
	}

	asNav() {
		function setup() {
			slider.asNav = true;
			slider.animatingTo = Math.floor(
				slider.currentSlide / slider.move
			);
			slider.currentItem = slider.currentSlide;
			slider.slides
				.removeClass( namespace + 'active-slide' )
				.eq( slider.currentItem )
				.addClass( namespace + 'active-slide' );
			if ( ! msGesture ) {
				slider.slides.on( eventType, function ( e ) {
					e.preventDefault();
					const $slide = $( this ),
						target = $slide.index();
					let posFromX;
					if ( slider.vars.rtl ) {
						posFromX =
							-1 *
							( $slide.offset().right -
								$( slider ).scrollLeft() ); // Find position of slide relative to right of slider container
					} else {
						posFromX =
							$slide.offset().left - $( slider ).scrollLeft(); // Find position of slide relative to left of slider container
					}
					if (
						posFromX <= 0 &&
						$slide.hasClass( namespace + 'active-slide' )
					) {
						slider.flexAnimate( slider.getTarget( 'prev' ), true );
					} else if (
						! $( slider.vars.asNavFor ).data( 'flexslider' )
							.animating &&
						! $slide.hasClass( namespace + 'active-slide' )
					) {
						slider.direction =
							slider.currentItem < target ? 'next' : 'prev';
						slider.flexAnimate(
							target,
							slider.vars.pauseOnAction,
							false,
							true,
							true
						);
					}
				} );
			} else {
				this.el._slider = slider;
				slider.slides.each( function () {
					const that = this;
					that._gesture = new MSGesture();
					that._gesture.target = that;
					that.addEventListener(
						'MSPointerDown',
						function ( e ) {
							e.preventDefault();
							if ( e.currentTarget._gesture ) {
								e.currentTarget._gesture.addPointer(
									e.pointerId
								);
							}
						},
						false
					);
					that.addEventListener( 'MSGestureTap', function ( e ) {
						e.preventDefault();
						const $slide = $( this ),
							target = $slide.index();
						if (
							! $( slider.vars.asNavFor ).data( 'flexslider' )
								.animating &&
							! $slide.hasClass( 'active' )
						) {
							slider.direction =
								slider.currentItem < target ? 'next' : 'prev';
							slider.flexAnimate(
								target,
								slider.vars.pauseOnAction,
								false,
								true,
								true
							);
						}
					} );
				} );
			}
		}
	}

	controlNav() {
		function setup() {
			if ( ! slider.manualControls ) {
				methods.controlNav.setupPaging();
			} else {
				// MANUALCONTROLS:
				methods.controlNav.setupManual();
			}
		}
		function setupPaging() {
			let type =
					slider.vars.controlNav === 'thumbnails'
						? 'control-thumbs'
						: 'control-paging',
				j = 1,
				item,
				slide;

			slider.controlNavScaffold = $(
				'<ol class="' +
					namespace +
					'control-nav ' +
					namespace +
					type +
					'"></ol>'
			);

			if ( slider.pagingCount > 1 ) {
				for ( let i = 0; i < slider.pagingCount; i++ ) {
					slide = slider.slides.eq( i );

					if ( undefined === slide.attr( 'data-thumb-alt' ) ) {
						slide.attr( 'data-thumb-alt', '' );
					}

					item = $( '<a></a>' ).attr( 'href', '#' ).text( j );
					if (
						slider.vars.controlNav === 'thumbnails' &&
						slider.vars.manualControls === ''
					) {
						item = $( '<img/>', {
							Width: slider.navItemSize,
							Height: slider.navItemSize,
							src: slide.attr( 'data-thumb' ),
							srcset: `${ slide.attr(
								'data-thumb'
							) } ${ Math.round(
								slider.w / slider.navItemSize
							) }w, ${ slide
								.find( 'img' )
								.attr( 'src' ) } ${ Math.round( slider.w ) }w`,
							sizes: `(max-width: ${ Math.round(
								slider.w
							) }px) 100vw, ${ Math.round( slider.w ) }px`,
							alt: slide.attr( 'alt' ),
						} );
					} else {
						item = $( '<img/>', {
							Width: slider.navItemSize,
							Height: slider.navItemSize,
							src: slide.attr( 'data-thumb' ),
							alt: slide.attr( 'alt' ),
						} );
					}

					if ( '' !== slide.attr( 'data-thumb-alt' ) ) {
						item.attr( 'alt', slide.attr( 'data-thumb-alt' ) );
					}

					if (
						'thumbnails' === slider.vars.controlNav &&
						true === slider.vars.thumbCaptions
					) {
						const captn = slide.attr( 'data-thumbcaption' );
						if ( '' !== captn && undefined !== captn ) {
							const caption = $( '<span></span>' )
								.addClass( namespace + 'caption' )
								.text( captn );
							item.append( caption );
						}
					}

					const liElement = $( '<li>' );
					item.appendTo( liElement );
					liElement.append( '</li>' );

					slider.controlNavScaffold.append( liElement );
					j++;
				}
			}

			// CONTROLSCONTAINER:
			slider.controlsContainer
				? $( slider.controlsContainer ).append(
						slider.controlNavScaffold
				  )
				: slider.append( slider.controlNavScaffold );
			methods.controlNav.set();

			methods.controlNav.active();

			slider.controlNavScaffold.on(
				eventType,
				'a, img',
				function ( event ) {
					event.preventDefault();

					if ( watchedEvent === '' || watchedEvent === event.type ) {
						const $this = $( this ),
							target = slider.controlNav.index( $this );

						if ( ! $this.hasClass( namespace + 'active' ) ) {
							slider.direction =
								target > slider.currentSlide ? 'next' : 'prev';
							slider.flexAnimate(
								target,
								slider.vars.pauseOnAction
							);
						}
					}

					// setup flags to prevent event duplication
					if ( watchedEvent === '' ) {
						watchedEvent = event.type;
					}
					methods.setToClearWatchedEvent();
				}
			);
		}
		function setupManual() {
			slider.controlNav = slider.manualControls;
			methods.controlNav.active();

			slider.controlNav.on( eventType, function ( event ) {
				event.preventDefault();

				if ( watchedEvent === '' || watchedEvent === event.type ) {
					const $this = $( this ),
						target = slider.controlNav.index( $this );

					if ( ! $this.hasClass( namespace + 'active' ) ) {
						target > slider.currentSlide
							? ( slider.direction = 'next' )
							: ( slider.direction = 'prev' );
						slider.flexAnimate( target, slider.vars.pauseOnAction );
					}
				}

				// setup flags to prevent event duplication
				if ( watchedEvent === '' ) {
					watchedEvent = event.type;
				}
				methods.setToClearWatchedEvent();
			} );
		}
		function set() {
			const selector =
				slider.vars.controlNav === 'thumbnails' ? 'img' : 'a';
			slider.controlNav = $(
				'.' + namespace + 'control-nav li ' + selector,
				slider.controlsContainer ? slider.controlsContainer : slider
			);
		}
		function active() {
			slider.controlNav
				.removeClass( namespace + 'active' )
				.eq( slider.animatingTo )
				.addClass( namespace + 'active' );
		}
		function update( action, pos ) {
			if ( slider.pagingCount > 1 && action === 'add' ) {
				slider.controlNavScaffold.append(
					$( '<li><a href="#">' + slider.count + '</a></li>' )
				);
			} else if ( slider.pagingCount === 1 ) {
				slider.controlNavScaffold.find( 'li' ).remove();
			} else {
				slider.controlNav.eq( pos ).closest( 'li' ).remove();
			}
			methods.controlNav.set();
			slider.pagingCount > 1 &&
			slider.pagingCount !== slider.controlNav.length
				? slider.update( pos, action )
				: methods.controlNav.active();
		}
	}

	directionNav() {
		function setup() {
			const directionNavScaffold = $(
				'<ul class="' +
					namespace +
					'direction-nav"><li class="' +
					namespace +
					'nav-prev"><a class="' +
					namespace +
					'prev" href="#">' +
					slider.vars.prevText +
					'</a></li><li class="' +
					namespace +
					'nav-next"><a class="' +
					namespace +
					'next" href="#">' +
					slider.vars.nextText +
					'</a></li></ul>'
			);

			// CUSTOM DIRECTION NAV:
			if ( slider.customDirectionNav ) {
				slider.directionNav = slider.customDirectionNav;
				// CONTROLSCONTAINER:
			} else if ( slider.controlsContainer ) {
				$( slider.controlsContainer ).append( directionNavScaffold );
				slider.directionNav = $(
					'.' + namespace + 'direction-nav li a',
					slider.controlsContainer
				);
			} else {
				slider.append( directionNavScaffold );
				slider.directionNav = $(
					'.' + namespace + 'direction-nav li a',
					slider
				);
			}

			methods.directionNav.update();

			slider.directionNav.on( eventType, function ( event ) {
				event.preventDefault();
				let target;

				if ( watchedEvent === '' || watchedEvent === event.type ) {
					target = $( this ).hasClass( namespace + 'next' )
						? slider.getTarget( 'next' )
						: slider.getTarget( 'prev' );
					slider.flexAnimate( target, slider.vars.pauseOnAction );
				}

				// setup flags to prevent event duplication
				if ( watchedEvent === '' ) {
					watchedEvent = event.type;
				}
				methods.setToClearWatchedEvent();
			} );
		}

		function update() {
			console.log( 'updating...' );
			const disabledClass = namespace + 'disabled';
			if ( slider.pagingCount === 1 ) {
				slider.directionNav
					.addClass( disabledClass )
					.attr( 'tabindex', '-1' );
			} else if ( ! slider.vars.animationLoop ) {
				if ( slider.animatingTo === 0 ) {
					slider.directionNav
						.removeClass( disabledClass )
						.filter( '.' + namespace + 'prev' )
						.addClass( disabledClass )
						.attr( 'tabindex', '-1' );
				} else if ( slider.animatingTo === slider.last ) {
					slider.directionNav
						.removeClass( disabledClass )
						.filter( '.' + namespace + 'next' )
						.addClass( disabledClass )
						.attr( 'tabindex', '-1' );
				} else {
					slider.directionNav
						.removeClass( disabledClass )
						.prop( 'tabindex', '-1' );
				}
			} else {
				slider.directionNav
					.removeClass( disabledClass )
					.prop( 'tabindex', '-1' );
			}
		}
	}

	pausePlay() {
		function setup() {
			const pausePlayScaffold = $(
				'<div class="' + namespace + 'pauseplay"><a href="#"></a></div>'
			);

			// CONTROLSCONTAINER:
			if ( slider.controlsContainer ) {
				slider.controlsContainer.append( pausePlayScaffold );
				slider.pausePlay = $(
					'.' + namespace + 'pauseplay a',
					slider.controlsContainer
				);
			} else {
				slider.append( pausePlayScaffold );
				slider.pausePlay = $( '.' + namespace + 'pauseplay a', slider );
			}

			methods.pausePlay.update(
				slider.vars.slideshow ? namespace + 'pause' : namespace + 'play'
			);

			slider.pausePlay.on( eventType, function ( event ) {
				event.preventDefault();

				if ( watchedEvent === '' || watchedEvent === event.type ) {
					if ( $( this ).hasClass( namespace + 'pause' ) ) {
						slider.manualPause = true;
						slider.manualPlay = false;
						slider.pause();
					} else {
						slider.manualPause = false;
						slider.manualPlay = true;
						slider.play();
					}
				}

				// setup flags to prevent event duplication
				if ( watchedEvent === '' ) {
					watchedEvent = event.type;
				}
				methods.setToClearWatchedEvent();
			} );
		}

		function update( state ) {
			state === 'play'
				? slider.pausePlay
						.removeClass( namespace + 'pause' )
						.addClass( namespace + 'play' )
						.html( slider.vars.playText )
				: slider.pausePlay
						.removeClass( namespace + 'play' )
						.addClass( namespace + 'pause' )
						.html( slider.vars.pauseText );
		}
	}
	touch() {
		let startX,
			startY,
			offset,
			cwidth,
			dx,
			startT,
			onTouchStart,
			onTouchMove,
			onTouchEnd,
			scrolling = false,
			localX = 0,
			localY = 0,
			accDx = 0;

		if ( ! msGesture ) {
			onTouchStart = function ( e ) {
				if ( slider.animating ) {
					e.preventDefault();
				} else if (
					window.navigator.msPointerEnabled ||
					e.touches.length === 1
				) {
					slider.pause();
					// CAROUSEL:
					cwidth = vertical ? slider.h : slider.w;
					startT = Number( new Date() );
					// CAROUSEL:

					// Local vars for X and Y points.
					localX = e.touches[ 0 ].pageX;
					localY = e.touches[ 0 ].pageY;

					offset =
						carousel &&
						reverse &&
						slider.animatingTo === slider.last
							? 0
							: carousel && reverse
							? slider.limit -
							  ( slider.itemW + slider.vars.itemMargin ) *
									slider.move *
									slider.animatingTo
							: carousel && slider.currentSlide === slider.last
							? slider.limit
							: carousel
							? ( slider.itemW + slider.vars.itemMargin ) *
							  slider.move *
							  slider.currentSlide
							: reverse
							? ( slider.last -
									slider.currentSlide +
									slider.cloneOffset ) *
							  cwidth
							: ( slider.currentSlide + slider.cloneOffset ) *
							  cwidth;
					startX = vertical ? localY : localX;
					startY = vertical ? localX : localY;
					this.el.addEventListener( 'touchmove', onTouchMove, false );
					this.el.addEventListener( 'touchend', onTouchEnd, false );
				}
			};

			onTouchMove = function ( e ) {
				// Local vars for X and Y points.

				localX = e.touches[ 0 ].pageX;
				localY = e.touches[ 0 ].pageY;

				dx = vertical
					? startX - localY
					: ( slider.vars.rtl ? -1 : 1 ) * ( startX - localX );
				scrolling = vertical
					? Math.abs( dx ) < Math.abs( localX - startY )
					: Math.abs( dx ) < Math.abs( localY - startY );
				const fxms = 500;

				if ( ! scrolling || Number( new Date() ) - startT > fxms ) {
					e.preventDefault();
					if ( ! fade && slider.transitions ) {
						if ( ! slider.vars.animationLoop ) {
							dx =
								dx /
								( ( slider.currentSlide === 0 && dx < 0 ) ||
								( slider.currentSlide === slider.last &&
									dx > 0 )
									? Math.abs( dx ) / cwidth + 2
									: 1 );
						}
						slider.setProps( offset + dx, 'setTouch' );
					}
				}
			};

			onTouchEnd = function ( e ) {
				// finish the touch by undoing the touch session
				this.el.removeEventListener( 'touchmove', onTouchMove, false );

				if (
					slider.animatingTo === slider.currentSlide &&
					! scrolling &&
					! ( dx === null )
				) {
					const updateDx = reverse ? -dx : dx,
						target =
							updateDx > 0
								? slider.getTarget( 'next' )
								: slider.getTarget( 'prev' );

					if (
						slider.canAdvance( target ) &&
						( ( Number( new Date() ) - startT < 550 &&
							Math.abs( updateDx ) > 50 ) ||
							Math.abs( updateDx ) > cwidth / 2 )
					) {
						slider.flexAnimate( target, slider.vars.pauseOnAction );
					} else if ( ! fade ) {
						slider.flexAnimate(
							slider.currentSlide,
							slider.vars.pauseOnAction,
							true
						);
					}
				}
				this.el.removeEventListener( 'touchend', onTouchEnd, false );

				startX = null;
				startY = null;
				dx = null;
				offset = null;
			};

			this.el.addEventListener( 'touchstart', onTouchStart, false );
		} else {
			this.el.style.msTouchAction = 'none';
			this.el._gesture = new MSGesture();
			this.el._gesture.target = this.el;
			this.el.addEventListener( 'MSPointerDown', onMSPointerDown, false );
			this.el._slider = slider;
			this.el.addEventListener(
				'MSGestureChange',
				onMSGestureChange,
				false
			);
			this.el.addEventListener( 'MSGestureEnd', onMSGestureEnd, false );

			function onMSPointerDown( e ) {
				e.stopPropagation();
				if ( slider.animating ) {
					e.preventDefault();
				} else {
					slider.pause();
					this.el._gesture.addPointer( e.pointerId );
					accDx = 0;
					cwidth = vertical ? slider.h : slider.w;
					startT = Number( new Date() );
					// CAROUSEL:

					offset =
						carousel &&
						reverse &&
						slider.animatingTo === slider.last
							? 0
							: carousel && reverse
							? slider.limit -
							  ( slider.itemW + slider.vars.itemMargin ) *
									slider.move *
									slider.animatingTo
							: carousel && slider.currentSlide === slider.last
							? slider.limit
							: carousel
							? ( slider.itemW + slider.vars.itemMargin ) *
							  slider.move *
							  slider.currentSlide
							: reverse
							? ( slider.last -
									slider.currentSlide +
									slider.cloneOffset ) *
							  cwidth
							: ( slider.currentSlide + slider.cloneOffset ) *
							  cwidth;
				}
			}

			function onMSGestureChange( e ) {
				e.stopPropagation();
				const slider = e.target._slider;
				if ( ! slider ) {
					return;
				}
				const transX = -e.translationX,
					transY = -e.translationY;

				//Accumulate translations.
				accDx = accDx + ( vertical ? transY : transX );
				dx = ( slider.vars.rtl ? -1 : 1 ) * accDx;
				scrolling = vertical
					? Math.abs( accDx ) < Math.abs( -transX )
					: Math.abs( accDx ) < Math.abs( -transY );

				if ( e.detail === e.MSGESTURE_FLAG_INERTIA ) {
					setImmediate( function () {
						this.el._gesture.stop();
					} );

					return;
				}

				if ( ! scrolling || Number( new Date() ) - startT > 500 ) {
					e.preventDefault();
					if ( ! fade && slider.transitions ) {
						if ( ! slider.vars.animationLoop ) {
							dx =
								accDx /
								( ( slider.currentSlide === 0 && accDx < 0 ) ||
								( slider.currentSlide === slider.last &&
									accDx > 0 )
									? Math.abs( accDx ) / cwidth + 2
									: 1 );
						}
						slider.setProps( offset + dx, 'setTouch' );
					}
				}
			}

			function onMSGestureEnd( e ) {
				e.stopPropagation();
				const slider = e.target._slider;
				if ( ! slider ) {
					return;
				}
				if (
					slider.animatingTo === slider.currentSlide &&
					! scrolling &&
					! ( dx === null )
				) {
					const updateDx = reverse ? -dx : dx,
						target =
							updateDx > 0
								? slider.getTarget( 'next' )
								: slider.getTarget( 'prev' );

					if (
						slider.canAdvance( target ) &&
						( ( Number( new Date() ) - startT < 550 &&
							Math.abs( updateDx ) > 50 ) ||
							Math.abs( updateDx ) > cwidth / 2 )
					) {
						slider.flexAnimate( target, slider.vars.pauseOnAction );
					} else if ( ! fade ) {
						slider.flexAnimate(
							slider.currentSlide,
							slider.vars.pauseOnAction,
							true
						);
					}
				}

				startX = null;
				startY = null;
				dx = null;
				offset = null;
				accDx = 0;
			}
		}
	}
	resize() {
		if ( ! slider.animating && slider.is( ':visible' ) ) {
			if ( ! carousel ) {
				slider.doMath();
			}

			if ( fade ) {
				// SMOOTH HEIGHT:
				methods.smoothHeight();
			} else if ( carousel ) {
				//CAROUSEL:
				slider.slides.width( slider.computedW );
				slider.update( slider.pagingCount );
				slider.setProps();
			} else if ( vertical ) {
				//VERTICAL:
				slider.viewport.height( slider.computedW );
				slider.newSlides.css( {
					width: slider.computedW,
					height: slider.computedW,
				} );
				if ( slider.vars.smoothHeight ) {
					methods.smoothHeight();
				}
				slider.setProps( slider.computedW, 'setTotal' );
			} else {
				// SMOOTH HEIGHT:
				slider.newSlides.width( slider.computedW );
				if ( slider.vars.smoothHeight ) {
					methods.smoothHeight();
				}
				slider.setProps( slider.computedW, 'setTotal' );
			}
		}
	}
	smoothHeight( dur ) {
		if ( ! vertical || fade ) {
			const $obj = fade ? slider.container : slider.viewport;
			dur
				? $obj.animate(
						{
							height: slider.slides
								.eq( slider.animatingTo )
								.innerHeight(),
						},
						dur
				  )
				: $obj.innerHeight(
						slider.slides.eq( slider.animatingTo ).innerHeight()
				  );
		}
	}
	sync( action ) {
		const $obj = $( slider.vars.sync ).data( 'flexslider' ),
			target = slider.animatingTo;

		switch ( action ) {
			case 'animate':
				$obj.flexAnimate(
					target,
					slider.vars.pauseOnAction,
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
	pauseInvisible() {
		const visProp = null;
		function init() {
			const visProp = methods.pauseInvisible.getHiddenProp();
			if ( visProp ) {
				const evtname =
					visProp.replace( /[H|h]idden/, '' ) + 'visibilitychange';
				document.addEventListener( evtname, function () {
					if ( methods.pauseInvisible.isHidden() ) {
						if ( slider.startTimeout ) {
							clearTimeout( slider.startTimeout ); //If clock is ticking, stop timer and prevent from starting while invisible
						} else {
							slider.pause(); //Or just pause
						}
					} else if ( slider.started ) {
						slider.play(); //Initiated before, just play
					} else if ( slider.vars.initDelay > 0 ) {
						setTimeout( slider.play, slider.vars.initDelay );
					} else {
						slider.play(); //Didn't init before: simply init or wait for it
					}
				} );
			}
		}
		function isHidden() {
			const prop = methods.pauseInvisible.getHiddenProp();
			if ( ! prop ) {
				return false;
			}
			return document[ prop ];
		}
		function getHiddenProp() {
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

	setToClearWatchedEvent() {
		clearTimeout( this.watchedEventClearTimer );
		this.watchedEventClearTimer = setTimeout( function () {
			this.watchedEvent = '';
		}, 3000 );
	}

	// public methods
	flexAnimate = function ( target, pause, override, withSync, fromNav ) {
		if (
			! this.options.animationLoop &&
			target !== this.slider.currentSlide
		) {
			this.slider.direction =
				target > this.slider.currentSlide ? 'next' : 'prev';
		}

		if ( asNav && this.slider.pagingCount === 1 )
			this.slider.direction =
				this.slider.currentItem < target ? 'next' : 'prev';

		if (
			! this.slider.animating &&
			( this.slider.canAdvance( target, fromNav ) || override ) &&
			this.slider.is( ':visible' )
		) {
			if ( asNav && withSync ) {
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
						.removeClass( namespace + 'active-slide' )
						.eq( target )
						.addClass( namespace + 'active-slide' );
					target = Math.floor( target / this.slider.visible );
				} else {
					this.slider.currentItem = target;
					this.slider.slides
						.removeClass( namespace + 'active-slide' )
						.eq( target )
						.addClass( namespace + 'active-slide' );
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
				methods.sync( 'animate' );
			}

			// CONTROLNAV
			if ( this.options.controlNav ) {
				methods.controlNav.active();
			}

			// !CAROUSEL:
			// CANDIDATE: slide active class (for add/remove slide)
			if ( ! carousel ) {
				this.slider.slides
					.removeClass( namespace + 'active-slide' )
					.eq( target )
					.addClass( namespace + 'active-slide' );
			}

			// INFINITE LOOP:
			// CANDIDATE: atEnd
			this.slider.atEnd = target === 0 || target === this.slider.last;

			// DIRECTIONNAV:
			if ( this.options.directionNav ) {
				methods.directionNav.update();
			}

			if ( target === this.slider.last ) {
				// API: end() of cycle Callback
				this.options.end( this.slider );
				// SLIDESHOW && !INFINITE LOOP:
				if ( ! this.options.animationLoop ) {
					this.slider.pause();
				}
			}

			// SLIDE:
			if ( ! fade ) {
				var dimension = vertical
						? this.slider.slides.filter( ':first' ).height()
						: this.slider.computedW,
					margin,
					slideString,
					calcNext;

				// INFINITE LOOP / REVERSE:
				if ( carousel ) {
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
					slideString = reverse
						? ( this.slider.count + this.slider.cloneOffset ) *
						  dimension
						: 0;
				} else if (
					this.slider.currentSlide === this.slider.last &&
					target === 0 &&
					this.options.animationLoop &&
					this.slider.direction !== 'prev'
				) {
					slideString = reverse
						? 0
						: ( this.slider.count + 1 ) * dimension;
				} else {
					slideString = reverse
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
				if ( ! touch ) {
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
				methods.smoothHeight( this.options.animationSpeed );
			}
		}
	};

	wrapup = function ( dimension ) {
		// SLIDE:
		if ( ! fade && ! carousel ) {
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
			methods.pausePlay.update( 'play' );
		}
		// SYNC:
		if ( this.slider.syncExists ) {
			methods.sync( 'pause' );
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
			methods.pausePlay.update( 'pause' );
		}
		// SYNC:
		if ( this.slider.syncExists ) {
			methods.sync( 'play' );
		}
	};
	// STOP:
	stop = function () {
		this.slider.pause();
		this.slider.stopped = true;
	};
	canAdvance = function ( target, fromNav ) {
		// ASNAV:
		const last = asNav ? this.slider.pagingCount - 1 : this.slider.last;
		return fromNav
			? true
			: asNav &&
			  this.slider.currentItem === this.slider.count - 1 &&
			  target === 0 &&
			  this.slider.direction === 'prev'
			? true
			: asNav &&
			  this.slider.currentItem === 0 &&
			  target === this.slider.pagingCount - 1 &&
			  this.slider.direction !== 'next'
			? false
			: target === this.slider.currentSlide && ! asNav
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
	};

	getTarget = function ( dir ) {
		this.slider.direction = dir;
		if ( dir === 'next' ) {
			return this.slider.currentSlide === this.slider.last
				? 0
				: this.slider.currentSlide + 1;
		}
		return this.slider.currentSlide === 0
			? this.slider.last
			: this.slider.currentSlide - 1;
	};

	// SLIDE:
	setProps = function ( pos, special, dur ) {
		let target = ( function () {
			const posCheck = pos
					? pos
					: ( this.slider.itemW + this.options.itemMargin ) *
					  this.slider.move *
					  this.slider.animatingTo,
				posCalc = ( function () {
					if ( carousel ) {
						return special === 'setTouch'
							? pos
							: reverse &&
							  this.slider.animatingTo === this.slider.last
							? 0
							: reverse
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
							return reverse
								? ( this.slider.count -
										1 -
										this.slider.currentSlide +
										this.slider.cloneOffset ) *
										pos
								: ( this.slider.currentSlide +
										this.slider.cloneOffset ) *
										pos;
						case 'setTouch':
							return reverse ? pos : pos;
						case 'jumpEnd':
							return reverse ? pos : this.slider.count * pos;
						case 'jumpStart':
							return reverse ? this.slider.count * pos : pos;
						default:
							return pos;
					}
				} )();

			return posCalc * ( this.options.rtl ? 1 : -1 ) + 'px';
		} )();

		if ( this.slider.transitions ) {
			target = vertical
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
			this.slider.container.css( this.slider.args );
		}

		this.slider.container.css( 'transform', target );
	};

	setup = function ( type ) {
		this.slider.slides.slice( 1 ).each( function () {
			if ( document.readyState !== 'complete' ) {
				const $img = $( this ).find( 'img' ).first();
				$img.data( {
					src: $img.attr( 'src' ),
					srcset: $img.attr( 'srcset' ),
				} )
					.removeAttr( 'src srcset' )
					.addClass( 'flexslider-deferred' );
			}
		} );
		// SLIDE:
		if ( ! fade ) {
			let sliderOffset, arr;

			if ( type === 'init' ) {
				if ( this.options.manualControls === '' ) {
					this.slider.viewport = $(
						'<div class="' + namespace + 'viewport"></div>'
					)
						.css( { overflow: 'hidden', position: 'relative' } )
						.appendTo( this.slider )
						.append( this.slider.container );
				} else {
					this.slider.viewport = $(
						'<div class="' + namespace + 'viewport"></div>'
					)
						.css( { overflow: 'hidden', position: 'relative' } )
						.prependTo( this.slider )
						.prepend( this.slider.container );
				}
				// INFINITE LOOP:
				this.slider.cloneCount = 0;
				this.slider.cloneOffset = 0;
				// REVERSE:
				if ( reverse ) {
					arr = $.makeArray( this.slider.slides ).reverse();
					this.slider.slides = $( arr );
					this.slider.container.empty().append( this.slider.slides );
				}
			}
			// INFINITE LOOP && !CAROUSEL:
			if ( this.options.animationLoop && ! carousel ) {
				this.slider.cloneCount = 2;
				this.slider.cloneOffset = 1;
				// clear out old clones
				if ( type !== 'init' ) {
					this.slider.container.find( '.clone' ).remove();
				}
				this.slider.container
					.append(
						methods
							.uniqueID(
								this.slider.slides
									.first()
									.clone()
									.addClass( 'clone' )
							)
							.attr( 'aria-hidden', 'true' )
					)
					.prepend(
						methods
							.uniqueID(
								this.slider.slides
									.last()
									.clone()
									.addClass( 'clone' )
							)
							.attr( 'aria-hidden', 'true' )
					);
			}
			this.slider.newSlides = $( this.options.selector, this.slider );

			sliderOffset = reverse
				? this.slider.count -
				  1 -
				  this.slider.currentSlide +
				  this.slider.cloneOffset
				: this.slider.currentSlide + this.slider.cloneOffset;
			this.slider.doMath();
			// VERTICAL:
			if ( vertical && ! carousel ) {
				this.slider.viewport.height( this.slider.h );
				this.slider.newSlides.css( {
					display: 'block',
					width: this.slider.computedW,
					height: this.slider.computedW,
				} );
				this.slider.container
					.height(
						( this.slider.count + this.slider.cloneCount ) * 200 +
							'%'
					)
					.css( 'position', 'absolute' )
					.width( '100%' );
				this.slider.setProps( sliderOffset * this.slider.h, 'init' );
			} else {
				if ( type === 'init' )
					this.slider.viewport.css( {
						height: this.slider.h,
						'overflow-X': 'hidden',
					} );
				this.slider.newSlides.css( {
					width: this.slider.computedW,
					marginRight: this.slider.computedM,
					float: this.options.rtl ? 'right' : 'left',
					display: 'block',
				} );
				this.slider.container.css( {
					height: '',
					width:
						( this.slider.count + this.slider.cloneCount ) * 200 +
						'%',
				} );
				this.slider.setProps(
					sliderOffset * this.slider.computedW,
					'init'
				);
				setTimeout(
					function () {
						// SMOOTH HEIGHT:
						if ( this.options.smoothHeight ) {
							methods.smoothHeight();
						}
					},
					type === 'init' ? 100 : 0
				);
			}
		} else {
			// FADE:
			if ( this.options.rtl ) {
				this.slider.slides.css( {
					width: '100%',
					float: 'right',
					marginLeft: '-100%',
					position: 'relative',
				} );
			} else {
				this.slider.slides.css( {
					width: '100%',
					float: 'left',
					marginRight: '-100%',
					position: 'relative',
				} );
			}
			if ( type === 'init' ) {
				if ( ! touch ) {
					//this.slider.slides.eq(this.slider.currentSlide).fadeIn(this.options.animationSpeed, this.options.easing);
					if ( ! this.options.fadeFirstSlide ) {
						this.slider.slides.css( {
							opacity: 1,
							display: 'block',
							zIndex: 1,
						} );
					} else {
						this.slider.slides
							.css( {
								opacity: 0,
								display: 'block',
								zIndex: 1,
							} )
							.eq( this.slider.currentSlide )
							.animate(
								{ opacity: 1 },
								this.options.animationSpeed,
								this.options.easing
							);
					}
				} else {
					this.slider.slides
						.css( {
							opacity: 0,
							display: 'block',
							webkitTransition:
								'opacity ' + this.options.fadeFirstSlide
									? 1
									: this.options.animationSpeed / 1000 +
									  's ease',
							zIndex: 1,
						} )
						.eq( this.slider.currentSlide )
						.css( { opacity: 1 } );
				}
			}
			// SMOOTH HEIGHT:
			if ( this.options.smoothHeight ) {
				methods.smoothHeight();
			}
		}
		// !CAROUSEL:
		// CANDIDATE: active slide
		if ( ! carousel ) {
			this.slider.slides
				.removeClass( namespace + 'active-slide' )
				.eq( this.slider.currentSlide )
				.addClass( namespace + 'active-slide' );
		}

		//FlexSlider: init() Callback
		this.options.init( this.slider );
	};

	doMath = function () {
		const slide = this.slider.slides.first(),
			slideMargin = this.options.itemMargin,
			minItems = this.options.minItems,
			maxItems = this.options.maxItems;

		this.slider.w =
			this.slider.viewport === undefined
				? this.slider.width()
				: this.slider.viewport.width();
		if ( this.slider.isFirefox ) {
			this.slider.w = this.slider.width();
		}
		this.slider.h = slide.height();
		this.slider.boxPadding = slide.outerWidth() - slide.width();
		this.slider.firstRowCount =
			this.slider.itemsPerRow > this.slider.count
				? this.slider.itemsPerRow
				: Math.min( this.slider.itemsPerRow, this.slider.count );
		this.slider.navItemSize = Math.round(
			this.slider.w / this.slider.firstRowCount
		);
		// CAROUSEL:
		if ( carousel ) {
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
	};

	update = function ( pos, action ) {
		this.slider.doMath();

		// update currentSlide and this.slider.animatingTo if necessary
		if ( ! carousel ) {
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
				( action === 'add' && ! carousel ) ||
				this.slider.pagingCount > this.slider.controlNav.length
			) {
				methods.controlNav.update( 'add' );
			} else if (
				( action === 'remove' && ! carousel ) ||
				this.slider.pagingCount < this.slider.controlNav.length
			) {
				if ( carousel && this.slider.currentSlide > this.slider.last ) {
					this.slider.currentSlide -= 1;
					this.slider.animatingTo -= 1;
				}
				methods.controlNav.update( 'remove', this.slider.last );
			}
		}
		// update directionNav
		if ( this.options.directionNav ) {
			methods.directionNav.update();
		}
	};

	addSlide = function ( obj, pos ) {
		const $obj = $( obj );

		this.slider.count += 1;
		this.slider.last = this.slider.count - 1;

		// append new slide
		if ( vertical && reverse ) {
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
			$( obj, this.slider.slides ).remove();
		} else {
			this.options.vertical && this.options.reverse
				? this.slider.slides.eq( this.slider.last ).remove()
				: this.slider.slides.eq( obj ).remove();
		}

		// update currentSlide, animatingTo, controlNav, and directionNav
		this.slider.doMath();
		this.slider.update( pos, 'remove' );

		// update this.slider.slides
		this.slider.slides = $(
			this.options.selector + ':not(.clone)',
			this.slider
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

window.onload = () => {
	const sliders = document.querySelectorAll( '.woocommerce-product-gallery' );

	return sliders.forEach( ( slider ) => {
		// get the slides
		const selector = slider.options.selector
			? slider.options.selector
			: '.slides > li';
		const slides = slider.querySelector( selector );

		// the slider has a single item
		if (
			( slides.length === 1 && slider.options.allowOneSlide === false ) ||
			slides.length === 0
		) {
			// slider.fadeIn( 0 );
			// TODO: show the images slides if not displayed or hidden
			if ( typeof slider.options.start === 'function' ) {
				slider.options.start( slider );
			}
		} else if ( slider.options === undefined ) {
			// if the slider has no options set initialize it
			new flexslider( slider, slider.options );
		}
	} );
};

//FlexSlider: Plugin Function
window.flexsliderApi = function ( options ) {
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
