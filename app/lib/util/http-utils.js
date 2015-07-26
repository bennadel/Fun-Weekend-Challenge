
// Require our core node libraries.
var Buffer = require( "buffer" ).Buffer;

// Require our application libraries.
var createAppError = require( "../util/app-error" ).createAppError;


// Export the static functions.
exports.getJsonMessageBody = getJsonMessageBody;
exports.getJsonRequestBody = getJsonRequestBody;
exports.getJsonResponseBody = getJsonResponseBody;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I take the incoming message, aggregate the body into a JSON payload, and then parse 
// it and return the native value.
// --
// NOTE: IncomingMessage is an instance of http.IncomingMessage.
function getJsonMessageBody( incomingMessage, callback ) {

	var messageBuffer = [];

	// As chunks come in, add them to our message buffer.
	incomingMessage.on(
		"data",
		function handleData( chunk ) {

			messageBuffer.push( chunk );

		}
	);

	// Once we have reached the end of our data, parse the resultant JSON.
	incomingMessage.on(
		"end",
		function handleEnd() {

			var body = Buffer.concat( messageBuffer ).toString();

			try {

				callback( null, JSON.parse( body ) );

			} catch ( deserializationError ) {

				return( callback( deserializationError ) );

			}

		}
	);

	// We are hoping for an End event. But, if the underlying stream is closed 
	// prematurely, I believe that we'll get the close event. In that case, we can't
	// trust that we have the entirety of the body and will have to consider this
	// message to be incomplete.
	// --
	// CAUTION: I am not 100% sure this is true. The documentation on the Streams module
	// is not the easiest content to wrap my head around.
	incomingMessage.on(
		"close",
		function handleClose() {

			callback(
				createAppError({
					type: "App.PrematureEndOfMessage",
					message: "Message closed before content finish streaming."
				})
			);

		}
	);

}


// I take the given request, aggregate the body into a JSON payload, and then parse it
// and return the native value.
// --
// NOTE: Request is an instance of http.IncomingMessage.
function getJsonRequestBody( request, callback ) {

	getJsonMessageBody( request, callback );

}


// I take the given response, aggregate the body into a JSON payload, and then parse it
// and return the native value.
// --
// NOTE: Response is an instance of http.IncomingMessage.
function getJsonResponseBody( response, callback ) {

	getJsonMessageBody( response, callback );

}
