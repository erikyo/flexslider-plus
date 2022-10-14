<?php
/**
 * Plugin Name: flexslider plus
 * Plugin URI: https://github.com/erikyo/flexslider-plus
 * Description: flexslider plus
 * Version: 0.0.1
 * Author: erik
 */

function flexslider_plus_script() {
	$asset = include __DIR__ . '/build/flexslider-plus.asset.php';
	wp_enqueue_script( 'flexslider_plus', plugin_dir_url( __FILE__ ) . 'build/flexslider-plus.js', $asset['dependencies'], false, true );

}
add_action( 'wp_enqueue_scripts', 'flexslider_plus_script', 1 );

function dequeue_flexslider() {
	wp_dequeue_script( 'flexslider' );
}
add_action( 'wp_enqueue_scripts', 'dequeue_flexslider', 30 );

/**
 * Register and enqueue the flexslider_plus stylesheet
 */
function flexslider_plus_style() {

	wp_register_style( 'flexslider_plus_style', plugin_dir_url( __FILE__ ) . 'build/style-flexslider-plus.css' );
	wp_enqueue_style( 'flexslider_plus_style' );
}
add_action( 'wp_enqueue_scripts', 'flexslider_plus_style' );
