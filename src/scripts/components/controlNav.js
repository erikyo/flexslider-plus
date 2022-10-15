export class controlNav {
	setup() {
		if ( this.slider.manualControls ) {
			// MANUALCONTROLS:
			this.setupManual();
		} else {
			this.setupPaging();
		}
	}

	setupPaging() {
		let type =
				this.options.controlNav === 'thumbnails'
					? 'control-thumbs'
					: 'control-paging',
			j = 1,
			item,
			slide;

		this.slider.controlNavScaffold = $(
			'<ol class="' +
				this.namespace +
				'control-nav ' +
				this.namespace +
				type +
				'"></ol>'
		);

		if ( this.slider.pagingCount > 1 ) {
			for ( let i = 0; i < this.slider.pagingCount; i++ ) {
				slide = this.slider.slides.eq( i );

				if ( undefined === slide.attr( 'data-thumb-alt' ) ) {
					slide.attr( 'data-thumb-alt', '' );
				}

				item = $( '<a></a>' ).attr( 'href', '#' ).text( j );
				if (
					this.options.controlNav === 'thumbnails' &&
					this.options.manualControls === ''
				) {
					item = $( '<img/>', {
						Width: this.slider.navItemSize,
						Height: this.slider.navItemSize,
						src: slide.attr( 'data-thumb' ),
						srcset: `${ slide.attr( 'data-thumb' ) } ${ Math.round(
							this.slider.w / this.slider.navItemSize
						) }w, ${ slide
							.find( 'img' )
							.attr( 'src' ) } ${ Math.round( this.slider.w ) }w`,
						sizes: `(max-width: ${ Math.round(
							this.slider.w
						) }px) 100vw, ${ Math.round( this.slider.w ) }px`,
						alt: slide.attr( 'alt' ),
					} );
				} else {
					item = $( '<img/>', {
						Width: this.slider.navItemSize,
						Height: this.slider.navItemSize,
						src: slide.attr( 'data-thumb' ),
						alt: slide.attr( 'alt' ),
					} );
				}

				if ( '' !== slide.attr( 'data-thumb-alt' ) ) {
					item.attr( 'alt', slide.attr( 'data-thumb-alt' ) );
				}

				if (
					'thumbnails' === this.options.controlNav &&
					true === this.options.thumbCaptions
				) {
					const captn = slide.attr( 'data-thumbcaption' );
					if ( '' !== captn && undefined !== captn ) {
						const caption = $( '<span></span>' )
							.addClass( this.namespace + 'caption' )
							.text( captn );
						item.append( caption );
					}
				}

				const liElement = $( '<li>' );
				item.appendTo( liElement );
				liElement.append( '</li>' );

				this.slider.controlNavScaffold.append( liElement );
				j++;
			}
		}

		// CONTROLSCONTAINER:
		this.slider.controlsContainer
			? $( this.slider.controlsContainer ).append(
					this.slider.controlNavScaffold
			  )
			: this.slider.append( slider.controlNavScaffold );
		this.controlNav.set();

		this.controlNav.active();

		this.slider.controlNavScaffold.on(
			this.eventType,
			'a, img',
			function ( event ) {
				event.preventDefault();

				if (
					this.watchedEvent === '' ||
					this.watchedEvent === event.type
				) {
					const $this = $( this ),
						target = this.slider.controlNav.index( $this );

					if ( ! $this.hasClass( this.namespace + 'active' ) ) {
						this.slider.direction =
							target > this.slider.currentSlide ? 'next' : 'prev';
						this.flexAnimate( target, this.options.pauseOnAction );
					}
				}

				// setup flags to prevent event duplication
				if ( this.watchedEvent === '' ) {
					this.watchedEvent = event.type;
				}
				this.setToClearWatchedEvent();
			}
		);
	}

	setupManual() {
		this.slider.controlNav = this.slider.manualControls;
		this.controlNav.active();

		this.slider.controlNav.on( this.eventType, function ( event ) {
			event.preventDefault();

			if (
				this.watchedEvent === '' ||
				this.watchedEvent === event.type
			) {
				const $this = $( this ),
					target = this.slider.controlNav.index( $this );

				if ( ! $this.hasClass( this.namespace + 'active' ) ) {
					target > this.slider.currentSlide
						? ( this.slider.direction = 'next' )
						: ( this.slider.direction = 'prev' );
					this.flexAnimate( target, this.options.pauseOnAction );
				}
			}

			// setup flags to prevent event duplication
			if ( this.watchedEvent === '' ) {
				this.watchedEvent = event.type;
			}
			this.setToClearWatchedEvent();
		} );
	}

	set() {
		const selector = this.options.controlNav === 'thumbnails' ? 'img' : 'a';
		this.slider.controlNav = $(
			'.' + this.namespace + 'control-nav li ' + selector,
			this.slider.controlsContainer
				? this.slider.controlsContainer
				: this.slider
		);
	}

	active() {
		this.slider.controlNav
			.removeClass( this.namespace + 'active' )
			.eq( this.animatingTo )
			.addClass( this.namespace + 'active' );
	}

	update( action, pos ) {
		if ( this.slider.pagingCount > 1 && action === 'add' ) {
			this.slider.controlNavScaffold.append(
				$( '<li><a href="#">' + this.slider.count + '</a></li>' )
			);
		} else if ( this.slider.pagingCount === 1 ) {
			this.slider.controlNavScaffold.find( 'li' ).remove();
		} else {
			this.slider.controlNav.eq( pos ).closest( 'li' ).remove();
		}
		this.controlNav.set();
		this.slider.pagingCount > 1 &&
		this.slider.pagingCount !== this.slider.controlNav.length
			? this.update( pos, action )
			: this.controlNav.active();
	}
}
