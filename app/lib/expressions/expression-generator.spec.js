
// Require our core node libraries.
var assert = require( "assert" );
var util = require( "util" );

// Require our application libraries.
var createExpressionGenerator = require( "./expression-generator" ).createExpressionGenerator;
var ExpressionGenerator = require( "./expression-generator" ).ExpressionGenerator;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


/****************************************************************************************

	NOTE: We are doing a lot of high-value looping here because the expression 
	generator using random value generation. As such, I'm looking to make sure that
	I'm not randomly getting a "good" value.

****************************************************************************************/


// The factory will implicitly test the constructor since the factory does NOT provide
// an alternate method signature.
assert.doesNotThrow(
	function testFactory() {

		createExpressionGenerator()
			.withMin( -10 )
			.withMax( 10 )
			.withAddition()
			.withSubtraction()
			.withDivision()
			.withMultiplication()
			.withFloats()
			.withNumberOfOperators( 3 )
			.withoutAddition()
			.withoutSubtraction()
			.withoutDivision()
			.withoutMultiplication()
			.withoutFloats()
		;

	}
);

// Test to make sure expressions are generated with expected lengths.
assert.doesNotThrow(
	function testExpressionLength() {

		var generator = createExpressionGenerator()
			.withMin( 1 )
			.withMax( 9 )
			.withAddition()
			.withSubtraction()
			.withMultiplication()
			.withDivision()
		;

		// With 1 operator.
		for ( var i = 0 ; i < 10000 ; i++ ) {

			assert.equal( generator.nextExpression().length, "1+1=".length );

		}

		// With 2 operators.
		generator.withNumberOfOperators( 2 );

		for ( var i = 0 ; i < 10000 ; i++ ) {

			assert.equal( generator.nextExpression().length, "1+1+1=".length );

		}

		// With 3 operators.
		generator.withNumberOfOperators( 3 );

		for ( var i = 0 ; i < 10000 ; i++ ) {

			assert.equal( generator.nextExpression().length, "1+1+1+1=".length );

		}

	}
);

// Assert that the disabled operators are never used.
assert.doesNotThrow(
	function testExpressionLength() {

		// Addition only.
		var generator = createExpressionGenerator()
			.withMin( 1 )
			.withMax( 9 )
			.withAddition()
			.withoutSubtraction()
			.withoutMultiplication()
			.withoutDivision()
		;

		for ( var i = 0 ; i < 10000 ; i++ ) {

			assert.equal( generator.nextExpression().indexOf( "+" ), 1 );
			assert.equal( generator.nextExpression().indexOf( "-" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "*" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "/" ), -1 );

		}

		// Subtraction only.
		generator
			.withoutAddition()
			.withSubtraction()
		;

		for ( var i = 0 ; i < 10000 ; i++ ) {

			assert.equal( generator.nextExpression().indexOf( "+" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "-" ), 1 );
			assert.equal( generator.nextExpression().indexOf( "*" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "/" ), -1 );

		}

		// Multiplication only.
		generator
			.withoutSubtraction()
			.withMultiplication()
		;

		for ( var i = 0 ; i < 10000 ; i++ ) {

			assert.equal( generator.nextExpression().indexOf( "+" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "-" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "*" ), 1 );
			assert.equal( generator.nextExpression().indexOf( "/" ), -1 );

		}

		// Division only.
		generator
			.withoutMultiplication()
			.withDivision()
		;

		for ( var i = 0 ; i < 10000 ; i++ ) {

			assert.equal( generator.nextExpression().indexOf( "+" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "-" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "*" ), -1 );
			assert.equal( generator.nextExpression().indexOf( "/" ), 1 );

		}

	}
);
