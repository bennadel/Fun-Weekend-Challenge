
// Require our core node libraries.
var util = require( "util" );

// Require our application libraries.
var createAppError = require( "../util/app-error" ).createAppError;


// Export the factory function.
exports.createExpressionEvaluator = createExpressionEvaluator;

// Export the constructor function.
exports.ExpressionEvaluator = ExpressionEvaluator;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create an instance of the ExpressionEvaluator.
function createExpressionEvaluator() {

	return( new ExpressionEvaluator() );

}


// I evaluate arithmetic expressions in the form of "X+Y=" and return the numeric result.
function ExpressionEvaluator() {

	// We are "roughly" looking for a numeric value followed by zero-or-more operators
	// and operands. Example: A[+B[+C[+D[+E]]]]=.
	// --
	// NOTE: We aren't strictly validating the format - we're only making sure that 
	// valid characters appear. We'll defer the actual evaluation step to handle invalid
	// characters in the expression which will be manifested as an evaluation failure.
	this._validationPattern = /^([\d.-]+)(\s*[+\-*\/]\s*[\d.-]+)*=$/i;

	// By default, let's divide-by-zero expressions (which result in Infinity).
	this.disableDivideByZero();

}


// Configure "class" methods.
ExpressionEvaluator.prototype = {

	// ---
	// PUBLIC METHODS.
	// ---


	// I prevent the use of division-by-zero in the expressions. In Node, a division
	// by zero won't explode like it does on your calculator; instead, it returns 
	// Infinity, which is a valid Number in Node.
	// --
	// NOTE: Object.prototype.toString.call( Infinity ) ==> '[object Number]'.
	disableDivideByZero: function() {

		this._divideByZeroEnabled = false;

	},


	// I allow the use of division-by-zero in the expressions. This will result in 
	// return values of Infinity.
	enableDivideByZero: function() {

		this._divideByZeroEnabled = true;

	},


	// I evaluate the given mathematical expression and return the numeric result. 
	// If the expression cannot be evaluated, or it contains invalid operations, an 
	// exception will be thrown.
	evaluate: function( expression ) {

		this.testExpression( expression );

		// Remove the trailing "=" sign - we don't need it for evaluation.
		expression = expression.slice( 0, -1 );

		try {

			// Before we evaluate the expression, we have to perform a little white-space
			// injection to make sure the character sequence is not ambiguous. If we don't
			// do this, then expressions like "5--3" (five minus negative-three) will throw
			// an error because JavaScript is seeing it the postfix operator "--", as in (5--).
			disambiguatedExpression = this._removeSyntaxAmbiguity( expression );

			// CAUTION: While eval() is generally frowned upon as being insecure, we are 
			// not evaluating arbitrary data. The inputs are validated to contain only 
			// numeric-style expressions. As such, we can execute this with confidence.
			// --
			// NOTE: While the use of "(" + ")" isn't strictly required, old habits die 
			// hard - I generally include this to help force an "expression".
			// --
			// TODO: Think about replacing with vm.runInThisContext() for funzies.
			var result = eval( "(" + disambiguatedExpression + ")" );

		} catch ( evalError ) {

			throw(
				createAppError({
					type: "App.EvaluationError",
					message: "Expression evaluation failed.",
					detail: util.format( "An attempt to evaluate the expression [(%s)] failed.", expression ),
					rootCause: evalError
				})
			);

		}

		// Check to see if division-by-zero was used inappropriately.
		if ( this._isInfinity( result ) && ! this._divideByZeroEnabled ) {

			throw(
				createAppError({
					type: "App.IllegalExpression",
					message: "Expression attempted to divide by zero.",
					detail: util.format( "The expression [%s] contains a division by zero operation, which is not supported.", expression ),
					extendedInfo: "Consider using .enableDivideByZero() for extended support."
				})
			);

		}

		if ( isNaN( result ) ) {

			throw(
				createAppError({
					type: "App.IllegalExpression",
					message: "Expression resulted in non-numeric value.",
					detail: util.format( "The expression [%s] resulted in a non-numeric value, which may be due to [0/0] operation.", expression )
				})
			);

		}

		return( result );

	},


	// I test the given expression to make sure it is valid (based on format only). If 
	// it is, I return quietly; if not, I throw an error.
	testExpression: function( expression ) {

		if ( ! this._validationPattern.test( expression ) ) {

			throw(
				createAppError({
					type: "App.IllegalExpression",
					message: "Expression contains unsupported characters.",
					detail: util.format( "The expression [%s] contains characters that are not supported.", expression ),
					extendedInfo: util.format( "Expression evaluated using pattern [%s]", this._validationPattern.source )
				})
			);

		}

	},


	// I allow division-by-zero to be used in expression evaluation. Returns [this] 
	// reference for method chaining.
	withDivideByZero: function() {

		this.enableDivideByZero();

		return( this );

	},


	// I prevent division-by-zero from being used in expression evaluation. Returns 
	// [this] reference for method chaining.
	withoutDivideByZero: function() {

		this.disableDivideByZero();

		return( this );

	},


	// ---
	// PRIVATE METHODS.
	// ---


	// I check to see if the given value is Infinity.
	_isInfinity: function( value ) {

		return( value === Infinity );

	},


	// There are sequences of arithmetic characters that create ambiguity in JavaScript,
	// such as "-5--3". As such, we have to inject white-space to ensure that evaluating
	// of the expression doesn't get confused.
	_removeSyntaxAmbiguity: function( expression ) {

		var expression = expression.replace(
			/[+*\/-]/g,
			function( operator ) {

				return( " " + operator + " " );

			}
		);

		return( expression );

	}

};
