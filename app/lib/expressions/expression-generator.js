
// Require our core node libraries.
var util = require( "util" );

// Require our application libraries.
var createAppError = require( "../util/app-error" ).createAppError;


// Export the factory function.
exports.createExpressionGenerator = createExpressionGenerator;

// Export the constructor function.
exports.ExpressionGenerator = ExpressionGenerator;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create an instance of the ExpressionGenerator using the given bounds and with only
// addition enabled.
function createExpressionGenerator( min, max ) {

	var expressionGenerator = new ExpressionGenerator()
		.withMin( min )
		.withMax( max )
		.withAddition()
		.withoutSubtraction()
		.withoutMultiplication()
		.withoutDivision()
		.withoutFloats()
	;

	return( expressionGenerator );

}


// I generate random arithmetic expressions in the form of "X+Y=" where the operands
// can be randomly generated Ints or Floats and the operators can be addition, 
// subtraction, multiplication, and division.
function ExpressionGenerator() {

	// I hold the collection of active operators.
	this._activeOperators = [];

	// Set the default number of operators in each expression.
	this.setNumberOfOperators( 1 );

	// Enable all the operators.
	this.enableAddition();
	this.enableSubtraction();
	this.enableMultiplication();
	this.enableDivision();

	// Set the default bounds.
	this.setMin( 1 );
	this.setMax( 10 );

	// Disable floats by default since they tend to lead to funky math in JavaScript.
	this.disableFloats();

}


// Configure "class" methods.
ExpressionGenerator.prototype = {

	// ---
	// PUBLIC METHODS.
	// ---


	// I prevent the addition operator from being used in future expression generation.
	disableAddition: function() {

		this._removeOperator( "+" );

	},


	// I prevent the division operator from being used in future expression generation.
	disableDivision: function() {

		this._removeOperator( "/" );

	},


	// I prevent float operands from being used in future expression generation.
	disableFloats: function() {

		this._floatsEnabled = false;

	},


	// I prevent the multiplication operator from being used in future expression generation.
	disableMultiplication: function() {

		this._removeOperator( "*" );

	},


	// I prevent the subtraction operator from being used in future expression generation.
	disableSubtraction: function() {

		this._removeOperator( "-" );

	},


	// I allow the addition operator to be used in future expression generation.
	enableAddition: function() {

		this._addOperator( "+" );

	},


	// I allow the division operator to be used in future expression generation.
	enableDivision: function() {

		this._addOperator( "/" );

	},


	// I allow float operands to be used in future expression generation.
	enableFloats: function() {

		this._floatsEnabled = true;

	},


	// I allow the multiplication operator to be used in future expression generation.
	enableMultiplication: function() {

		this._addOperator( "*" );

	},


	// I allow the subtraction operator to be used in future expression generation.
	enableSubtraction: function() {

		this._addOperator( "-" );

	},


	// I generate and return the next random expression in the form of "X+Y=" where the 
	// set of operators and operands is based on the current generator settings.
	nextExpression: function() {

		// If none of the operators are enabled, we can't produce an expression.
		if ( ! this._activeOperators.length ) {

			throw(
				createAppError({
					type: "App.IllegalState",
					message: "There are no active operators.",
					detail: "An expression cannot be generated until there is at least one active operators."
				})
			);

		}

		// To build the expression, we are going to generate the first operand as our
		// anchor. Then, we're going to attached N operations to it.
		var parts = [ this._randomOperand() ];

		// For each operator that we need to fulfill, we're going generate one operator
		// and one operand, ex. "+3".
		for ( var i = 0 ; i < this._numberOfOperators ; i++ ) {

			parts.push( this._randomOperator() );
			parts.push( this._randomOperand() );

		}

		return( parts.join( "" ) + "=" );

	},


	// I set the upper bounds (inclusive) of our randomly generated operand values.
	setMax: function( newMax ) {

		this.testMax( newMax );

		this._max = newMax;

	},


	// I set the lower bounds (inclusive) of our randomly generated operand values.
	setMin: function( newMin ) {

		this.testMin( newMin );

		this._min = newMin;

	},


	// I set the number of operators to be used in each expression. This value must be
	// greater than zero in order for an expression to be possible.
	setNumberOfOperators: function( newNumberOfOpertors ) {

		this.testNumberOfOperators( newNumberOfOpertors );

		this._numberOfOperators = newNumberOfOpertors;

	},


	// I test to make sure the given upper bounds (inclusive) is valid. If it is valid,
	// I return quietly; if not, I throw an error.
	testMax: function( newMax ) {

		// NOTE: During initialization, the min value may not been set yet. As such, we
		// can only compare the max to the min if the min is available. This is not a
		// problem since the initialization will also test the min, which will catch 
		// any range conflicts.
		if ( this.hasOwnProperty( "_min" ) && ( this._min > newMax ) ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Max is invalid.",
					detail: util.format( "The given max value [%s] must be greater than the current min value [%s].", newMax, this._min )
				})
			);

		}

	},


	// I test to make sure the given lower bounds (inclusive) is valid. If it is valid,
	// I return quietly; if not, I throw an error.
	testMin: function( newMin ) {

		// NOTE: See notes in testMax() as to why we check for existence.
		if ( this.hasOwnProperty( "_max" ) && ( this._max < newMin ) ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Min is invalid.",
					detail: util.format( "The given min value [%s] must be smaller than the current max value [%s].", newMin, this._max )
				})
			);

		}

	},


	// I test to make sure the given number of operators is valid. If it is valid, I 
	// return quietly; if not, I throw an error.
	testNumberOfOperators: function( newNumberOfOpertors ) {

		if ( newNumberOfOpertors < 1 ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Number of operators is invalid.",
					detail: util.format( "The value you passed [%s] must be a positive integer greater than zero.", newNumberOfOpertors )
				})
			);

		}

	},


	// I allow the addition operator to be used in future expression generation. Returns 
	// [this] reference for method chaining. 
	withAddition: function() {

		this.enableAddition();

		return( this );

	},


	// I allow the division operator to be used in future expression generation. Returns
	// [this] reference for method chaining. 
	withDivision: function() {

		this.enableDivision();

		return( this );

	},


	// I allow floats to be used as operands in future expression generation. Returns 
	// [this] reference for method chaining. 
	withFloats: function() {

		this.enableFloats();

		return( this );

	},


	// I set the upper bounds (inclusive) of our randomly generated operand values. 
	// Returns [this] reference for method chaining.
	withMax: function( newMax ) {

		this.setMax( newMax );

		return( this );

	},


	// I set the lower bounds (inclusive) of our randomly generated operand values.
	// Returns [this] reference for method chaining.
	withMin: function( newMin ) {

		this.setMin( newMin );

		return( this );

	},


	// I allow the multiplication operator to be used in future expression generation.
	// Returns [this] reference for method chaining.
	withMultiplication: function() {

		this.enableMultiplication();

		return( this );

	},


	// I set the number of operators to be used in each expression. Returns [this] 
	// reference for method chaining.
	withNumberOfOperators: function( newNumberOfOpertors ) {

		this.setNumberOfOperators( newNumberOfOpertors );

		return( this );

	},


	// I allow the subtraction operator to be used in future expression generation. 
	// Returns [this] reference for method chaining.
	withSubtraction: function() {

		this.enableSubtraction();

		return( this );

	},


	// I prevent the addition operator from being used in future expression generation.
	// Returns [this] reference for method chaining.
	withoutAddition: function() {

		this.disableAddition();

		return( this );

	},
	

	// I prevent the division operator from being used in future expression generation.
	// Returns [this] reference for method chaining.
	withoutDivision: function() {

		this.disableDivision();

		return( this );

	},


	// I prevent float operands from being used in future expression generation. Returns
	// [this] reference for method chaining.
	withoutFloats: function() {

		this.disableFloats();

		return( this );

	},
	

	// I prevent the multiplication operator from being used in future expression 
	// generation. Returns [this] reference for method chaining.
	withoutMultiplication: function() {

		this.disableMultiplication();

		return( this );

	},
	

	// I prevent the subtraction operator from being used in future expression 
	// generation. Returns [this] reference for method chaining.
	withoutSubtraction: function() {

		this.disableSubtraction();

		return( this );

	},


	// ---
	// PRIVATE METHODS.
	// ---


	// I add the given operator to the collection of active operators. If the given 
	// operator is already enabled, this method doesn't do anything.
	_addOperator: function( operator ) {

		// Try to remove the operator first, just to make sure that don't already have 
		// it in the list of active operators. This just keeps the logic simple and 
		// allows the add to be called multiple times without error.
		this._removeOperator( operator );

		this._activeOperators.push( operator );

	},


	// I generate a random boolean value.
	_randomBoolean: function() {

		return( Math.random() > .5 );

	},


	// I generate a random float value, with two decimal places, using the given 
	// bounds (inclusive).
	_randomFloat: function( min, max ) {

		// NOTE: The +1 is to make the max inclusive.
		var delta = ( max - min + 1 );

		// NOTE: The 100/100 is to move the decimal place while we truncate the value in
		// an attempt to limit the number of digits. Of course, floating point maths in 
		// JavaScript is ... "fun"... and we sometimes get like 15 digits.
		return( min + ( Math.floor( Math.random() * delta * 100 ) / 100 ) );

	},


	// I generate a random int value using the given bounds (inclusive).
	_randomInt: function( min, max ) {

		// NOTE: The +1 is to make the max inclusive.
		var delta = ( max - min + 1 );

		return( min + Math.floor( Math.random() * delta ) );

	},


	// I generate a random operand. If floats are enabled, we will randomly switch back
	// and forth between generating floats and ints.
	_randomOperand: function() {

		if ( this._floatsEnabled && this._randomBoolean() ) {

			return( this._randomFloat( this._min, this._max ) );

		} else {

			return( this._randomInt( this._min, this._max ) );
			
		}

	},


	// I generate a random operator based on the collection of enabled operators.
	_randomOperator: function() {

		var operatorCount = this._activeOperators.length;
		var randomIndex = this._randomInt( 0, ( operatorCount - 1 ) );

		return( this._activeOperators[ randomIndex ] );

	},


	// I remove the given operator from the collection of enabled operators.
	_removeOperator: function( operator ) {

		var index = this._activeOperators.indexOf( operator );

		if ( index !== -1 ) {

			this._activeOperators.splice( index, 1 );
			
		}

	}

};