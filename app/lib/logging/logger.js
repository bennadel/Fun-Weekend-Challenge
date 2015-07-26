
// Require our application libraries.
var createAppError = require( "../util/app-error" ).createAppError;


// Export the factory function.
exports.createLogger = createLogger;

// Export the constructor function.
exports.Logger = Logger;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create an instance of the logger with the optional default settings.
function createLogger( writer, defaultSettings ) {

	return( new Logger( writer, ( defaultSettings || {} ) ) );

}


// I log info and error messages to the given writer.
function Logger( writer, defaultSettings ) {

	this.setWriter( writer );
	this.setDefaultSettings( defaultSettings );

}


// Configure "class" methods.
Logger.prototype = {

	// ---
	// PUBLIC METHODS.
	// ---


	// I log the given error along with the given entry.
	error: function( entry, error ) {

		// For the .error( error ) signature.
		if ( arguments.length === 1 ) {

			this._logEntry( "error", "An error occurred.", entry );
			
		// For the .error( entry, error ) signature.
		} else {
			
			this._logEntry( "error", entry, error );

		}

	},


	// I log the given information entry.
	info: function( entry ) {

		this._logEntry( "info", entry );

	},


	// I set the the default settings data. The default settings are just a hash that
	// is mixed into the log entry before it is written.
	setDefaultSettings: function( newDefaultSettings ) {

		this.testDefaultSettings( newDefaultSettings );

		this._defaultSettings = newDefaultSettings;

	},


	// I set the writer, which performs the actual persistence of the log entries.
	setWriter: function( newWriter ) {

		this.testWriter( newWriter );

		this._writer = newWriter;

	},


	// I test to make sure that the default settings is valid. If it is valid, I return
	// quietly; if not, I throw an error.
	testDefaultSettings: function( newDefaultSettings ) {

		if ( ! newDefaultSettings ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Default settings were not provided.",
					detail: "If you do not have default settings, you must supply an empty hash."
				})
			);

		}

	},


	// I test to make sure the writer is valid. If it is valid, I return quietly; if 
	// not, I throw an error.
	testWriter: function( newWriter ) {

		if ( ! newWriter ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Writer was not provided."
				})
			);

		}

	},


	// ---
	// PRIVAT METHODS.
	// ---


	// I ensure that the given value is an object, converting string values to objects
	// that contain the string value being recorded as the "message" key.
	_ensureObject: function( value ) {

		if ( Object.prototype.toString.call( value ) === "[object String]" ) {

			return({
				message: value
			});

		}

		return( value );

	},


	// I collapse the list of objects down into the destination object and return it.
	_extend: function( destination ) {

		for ( var i = 1, length = arguments.length ; i < length ; i++ ) {

			var source = arguments[ i ];

			for ( var key in source ) {

				if ( source.hasOwnProperty( key ) ) {

					destination[ key ] = source[ key ];

				}

			}

		}

		return( destination );

	},


	// I determine if the given value is an actual Error object (including an instance
	// of our AppError, which subclasses Error).
	_isError: function( error ) {

		return( error instanceof Error );

	},


	// I log the given entry to the writer.
	_logEntry: function( level, entry, error ) {

		var data = this._extend(
			{
				_level: level,
				_timestamp: ( new Date() ).toUTCString()
			},
			this._defaultSettings,
			this._ensureObject( entry )
		);

		if ( error && this._isError( error ) ) {

			data.rootCause = this._unrollError( error );		
			
		}

		this._writer.write( JSON.stringify( data ) );

	},


	// I unroll the given error, returning a hash of error data, including properties 
	// that cannot be iterated over.
	_unrollError: function( error ) {

		var errorData = this._extend( {}, error );
		
		// Since the stack trace on an error object doesn't appear to be an enumerable
		// property during serialization, let's check to see if it was copied over during
		// the extend operation. If not, let's manually copy it. We're gonna need this 
		// value in order to get use out of logging.
		if ( error.stack && ! errorData.stack ) {
			
			errorData.stack = error.stack;

		}

		// Since our custom application errors have the opportunity to append the 
		// underlying root error, we should try to unroll that as well, if it exists.
		// This way, errors can be passed back up the stack for more clarity.
		if ( error.rootCause && this._isError( error.rootCause ) ) {

			errorData.rootCause = this._unrollError( error.rootCause );

		}

		return( errorData );

	}

};
