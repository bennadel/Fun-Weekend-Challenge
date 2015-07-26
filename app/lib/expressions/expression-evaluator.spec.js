
// Require our core node libraries.
var assert = require( "assert" );
var util = require( "util" );

// Require our application libraries.
var createExpressionEvaluator = require( "./expression-evaluator" ).createExpressionEvaluator;
var ExpressionEvaluator = require( "./expression-evaluator" ).ExpressionEvaluator;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// The factory will implicitly test the constructor since the factory does NOT provide
// an alternate method signature.
assert.doesNotThrow(
	function testFactory() {

		createExpressionEvaluator();

	}
);

// Test to make sure invalid expressions fail.
[ "", "a", "3_4", "=", "3+4", "100000-5000" ].forEach(
	function iterator( expression ) {

		assert.throws(
			function testInvalidsExpressions() {

				createExpressionEvaluator().evaluate( expression );

			}
		);

	}
);

// Test to make sure good expressions work.
assert.doesNotThrow(
	function testValidExpressions() {

		var expressionEvaluator = createExpressionEvaluator()
			.withDivideByZero()
		;

		for ( var x = -100 ; x < 25 ; x++ ) {

			for ( var y = 100 ; y > -25 ; y-- ) {

				// We don't currently support 0/0 as it results in a NaN value.
				// --
				// NOTE: We are currently allowing divide-by-zero.
				if ( ( x === 0 ) && ( y === 0 ) ) {

					continue;

				}

				assert.equal( expressionEvaluator.evaluate( util.format( "%s+%s=", x, y ) ), ( x + y ) );
				assert.equal( expressionEvaluator.evaluate( util.format( "%s-%s=", x, y ) ), ( x - y ) );
				assert.equal( expressionEvaluator.evaluate( util.format( "%s*%s=", x, y ) ), ( x * y ) );
				assert.equal( expressionEvaluator.evaluate( util.format( "%s/%s=", x, y ) ), ( x / y ) );

			}

		}

	}
);

// Test to make sure divide-by-zero throws when disabled.
assert.throws(
	function testDivideByZeroDisabled() {

		var expressionEvaluator = createExpressionEvaluator()
			.withoutDivideByZero()
		;

		expressionEvaluator.evaluate( "5/0=" );

	}
);
