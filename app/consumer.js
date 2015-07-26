
// Require our core node libraries.
var buffer = require( "buffer" ).Buffer;
var http = require( "http" );
var util = require( "util" );

// Require our application libraries.
var createConsoleWriter = require( "./lib/logging/console-writer" ).createConsoleWriter;
var createExpressionEvaluator = require( "./lib/expressions/expression-evaluator" ).createExpressionEvaluator;
var createFileWriter = require( "./lib/logging/file-writer" ).createFileWriter;
var createLogger = require( "./lib/logging/logger" ).createLogger;
var createMultiWriter = require( "./lib/logging/multi-writer" ).createMultiWriter;
var httpUtils = require( "./lib/util/http-utils" );


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// Let's put all of our logs into a single directory.
var logsDirectory = ( __dirname + "/logs/" );

// When we create the general-purpose logger, let's configure it to use a MULTI writer 
// that logs to both the console as well as to the filesystem. This way, we can easily 
// debug without having to tail the log files.
// --
// NOTE: 
var logger = createLogger( 
	createMultiWriter(
		createConsoleWriter(),
		createFileWriter( logsDirectory, "consumer", "json" )
			.withMinuteRotation()
	),
	{
		source_application: "consumer"
	}
);

// Let's create a different logger for the timing metrics (to keep track of how many 
// requests we can handle a second), just to keep them easier to pick apart.
// --
// NOTE: Since metrics recording is far less frequent than request recording, let's 
// back-off the frequency of log rotation to daily.
var metricLogger = createLogger(
	createFileWriter( logsDirectory, "consumer_metrics", "json" )
		.withDayRotation(),
	{
		source_application: "consumer"
	}
);

// Our expression evaluator will take an expression, evaluate it, and return the result.
var expressionEvaluator = createExpressionEvaluator();


// I am the location at which the consumer will be accepting requests.
// --
// TODO: Consider moving these to an ENV property for override.
var consumerHost = "localhost";
var consumerPort = 9090;


// Create our consumer server - we will be listening for requests over HTTP. Each
// request must be a POST of type application/json.
var server = http.createServer(
	function handleRequest( request, response ) {

		// Reject any request that does not have the correct superficial format.
		if ( 
			( request.method !== "POST" ) ||
			( request.headers[ "content-type" ] !== "application/json" )
			) {

			logger.info({
				message: "Rejecting request due to format.",
				method: request.method,
				url: request.url,
				contentType: request.headers[ "content-type" ]
			});

			response.writeHead(
				400,
				"Bad Request",
				{
					"Content-Type": "text/plain"
				}
			);

			return( response.end( "Request must use POST of type application/json." ) );

		}


		// If we made it this far, the request appears to be of the correct format. Now,
		// we need to extract the JSON request body that holds our serialized expression.
		httpUtils.getJsonRequestBody(
			request,
			function handleBody( error, expression ) {

				if ( error ) {

					logger.error( "Failed to parse incoming request.", error );

					response.writeHead(
						400,
						"Bad Request",
						{
							"Content-Type": "text/plain"
						}
					);

					return( response.end( "Request could not be parsed as JSON." ) );

				}

				try {

					var result = expressionEvaluator.evaluate( expression );

					logger.info({
						message: "Expression evaluated.",
						expression: expression,
						result: result
					});

					response.writeHead(
						200,
						"OK",
						{
							"Content-Type": "application/json"
						}
					);

					response.write( JSON.stringify( result ) );

				} catch ( evaluationError ) {

					logger.error(
						{
							message: "Expression evaluation failed.",
							expression: expression
						},
						evaluationError
					);

					response.writeHead(
						500,
						"Internal Server Error",
						{
							"Content-Type": "application/json"
						}
					);

					response.write( JSON.stringify( "Expression could not be evaluated." ) )

				}

				response.end();

			}
		);

	}
);


// When the server starts listening for network requests, we want to start logging the
// number of requests that it can handle per second, see if it gets up to Beast mode.
// --
// NOTE: Since the count doesn't depend on the way in which the request was handled, 
// we can track this in a separate event binding; however, if we wanted to change the 
// logging based on the results, we'd have to move up into the request handler.
server.on(
	"listening",
	function handleListening() {		

		var requestCount = 0;

		// Sample the count every 1,000 milliseconds.
		var timer = setInterval(
			function logRequestCount() {

				metricLogger.info({
					metric: "requests_per_second",
					value: requestCount
				});

				requestCount = 0;

			},
			1000
		);

		// For each request, we're going to blindly increment the count.
		this.on( 
			"request",
			function incrementRequestCount() {

				requestCount++;

			}
		);

		// CAUTION: Since our application never conditionally turns the server off, 
		// we're not going to worry about unbinding the events if a "close" occurs. If
		// the application is updated to include optional "dark periods", we'll need to
		// update this logic to handle a "close" event so that "request" handlers don't
		// get bound over and over and over again.

	}
);


// Start listening for incoming requests.
server.listen( consumerPort, consumerHost );

logger.info( util.format( "Consumer server started, listening on [%s:%d].", consumerHost, consumerPort ) );
