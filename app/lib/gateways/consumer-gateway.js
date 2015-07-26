
// Require our core node libraries.
var Buffer = require( "buffer" ).Buffer;
var http = require( "http" );
var util = require( "util" );

// Require our application libraries.
var createAppError = require( "../util/app-error" ).createAppError;
var httpUtils = require( "../util/http-utils" );


// Export the factory function.
exports.createConsumerGateway = createConsumerGateway;

// Export the constructor function.
exports.ConsumerGateway = ConsumerGateway;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create a new instance of the ConsumerGateway with the given host and port.
function createConsumerGateway( host, port ) {

	return( new ConsumerGateway( host, port ) );

}


// I provide a client / gateway to the Consumer service that lives at the given host 
// and port.
function ConsumerGateway( host, port ) {

	this.setHost( host );
	this.setPort( port );

}


// Configure "class" methods.
ConsumerGateway.prototype = {

	// ---
	// PUBLIC METHODS.
	// ---


	// I send the given message to the remote consume and pass the result (or error) 
	// to the given callback when complete.
	send: function( message, callback ) {

		try {

			var serializedMessage = JSON.stringify( message );

			var requestConfig = {
				method: "POST",
				host: this._host,
				port: this._port,
				headers: {
					"Content-Type": "application/json",
					"Content-Length": serializedMessage.length
				}
			};

			var request = http.request( requestConfig );

			request.on(
				"error",
				function handleError( error ) {

					callback( error );

				}
			);

			request.on(
				"response",
				function handleResponse( response ) {

					if ( response.statusCode !== 200 ) {

						return(
							callback(
								createAppError({
									type: "App.ConsumerRequestFailure",
									message: "The request to the consumer returned with a non-200 response.",
									detail: util.format( "The consumer responded with status [%d %s].", response.statusCode, response.statusMessage ),
									extendedInfo: util.inspect( requestConfig )
								})
							)
						);

					}

					httpUtils.getJsonResponseBody(
						response,
						function handleBody( error, body ) {

							if ( error ) {

								callback(
									createAppError({
										type: "App.ConsumerRequestFailure",
										message: "The response from the consumer could not be parsed.",
										rootCause: error
									})
								);

							} else {

								callback( null, body );
								
							}

						}
					);

					// TODO: Implement close-binding?

				}
			);

			request.end( serializedMessage );

		} catch ( error ) {

			callback( error );

		}

	},


	// I set the host at which the remote service can be contacted.
	setHost: function( newHost ) {

		this.testHost( newHost );

		this._host = newHost;

	},


	// I set the port at which the remote service can be contacted.
	setPort: function( newPort ) {

		this.testPort( newPort );

		this._port = newPort;

	},


	// I test the host to make sure it is valid. If it is valid, I return quietly; if 
	// not, I throw an error.
	testHost: function( newHost ) {

		if ( ! newHost ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Host was not provided."
				})
			);

		}

	},


	// I test the port to make sure it is valid. If it is valid, I return quietly; if 
	// not, I throw an error.
	testPort: function( newPort ) {

		if ( ! newPort ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Port was not provided."
				})
			);

		}

	},


	// I set the host at which the remote service can be contacted. Returns [this] 
	// reference for method chaining.
	withHost: function( newHost ) {

		this.setHost( newHost );

		return( this );

	},


	// I set the port at which the remote service can be contacted. Returns [this] 
	// reference for method chaining.
	withPort: function( newPort ) {

		this.setPort( newPort );

		return( this );

	}

};
