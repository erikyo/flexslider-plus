const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		'flexslider-plus': path.resolve( process.cwd(), `src/flexslider_plus.js` ),
	},
};
