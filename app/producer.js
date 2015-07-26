
// Require our core node libraries.
var http = require( "http" );

// Require our application libraries.
var createConsumerGateway = require( "./lib/gateways/consumer-gateway" ).createConsumerGateway;
var createConsoleWriter = require( "./lib/logging/console-writer" ).createConsoleWriter;
var createExpressionGenerator = require( "./lib/expressions/expression-generator" ).createExpressionGenerator;
var createFileWriter = require( "./lib/logging/file-writer" ).createFileWriter;
var createLogger = require( "./lib/logging/logger" ).createLogger;
var createMultiWriter = require( "./lib/logging/multi-writer" ).createMultiWriter;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// When we create the general-purpose logger, let's configure it to use a MULTI writer 
// that logs to both the console as well as to the filesystem. This way, we can easily 
// debug without having to tail the log files.
var logger = createLogger( 
	createMultiWriter(
		createConsoleWriter(),
		createFileWriter( ( __dirname + "/logs/" ), "producer", "json" )
			.withMinuteRotation()
	),
	{
		source_application: "consumer"
	}
);


// Create our expression generator and make sure to enable simple maths.
// --
// NOTE: I am leaving out .withDivision() and .withFloats() since math in JavaScript 
// doesn't always lead to "happy numbers." The code will run just fine; but, you'll end
// up getting lots of ".9999999999" and ".00000000009" style results.
var expressionGenerator = createExpressionGenerator( -10, 10 )
	.withAddition()
	.withSubtraction()
	.withMultiplication()
;

// I am the location at which the consumer will be accepting requests.
// --
// TODO: Consider moving these to an ENV property for overrides.
var consumerHost = "localhost";
var consumerPort = 9090;

// Create our consumer client.
var consumerGateway = createConsumerGateway( consumerHost, consumerPort );


logger.info( "Starting to generate expressions for the consumer." );

// Because we are depending on an external system, I'm going to try to implement a 
// really simply exponential back-off if the consumer stops responding with success.
var defaultDelay = 10;
var currentDelay = defaultDelay;

sendNextExpression();


// I generate and send a new expressions to the consumer. After each response, I wait 
// a short period before sending another expression.
function sendNextExpression() {

	var expression = expressionGenerator.nextExpression();

	logger.info({
		message: "Sending expression.",
		expression: expression
	});

	consumerGateway.send(
		expression, 
		function handleExpressionResult( error, result ) {

			if ( error ) {

				logger.error(
					{
						message: "Expression returned with failure.",
						expression: expression
					},
					error
				);

				// If the consumer is not responding with a success, it may be unhealthy.
				// Try backing off the requests to give it time to recover.
				// --
				// NOTE: If the problem is on OUR end, this will also help prevent the 
				// logs from blowing up.
				currentDelay *= 1.2;
				
			} else {

				logger.info({
					message: "Expression returned with success.",
					expression: expression,
					result: result
				});

				currentDelay = defaultDelay;

			}

			setTimeout( sendNextExpression, currentDelay );

		}
	);

}
