'use strict';

/**
 * Internal dependencies
 */
let colorUtils = require( '../utils/color-utils' ),
	GraphRenderer = require( './graph-renderer' ),
	NormalDifferenceDistribution = require( '../stats/normal-difference-distribution' ),
	NumberRange = require( '../stats/number-range' ),
	utils = require( '../utils' );

class ImprovementGraphRenderer extends GraphRenderer {
	constructor( canvasId ) {
		super( canvasId );

		this.NEGATIVE_COLOR = '#ff0000';
		this.POSITIVE_COLOR = '#22B722';
	}

	render() {
		this.prepareForRender();
		this.renderCurve();
		this.renderCenter();
		super.render();
	}

	renderCurve() {
		this.renderNegativeCurvePart();
		this.renderPositiveCurvePart();
	}

	renderCenter() {
		this.ctx.beginPath();
		this.ctx.moveTo( this.distributionXToCanvasX( this.distribution.mean ), this.rect.bottom );
		this.ctx.lineTo( this.distributionXToCanvasX( this.distribution.mean ), this.distributionYToCanvasY( this.distribution.getPeakDensity() ) );
		this.ctx.closePath();
		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = this.getCenterLineColor();
		this.ctx.stroke();
	}

	getCenterLineColor() {
		let color = this.distribution.mean > 0 ? this.POSITIVE_COLOR : this.NEGATIVE_COLOR;

		return colorUtils.hexToTransparentRGB( color, 0.5 );
	}

	prepareForRender() {
		this.setDistribution();
		this.calculateAxisRanges();
	}

	renderNegativeCurvePart() {
		let range = new NumberRange( -Infinity, 0 );

		this.xNegativeValues = this.distribution.getXBetween( range.min, range.max );
		this.yNegativeValues = this.distribution.getYForXBetween( range.min, range.max );
		this.renderCurvePart( this.xNegativeValues, this.yNegativeValues, this.NEGATIVE_COLOR );
	}

	renderPositiveCurvePart() {
		let range = new NumberRange( 0, Infinity ),
			xValues = this.distribution.getXBetween( range.min, range.max ),
			yValues = this.distribution.getYForXBetween( range.min, range.max );

		// We add the last negative values to the beginning of the arrays to ensure there isn't
		// a thin white line separating the negative and positive sections of the curve
		xValues.unshift( this.xNegativeValues.slice(-1)[0] );
		yValues.unshift( this.yNegativeValues.slice(-1)[0] );

		this.renderCurvePart( xValues, yValues, this.POSITIVE_COLOR );
	}

	renderCurvePart( xValues, yValues, color ) {
		this.renderCurveFilled( xValues, yValues, color );
		this.renderCurveOutline( xValues, yValues, color );
	}

	renderCurveFilled( xValues, yValues, color ) {
		let maxX = Math.max.apply( Math, xValues ),
			minX = Math.min.apply( Math, xValues );

		this.ctx.beginPath();
		this.ctx.moveTo( this.distributionXToCanvasX( minX ), this.rect.bottom );
		xValues.forEach( function( xValue, i ) {
			this.ctx.lineTo( this.distributionXToCanvasX( xValue ), this.distributionYToCanvasY( yValues[ i ] ) );
		}, this );
		this.ctx.lineTo( this.distributionXToCanvasX( maxX ), this.rect.bottom );
		this.ctx.closePath();
		this.ctx.fillStyle = colorUtils.hexToTransparentRGB( color, this.FILL_OPACITY );
		this.ctx.fill();
	}

	renderCurveOutline( xValues, yValues, color ) {
		this.ctx.beginPath();
		xValues.forEach( function( xValue, i ) {
			this.ctx.lineTo( this.distributionXToCanvasX( xValue ), this.distributionYToCanvasY( yValues[ i ] ) );
		}, this );
		this.ctx.lineWidth = this.OUTLINE_LINE_WIDTH;
		this.ctx.strokeStyle = colorUtils.hexToTransparentRGB( color, this.OUTLINE_OPACITY );
		this.ctx.stroke();
	}

	renderAxisValues() {
		let numTicks, canvasY, points, value, canvasX;

		numTicks = this.xAxisRange.getWidth() / this.calculateXAxisInterval() + 1;
		canvasY = this.rect.bottom + this.X_AXIS_TICK_FONT_SIZE + this.X_AXIS_TICK_MARGIN_TOP;
		for ( let i = 0, l = numTicks; i < l; i++ ) {
			points = this.xAxisRange.min + i * this.calculateXAxisInterval();
			value = utils.formatPercentageImprovement( this.convertPointsToPercentage( points ) );
			canvasX = this.rect.x + ( i / ( numTicks - 1 ) ) * this.rect.width;
			this.renderAxisTextWithTick( value, canvasX, canvasY );
		}
	}

	convertPointsToPercentage( points ) {
		let mean = this.getControl().proportion.mean,
			ratio = (points + mean) / mean - 1;

		return Math.round( ratio * 100 );
	}

	setDistribution() {
		if ( this.variations.length !== 2 ) {
			throw 'Normal difference distribution only supports two variations';
		}
		this.distribution = new NormalDifferenceDistribution( this.getControl().proportion, this.getExperiment().proportion );
	}

	calculateXAxisInterval() {
		return this.distribution.xRange.getWidth() / 5;
	}

	calculateXAxisRange() {
		let interval = this.calculateXAxisInterval();
		this.xAxisRange = new NumberRange( Math.floor(this.distribution.xRange.min / interval) * interval, Math.ceil(this.distribution.xRange.max / interval) * interval );
	}

	calculateYAxisRange() {
		this.yAxisRange = this.distribution.getYAxisRange();
	}
}

module.exports = ImprovementGraphRenderer;
