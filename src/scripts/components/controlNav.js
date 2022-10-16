import { eventType } from '../index';

export default class ControlNav {
	constructor( namespace, slider, options ) {
		this.namespace = namespace;
		this.slider = slider;
		this.options = options;
	}

	setup() {
		if ( this.slider.manualControls ) {
			this.setupManual();
		} else {
			this.setupPaging();
		}
	}

	setupPaging() {
		const type =
			this.options.controlNav === 'thumbnails'
				? 'control-thumbs'
				: 'control-paging';
		let j = 1;
		let item;
		let slide;

		this.slider.controlNavEl = document.createElement( 'ol' );

		this.slider.controlNavEl.classList.add(
			this.namespace + 'control-nav',
			this.namespace + type
		);

		if ( this.slider.pagingCount > 1 ) {
			for ( let i = 0; i < this.slider.pagingCount; i++ ) {
				slide = this.slider.slides[ i ];

				if ( undefined === slide.dataset.thumbAlt ) {
					slide.dataset.thumbAlt = '';
				}

				item = document.createElement( 'a' );
				item.href = '#';
				item.dataset.thumbId = j.toString();

				let image;
				const imageThumb = slide.dataset.thumb;
				const imageAlt = slide.alt || '';

				if (
					this.options.controlNav === 'thumbnails' &&
					this.options.manualControls === ''
				) {
					// eslint-disable-next-line
					image = `<img width="${this.slider.navItemSize}" height="${this.slider.navItemSize}" src="${imageThumb}" alt="${imageAlt}" />`;

					// TODO: get the content of attributes srcset and sizes
					// item = $( '<img/>', {
					// 	Width: this.slider.navItemSize,
					// 	Height: this.slider.navItemSize,
					// 	src: slide.attr( 'data-thumb' ),
					// 	srcset: `${ slide.attr( 'data-thumb' ) } ${ Math.round(
					// 		this.slider.w / this.slider.navItemSize
					// 	) }w, ${ slide
					// 		.find( 'img' )
					// 		.attr( 'src' ) } ${ Math.round( this.slider.w ) }w`,
					// 	sizes: `(max-width: ${ Math.round(
					// 		this.slider.w
					// 	) }px) 100vw, ${ Math.round( this.slider.w ) }px`,
					// 	alt: slide.attr( 'alt' ),
					// } );
				} else {
					// eslint-disable-next-line
          image = `<img width="${this.slider.navItemSize}" height="${this.slider.navItemSize}" src="${imageThumb}" alt="${imageAlt}" />`;

					// item = $( '<img/>', {
					// 	Width: this.slider.navItemSize,
					// 	Height: this.slider.navItemSize,
					// 	src: slide.attr( 'data-thumb' ),
					// 	alt: slide.attr( 'alt' ),
					// } );
				}

				item.insertAdjacentHTML( 'beforeend', image );

				if ( '' !== slide.dataset.thumbAlt ) {
					item.alt = slide.dataset.thumbAlt;
				}

				if (
					'thumbnails' === this.options.controlNav &&
					true === this.options.thumbCaptions
				) {
					const thumbCaption = slide.dataset.thumbCaption;
					if ( '' !== thumbCaption && undefined !== thumbCaption ) {
						const caption = document.createElement( 'span' );
						caption.classList.add( this.namespace + 'caption' );
						caption.innerText = thumbCaption;
						item.append( caption );
					}
				}

				const liElement = document.createElement( 'li' );
				liElement.append( item );

				this.slider.controlNavEl.append( liElement );
				this.slider.append( this.slider.controlNavEl );

				j++;
			}
		}

		// CONTROLSCONTAINER:
		if ( this.slider.controlsContainer ) {
			this.slider.controlsContainer.append( this.slider.controlNavEl );
		} else {
			this.slider.append( this.slider.controlNavEl );
		}

		this.set();

		this.active();

		eventType.split( ' ' ).forEach( ( ev ) => {
			window.addEventListener(
				ev,
				( event ) => {
					console.log( event );

					event.preventDefault();

					if (
						this.watchedEvent === '' ||
						this.watchedEvent === event.type
					) {
						const target = this.slider.controlNav.index(
							event.target
						);

						if (
							! event.target.classList.contains(
								this.namespace + 'active'
							)
						) {
							this.slider.direction =
								target > this.slider.currentSlide
									? 'next'
									: 'prev';
							this.flexAnimate(
								target,
								this.options.pauseOnAction
							);
						}
					}

					// setup flags to prevent event duplication
					if ( this.watchedEvent === '' ) {
						this.watchedEvent = event.type;
					}
					this.setToClearWatchedEvent();
				},
				false
			);
		} );
	}

	setupManual() {
		this.slider.controlNavEl = this.slider.manualControls;
		this.active();

		eventType.split( ' ' ).forEach( function ( ev ) {
			this.slider.controlNavEl.addEventListener( ev, ( event ) => {
				event.preventDefault();

				if (
					this.watchedEvent === '' ||
					this.watchedEvent === event.type
				) {
					const target = event.target;
					const targetID = [ ...this.slider.controlNavEl ].indexOf(
						target
					);

					if (
						! target.classList.contains( this.namespace + 'active' )
					) {
						if ( targetID > this.slider.currentSlide ) {
							this.slider.direction = 'next';
						} else {
							this.slider.direction = 'prev';
						}
						this.flexAnimate( target, this.options.pauseOnAction );
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

	set() {
		const selector = this.options.controlNav === 'thumbnails' ? 'img' : 'a';
		const container = this.slider.controlsContainer
			? this.slider.controlsContainer
			: this.slider;
		container.querySelector(
			'.' + this.namespace + 'control-nav li ' + selector
		);
	}

	active() {
		Object.values( this.slider.controlNavEl ).forEach( ( thumb ) => {
			thumb.classList.remove( this.namespace + 'active' );
		} );
		this.slider.controlNavEl.children[
			this.slider.animatingTo
		].classList.add( this.namespace + 'active' );
	}

	update( action, pos ) {
		if ( this.slider.pagingCount > 1 && action === 'add' ) {
			const listItem = document.createElement( 'li' );
			listItem.innerHTML = '<a href="#">' + this.slider.count + '</a>';
		} else if ( this.slider.pagingCount === 1 ) {
			this.slider.controlNavEl.find( 'li' ).remove();
		} else {
			this.slider.controlNav.eq( pos ).closest( 'li' ).remove();
		}
		this.set();
		if (
			this.slider.pagingCount > 1 &&
			this.slider.pagingCount !== this.slider.controlNav.length
		) {
			this.update( pos, action );
		} else {
			this.active();
		}
	}
}
